import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface NewRequestScreenProps {
  onNextStep: (selectedCreditType: string) => void;
}

export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({ onNextStep }) => {
  const { t, isRTL } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);

  const creditTypes = [
    {
      id: 0,
      title: 'req_card1_title',
      desc: 'req_card1_desc',
      value: 'Immobilier',
      iconName: 'home-outline' as const,
    },
    {
      id: 1,
      title: 'req_card2_title',
      desc: 'req_card2_desc',
      value: 'Auto',
      iconName: 'car-outline' as const,
    },
    {
      id: 2,
      title: 'req_card3_title',
      desc: 'req_card3_desc',
      value: 'Personnel',
      iconName: 'cash-outline' as const,
    },
  ];

  const handleNext = () => {
    if (selected !== null) {
      onNextStep(creditTypes[selected].value);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Progress Stepper */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepWrapper}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <Text style={styles.stepLabelActive}>1</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepWrapper}>
          <View style={styles.stepDot} />
          <Text style={styles.stepLabel}>2</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepWrapper}>
          <View style={styles.stepDot} />
          <Text style={styles.stepLabel}>3</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepWrapper}>
          <View style={styles.stepDot} />
          <Text style={styles.stepLabel}>4</Text>
        </View>
      </View>

      <Text style={[styles.stepSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('req_step')}
      </Text>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('req_title')}
      </Text>
      <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('req_sub')}
      </Text>

      {/* Credit cards selector */}
      <View style={styles.cardsContainer}>
        {creditTypes.map((type) => {
          const isSelected = selected === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => setSelected(type.id)}
            >
              <View style={[styles.iconContainer, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}>
                <Ionicons name={type.iconName} size={24} color={isSelected ? COLORS.primary : COLORS.textMuted} />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(type.title as any)}
                </Text>
                <Text style={[styles.cardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(type.desc as any)}
                </Text>
              </View>
              
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next Step Action */}
      <TouchableOpacity
        style={[styles.nextButton, selected === null && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={selected === null}
      >
        <Text style={styles.nextButtonText}>{t('req_next')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  stepWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECEFF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    position: 'absolute',
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabelActive: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#ECEFF1',
    marginHorizontal: 8,
  },
  stepSubtitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 28,
  },
  cardsContainer: {
    marginBottom: 35,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(21, 101, 192, 0.04)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CFD8DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonDisabled: {
    backgroundColor: '#ECEFF1',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
