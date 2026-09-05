import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onFinish: () => void;
}

const slides = [
  {
    id: 0,
    icon: 'document-text-outline' as const,
    title: 'Demande de crédit simplifiée',
    sub: 'Déposez votre dossier entièrement en ligne, sans vous déplacer en agence.',
  },
  {
    id: 1,
    icon: 'shield-checkmark-outline' as const,
    title: 'Analyse intelligente sécurisée',
    sub: 'Notre système évalue votre éligibilité en quelques minutes, en conformité avec la BCT.',
  },
  {
    id: 2,
    icon: 'checkmark-circle-outline' as const,
    title: 'Décision rapide & signature en ligne',
    sub: 'Signez votre contrat électroniquement et recevez vos fonds sous 48h.',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { isRTL } = useTranslation();
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActive(index);
  };

  const handleNext = () => {
    if (active < slides.length - 1) goTo(active + 1);
    else onFinish();
  };

  return (
    <View style={styles.container}>
      {/* Skip */}
      {active < slides.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={onFinish}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== active && i >= 0 && i < slides.length) setActive(i);
        }}
        style={styles.scroll}
      >
        {slides.map((s) => (
          <View key={s.id} style={styles.slide}>
            <View style={styles.iconBox}>
              <Ionicons name={s.icon} size={42} color={COLORS.primary} />
            </View>
            <Text style={[styles.slideTitle, isRTL && { textAlign: 'right' }]}>{s.title}</Text>
            <Text style={[styles.slideSub, isRTL && { textAlign: 'right' }]}>{s.sub}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === active && styles.dotActive]}
            />
          ))}
        </View>

        {/* Next / Start */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {active === slides.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  scroll: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 80,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 30,
  },
  slideSub: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
