import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { t, isRTL } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const slides = [
    {
      id: 0,
      titleKey: 'onboarding_s1_title',
      subKey: 'onboarding_s1_sub',
      isDark: true,
      illustration: () => (
        <View style={styles.illContainer}>
          {/* Phone Frame */}
          <View style={styles.phoneFrame}>
            <View style={styles.phoneScreen}>
              <View style={[styles.docItem, { width: '80%', backgroundColor: COLORS.primary }]} />
              <View style={[styles.docItem, { width: '60%' }]} />
              <View style={[styles.docItem, { width: '70%', backgroundColor: COLORS.accent }]} />
              <View style={[styles.docItem, { width: '50%' }]} />
            </View>
          </View>
          {/* Clean Floating Documents */}
          <View style={[styles.floatingDocCard, { top: 30, left: 15, transform: [{ rotate: '-12deg' }] }]}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={[styles.floatingDocCard, { top: 80, right: 15, transform: [{ rotate: '12deg' }] }]}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.accent} />
          </View>
          <View style={[styles.floatingDocCard, { bottom: 50, left: 20, transform: [{ rotate: '8deg' }] }]}>
            <Ionicons name="cash-outline" size={18} color={COLORS.success} />
          </View>
        </View>
      ),
    },
    {
      id: 1,
      titleKey: 'onboarding_s2_title',
      subKey: 'onboarding_s2_sub',
      isDark: false,
      illustration: () => (
        <View style={styles.illContainer}>
          {/* Compliance Scanner Graphic */}
          <View style={styles.scannerCircle}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.accent} />
            <View style={styles.scanLine} />
          </View>
          <View style={styles.scanTargetCard}>
            <Ionicons name="document-outline" size={24} color={COLORS.primary} />
          </View>
        </View>
      ),
    },
    {
      id: 2,
      titleKey: 'onboarding_s3_title',
      subKey: 'onboarding_s3_sub',
      isDark: true,
      illustration: () => (
        <View style={styles.illContainer}>
          {/* Success Validation Badge */}
          <View style={styles.badgeCircle}>
            <View style={styles.badgeCheck}>
              <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
            </View>
          </View>
          {/* Elegant secondary accents */}
          <View style={[styles.smallCardAccent, { top: 40, left: 30 }]} />
          <View style={[styles.smallCardAccent, { bottom: 50, right: 40, backgroundColor: COLORS.accent }]} />
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      const nextSlide = activeSlide + 1;
      scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true });
      setActiveSlide(nextSlide);
    } else {
      onFinish();
    }
  };

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeSlide && slide >= 0 && slide < slides.length) {
      setActiveSlide(slide);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: slides[activeSlide].isDark ? COLORS.primaryDark : '#FFFFFF' }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => {
          const isDark = slide.isDark;
          return (
            <View key={slide.id} style={styles.slide}>
              <View style={styles.illWrapper}>
                {slide.illustration()}
              </View>
              
              <View style={styles.textWrapper}>
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : COLORS.text }]}>
                  {t(slide.titleKey as any)}
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#E0E0E0' : COLORS.textMuted }]}>
                  {t(slide.subKey as any)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer controls */}
      <View style={styles.footer}>
        {/* Slide indicator dots */}
        <View style={styles.indicators}>
          {slides.map((_, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            const scale = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [1, 1.3, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity,
                    transform: [{ scale }],
                    backgroundColor: slides[activeSlide].isDark ? '#FFFFFF' : COLORS.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: slides[activeSlide].isDark ? COLORS.accent : COLORS.primary,
            },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {activeSlide === slides.length - 1 ? t('onboarding_start') : t('onboarding_next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height: height * 0.82,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  illWrapper: {
    width: '100%',
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  textWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  footer: {
    height: height * 0.18,
    width: '100%',
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Graphics styles
  illContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  phoneFrame: {
    width: 110,
    height: 190,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: '#ECEFF1',
    backgroundColor: '#FFFFFF',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'center',
  },
  docItem: {
    height: 8,
    backgroundColor: '#CFD8DC',
    borderRadius: 3,
    marginBottom: 12,
  },
  floatingDocCard: {
    position: 'absolute',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },

  // Compliance Scanner Graphic
  scannerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: COLORS.accent,
    top: 70,
  },
  scanTargetCard: {
    position: 'absolute',
    bottom: 15,
    right: 25,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#B0BEC5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  // Success validation badge
  badgeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCheck: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  smallCardAccent: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#FFB300',
    opacity: 0.6,
  },
});
