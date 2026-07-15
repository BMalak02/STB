import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import Svg, { Circle, G } from 'react-native-svg';

interface AiScoreResultScreenProps {
  onContinue: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const AiScoreResultScreen: React.FC<AiScoreResultScreenProps> = ({ onContinue }) => {
  const { t, isRTL } = useTranslation();
  const score = 78;
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: score / 100,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getScoreColor = (val: number) => {
    if (val >= 70) return COLORS.success;
    if (val >= 40) return COLORS.warning;
    return COLORS.error;
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Blue Header */}
        <View style={styles.blueHeader}>
          <Text style={styles.headerTitle}>{t('score_title')}</Text>
          <Text style={styles.headerSub}>{t('score_sub')}</Text>
        </View>

        {/* Circular Score Gauge */}
        <View style={styles.gaugeSection}>
          <View style={styles.gaugeContainer}>
            <Svg width={160} height={160} viewBox="0 0 160 160">
              <G transform="rotate(-90 80 80)">
                {/* Background Ring */}
                <Circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#ECEFF1"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Active Ring */}
                <AnimatedCircle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={scoreColor}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
            
            {/* Centered Score */}
            <View style={styles.scoreTextWrapper}>
              <Text style={[styles.scoreValue, { color: COLORS.text }]}>{score}</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>
          </View>
          
          {/* Risk Level Badge */}
          <View style={[styles.badge, { backgroundColor: 'rgba(46, 125, 50, 0.12)' }]}>
            <Text style={[styles.badgeText, { color: COLORS.success }]}>{t('score_label')}</Text>
          </View>
        </View>

        {/* Score Breakdown Bars */}
        <View style={styles.breakdownSection}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تقييم معايير القبول' : 'Synthèse des critères réglementaires'}
          </Text>

          {/* Factor 1 */}
          <View style={styles.factorRow}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorName}>{t('score_factor_income')}</Text>
              <Text style={styles.factorPercent}>80%</Text>
            </View>
            <View style={styles.factorBarBg}>
              <View style={[styles.factorBarActive, { width: '80%', backgroundColor: COLORS.primary }]} />
            </View>
          </View>

          {/* Factor 2 */}
          <View style={styles.factorRow}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorName}>{t('score_factor_stability')}</Text>
              <Text style={styles.factorPercent}>70%</Text>
            </View>
            <View style={styles.factorBarBg}>
              <View style={[styles.factorBarActive, { width: '70%', backgroundColor: COLORS.primary }]} />
            </View>
          </View>

          {/* Factor 3 */}
          <View style={styles.factorRow}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorName}>{t('score_factor_history')}</Text>
              <Text style={styles.factorPercent}>75%</Text>
            </View>
            <View style={styles.factorBarBg}>
              <View style={[styles.factorBarActive, { width: '75%', backgroundColor: COLORS.primary }]} />
            </View>
          </View>

          {/* Factor 4 */}
          <View style={styles.factorRow}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorName}>{t('score_factor_dti')}</Text>
              <Text style={styles.factorPercent}>60%</Text>
            </View>
            <View style={styles.factorBarBg}>
              <View style={[styles.factorBarActive, { width: '60%', backgroundColor: COLORS.accent }]} />
            </View>
          </View>
        </View>

        {/* Processing Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <Animated.View style={[styles.pulseIndicator, { opacity: pulseAnim }]} />
            <Text style={styles.statusTitle}>{t('score_status_card')}</Text>
          </View>
          <Text style={styles.statusDesc}>{t('score_status_est')}</Text>
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity style={styles.ctaButton} onPress={onContinue}>
          <Text style={styles.ctaButtonText}>{t('score_cta')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  blueHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 35,
    paddingHorizontal: 24,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: '#E3F2FD',
    lineHeight: 18,
  },
  gaugeSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  gaugeContainer: {
    position: 'relative',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  scoreMax: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 15,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  breakdownSection: {
    paddingHorizontal: 24,
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  factorRow: {
    marginBottom: 16,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  factorName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  factorPercent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  factorBarBg: {
    height: 6,
    backgroundColor: '#F0F4F8',
    borderRadius: 3,
  },
  factorBarActive: {
    height: '100%',
    borderRadius: 3,
  },
  statusCard: {
    backgroundColor: '#F5F7FA',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    marginVertical: 15,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingLeft: 16,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
