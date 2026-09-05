import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface NewRequestScreenProps {
  onNextStep: (creditType: string) => void;
}

const creditTypes = [
  {
    id: 0, value: 'Immobilier',
    icon: 'home-outline' as const,
    title: 'Crédit Immobilier',
    desc: 'Financement de votre résidence principale ou secondaire.',
    rate: '7,8%', duration: '25 ans max',
  },
  {
    id: 1, value: 'Auto',
    icon: 'car-outline' as const,
    title: 'Crédit Auto',
    desc: "Achat d'un véhicule neuf ou d'occasion.",
    rate: '8,2%', duration: '7 ans max',
  },
  {
    id: 2, value: 'Personnel',
    icon: 'cash-outline' as const,
    title: 'Crédit Personnel',
    desc: 'Financement de vos besoins personnels.',
    rate: '8,9%', duration: '5 ans max',
  },
];

const conditions = [
  'Âge compris entre 21 et 60 ans à l\'échéance',
  'Revenu mensuel stable minimum de 800 TND',
  'Titularisation ou contrat équivalent',
  'Taux d\'endettement inférieur à 40%',
];

const steps = ['Type', 'Documents', 'Analyse', 'Décision'];

export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({ onNextStep }) => {
  const { isRTL } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Stepper */}
      <View style={s.stepper}>
        {steps.map((label, i) => (
          <React.Fragment key={i}>
            <View style={s.stepItem}>
              <View style={[s.stepDot, i === 0 && s.stepDotActive]}>
                {i < 0 ? (
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                ) : (
                  <Text style={[s.stepNum, i === 0 && s.stepNumActive]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[s.stepLabel, i === 0 && s.stepLabelActive]}>{label}</Text>
            </View>
            {i < steps.length - 1 && <View style={s.stepLine} />}
          </React.Fragment>
        ))}
      </View>

      <Text style={[s.pageTitle, isRTL && s.rtl]}>Type de crédit</Text>
      <Text style={[s.pageSub, isRTL && s.rtl]}>
        Sélectionnez le type de financement correspondant à votre projet.
      </Text>

      {/* Cards */}
      {creditTypes.map((ct) => {
        const isActive = selected === ct.id;
        return (
          <TouchableOpacity
            key={ct.id}
            style={[s.card, isActive && s.cardActive, isRTL && { flexDirection: 'row-reverse' }]}
            onPress={() => setSelected(ct.id)}
          >
            <View style={[s.cardIcon, isActive && s.cardIconActive]}>
              <Ionicons name={ct.icon} size={22} color={isActive ? COLORS.primary : COLORS.textMuted} />
            </View>
            <View style={s.cardBody}>
              <Text style={[s.cardTitle, isRTL && s.rtl]}>{ct.title}</Text>
              <Text style={[s.cardDesc, isRTL && s.rtl]}>{ct.desc}</Text>
              <View style={[s.tagRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={s.tag}><Text style={s.tagText}>Taux : {ct.rate}</Text></View>
                <View style={[s.tag, { marginLeft: 6 }]}><Text style={s.tagText}>{ct.duration}</Text></View>
              </View>
            </View>
            <View style={[s.radio, isActive && s.radioActive]} />
          </TouchableOpacity>
        );
      })}

      {/* Eligibility */}
      <View style={s.infoBox}>
        <View style={s.infoHeader}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={s.infoTitle}>Conditions d'éligibilité STB</Text>
        </View>
        {conditions.map((c, i) => (
          <View key={i} style={s.infoRow}>
            <Ionicons name="checkmark" size={14} color={COLORS.success} style={{ marginRight: 8 }} />
            <Text style={s.infoText}>{c}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[s.cta, selected === null && s.ctaDisabled]}
        onPress={() => selected !== null && onNextStep(creditTypes[selected].value)}
        disabled={selected === null}
      >
        <Text style={s.ctaText}>Continuer</Text>
        <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#FFF" style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingBottom: 40 },
  rtl: { textAlign: 'right' },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  stepItem: { alignItems: 'center', width: 66 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  stepNumActive: { color: '#FFF' },
  stepLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
  stepLine: { flex: 1, height: 1, backgroundColor: COLORS.border, marginTop: -10 },

  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  pageSub: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 22 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white, marginBottom: 12,
  },
  cardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  cardIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  cardIconActive: { backgroundColor: COLORS.primaryMid },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  cardDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 16, marginBottom: 8 },
  tagRow: { flexDirection: 'row' },
  tag: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },

  infoBox: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24, marginTop: 8 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginLeft: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  infoText: { fontSize: 12, color: COLORS.textLight, flex: 1, lineHeight: 16 },

  cta: { height: 52, flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  ctaDisabled: { backgroundColor: COLORS.border },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
