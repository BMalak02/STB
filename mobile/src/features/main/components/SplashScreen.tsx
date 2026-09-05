import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { StbLogo } from '../../../components/StbLogo';
import { useTranslation } from '../../../utils/i18n';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useTranslation();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.2)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.2)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 14, friction: 7, useNativeDriver: true }),
    ]).start();

    // Text fade-in after 400ms
    setTimeout(() => {
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 400);

    // Dots pulse loop
    const pulse = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.2, duration: 380, useNativeDriver: true }),
        ])
      );

    const dotsAnim = Animated.parallel([
      pulse(dotOpacity1, 0),
      pulse(dotOpacity2, 180),
      pulse(dotOpacity3, 360),
    ]);
    dotsAnim.start();

    const timer = setTimeout(() => {
      dotsAnim.stop();
      onFinish();
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.View style={[styles.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <StbLogo size={64} color={COLORS.primary} backgroundColor={COLORS.white} />
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.appName}>SmartCredit</Text>
        <Text style={styles.bankName}>Société Tunisienne de Banque</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Connexion sécurisée · Réglementé par la BCT</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  bankName: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    fontSize: 11,
    color: COLORS.textHint,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
});
