import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { StbLogo } from '../../../components/StbLogo';
import { useTranslation } from '../../../utils/i18n';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Ionicons } from '@expo/vector-icons';

interface HomeDashboardProps {
  onNavigateToTab: (tabIndex: number) => void;
  onOpenDossierDetail: () => void;
}

const { width } = Dimensions.get('window');

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigateToTab, onOpenDossierDetail }) => {
  const { t, isRTL } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.name || 'Mohamed';

  // Simulator State
  const [amount, setAmount] = useState(25000); // 1 000 to 100 000 TND
  const [duration, setDuration] = useState(48); // 12 to 84 months

  // Calculate simulated monthly payment (Rough real-world formula)
  const interestRate = 0.085; // 8.5% STB interest rate
  const monthlyInterest = interestRate / 12;
  const payment = (amount * monthlyInterest) / (1 - Math.pow(1 + monthlyInterest, -duration));
  const estimatedMonthly = Math.round(payment);

  // Custom Touch Slider Helper
  const renderAmountSlider = () => {
    const min = 1000;
    const max = 100000;
    const percentage = ((amount - min) / (max - min)) * 100;
    
    const handleTouch = (event: any) => {
      const touchX = event.nativeEvent.locationX;
      const sliderWidth = width - 80;
      const newPercentage = Math.max(0, Math.min(100, (touchX / sliderWidth) * 100));
      const newValue = min + Math.round(((max - min) * newPercentage) / 100);
      setAmount(Math.round(newValue / 500) * 500);
    };

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>{t('home_sim_amount')}</Text>
          <Text style={styles.sliderValue}>{amount.toLocaleString()} {t('home_sim_currency')}</Text>
        </View>
        <View 
          style={styles.sliderBarWrapper} 
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
        >
          <View style={styles.sliderTrackBg} />
          <View style={[styles.sliderTrackActive, { width: `${percentage}%` }]} />
          <View style={[styles.sliderThumb, { left: `${percentage}%`, marginLeft: -10 }]} />
        </View>
        <View style={styles.sliderMinMaxRow}>
          <Text style={styles.sliderMinMax}>1 000 {t('home_sim_currency')}</Text>
          <Text style={styles.sliderMinMax}>100 000 {t('home_sim_currency')}</Text>
        </View>
      </View>
    );
  };

  const renderDurationSlider = () => {
    const min = 12;
    const max = 84;
    const percentage = ((duration - min) / (max - min)) * 100;
    
    const handleTouch = (event: any) => {
      const touchX = event.nativeEvent.locationX;
      const sliderWidth = width - 80;
      const newPercentage = Math.max(0, Math.min(100, (touchX / sliderWidth) * 100));
      const newValue = min + Math.round(((max - min) * newPercentage) / 100);
      setDuration(Math.max(min, Math.min(max, newValue)));
    };

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>{t('home_sim_duration')}</Text>
          <Text style={styles.sliderValue}>{duration} {t('home_sim_months')}</Text>
        </View>
        <View 
          style={styles.sliderBarWrapper} 
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
        >
          <View style={styles.sliderTrackBg} />
          <View style={[styles.sliderTrackActive, { width: `${percentage}%` }]} />
          <View style={[styles.sliderThumb, { left: `${percentage}%`, marginLeft: -10 }]} />
        </View>
        <View style={styles.sliderMinMaxRow}>
          <Text style={styles.sliderMinMax}>12 {t('home_sim_months')}</Text>
          <Text style={styles.sliderMinMax}>84 {t('home_sim_months')}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>
              {t('home_welcome')}{firstName}
            </Text>
            <Text style={styles.headerSub}>Société Tunisienne de Banque</Text>
          </View>
          <StbLogo size={42} color="#1565C0" backgroundColor="#FFFFFF" />
        </View>

        {/* Active request card */}
        <TouchableOpacity style={styles.activeRequestCard} onPress={onOpenDossierDetail}>
          <View style={styles.badgeRow}>
            <View style={styles.activeBadge} />
            <Text style={styles.activeBadgeText}>{t('home_badge_active')}</Text>
          </View>
          <View style={styles.requestProgressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>Dossier #CR2026-0042</Text>
              <Text style={styles.progressStatus}>{isRTL ? 'تحت الدراسة' : 'En cours d\'analyse'}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarActive, { width: '60%' }]} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'خدمات التمويل' : 'Mes services'}
        </Text>
      </View>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateToTab(1)}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.primary} style={styles.actionIcon} />
          <Text style={styles.actionText}>{t('home_action_new')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateToTab(2)}>
          <Ionicons name="folder-open-outline" size={24} color={COLORS.primary} style={styles.actionIcon} />
          <Text style={styles.actionText}>{t('home_action_files')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateToTab(3)}>
          <View style={styles.notifBadgeCount}>
            <Text style={styles.notifBadgeText}>2</Text>
          </View>
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} style={styles.actionIcon} />
          <Text style={styles.actionText}>{t('home_action_notifs')}</Text>
        </TouchableOpacity>
      </View>

      {/* Simulator Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('home_sim_title')}
        </Text>
      </View>
      <View style={styles.simulatorCard}>
        {renderAmountSlider()}
        {renderDurationSlider()}

        {/* Result Block */}
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>{t('home_sim_result')}</Text>
          <Text style={styles.resultValue}>
            {estimatedMonthly.toLocaleString()} <Text style={styles.resultCurrency}>{t('home_sim_currency')}/m</Text>
          </Text>
          <Text style={styles.interestLabel}>T.E.G fixe : 8.5% (hors assurance emprunteur)</Text>
        </View>

        <TouchableOpacity style={styles.simulatorButton} onPress={() => onNavigateToTab(1)}>
          <Text style={styles.simulatorButtonText}>
            {isRTL ? 'محاكاة الطلب' : 'Déposer une demande'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 35,
    paddingHorizontal: 20,
    paddingBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#BBDEFB',
    fontSize: 13,
    marginTop: 2,
  },
  activeRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  activeBadgeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  requestProgressContainer: {
    marginTop: 2,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#ECEFF1',
    borderRadius: 3,
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    width: (width - 60) / 3,
    height: 95,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  notifBadgeCount: {
    position: 'absolute',
    top: 10,
    right: 22,
    backgroundColor: COLORS.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  simulatorCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sliderValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sliderBarWrapper: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    height: 6,
    backgroundColor: '#ECEFF1',
    borderRadius: 3,
  },
  sliderTrackActive: {
    height: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 3,
    position: 'absolute',
    top: 12,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.primary,
    position: 'absolute',
    top: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderMinMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderMinMax: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  resultCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  resultLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  resultCurrency: {
    fontSize: 15,
    fontWeight: '600',
  },
  interestLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  simulatorButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  simulatorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
