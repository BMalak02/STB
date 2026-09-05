import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface AiScoreResultScreenProps {
  onContinue: () => void;
  onNewRequest: () => void;
}

export const AiScoreResultScreen: React.FC<AiScoreResultScreenProps> = ({ onContinue, onNewRequest }) => {
  const { isRTL } = useTranslation();
  const score = 74;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const barAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scoreAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: score / 100, duration: 1000, useNativeDriver: false }),
    ]).start();
  }, []);

  const criteria = [
    { label: 'Capacité de remboursement', pct: 82, ok: true },
    { label: 'Historique de crédit', pct: 71, ok: true },
    { label: 'Stabilité d\'emploi', pct: 90, ok: true },
    { label: 'Taux d\'endettement actuel', pct: 38, ok: false },
  ];

  const tips = [
    'Réduire les crédits en cours avant la demande',
    'Maintenir un solde compte positif 6 mois consécutifs',
    'Fournir les 3 dernières fiches de paie certifiées',
  ];

  const riskColor = score >= 70 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;
  const riskLabel = score >= 70 ? 'Risque faible' : score >= 50 ? 'Risque modéré' : 'Risque élevé';

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Score card */}
      <View style={s.scoreCard}>
        <Text style={s.scoreCardLabel}>Score d'éligibilité</Text>
        <Animated.Text style={[s.scoreNumber, { opacity: scoreAnim }]}>{score}</Animated.Text>
        <Text style={s.scoreMax}>/100</Text>

        {/* Score bar */}
        <View style={s.scoreBg}>
          <Animated.View style={[s.scoreFill, { width: barWidth, backgroundColor: riskColor }]} />
        </View>

        {/* Markers */}
        <View style={s.markers}>
          <Text style={[s.marker, { color: COLORS.error }]}>0</Text>
          <Text style={[s.marker, { color: COLORS.warning, left: '50%' }]}>50</Text>
          <Text style={[s.marker, { color: COLORS.success, right: 0 }]}>100</Text>
        </View>

        <View style={[s.riskBadge, { backgroundColor: riskColor + '20' }]}>
          <View style={[s.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[s.riskText, { color: riskColor }]}>{riskLabel}</Text>
        </View>

        <Text style={s.avgNote}>Moyenne nationale STB : 68 / 100</Text>
      </View>

      {/* Criteria */}
      <Text style={s.sectionTitle}>Détail des critères</Text>
      {criteria.map((c, i) => (
        <View key={i} style={s.criteriaRow}>
          <View style={s.criteriaLabelRow}>
            <Text style={[s.criteriaLabel, isRTL && { textAlign: 'right' }]}>{c.label}</Text>
            <Text style={[s.criteriaPct, { color: c.ok ? COLORS.success : COLORS.warning }]}>{c.pct}%</Text>
          </View>
          <View style={s.criteriaBg}>
            <View style={[s.criteriaFill, { width: `${c.pct}%`, backgroundColor: c.ok ? COLORS.success : COLORS.warning }]} />
          </View>
        </View>
      ))}

      {/* Tips */}
      <View style={s.tipsBox}>
        <View style={s.tipsHeader}>
          <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
          <Text style={s.tipsTitle}>Recommandations</Text>
        </View>
        {tips.map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Text style={s.tipNum}>{i + 1}.</Text>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      {score >= 60 ? (
        <TouchableOpacity style={s.primaryBtn} onPress={onContinue}>
          <Text style={s.primaryBtnText}>Poursuivre la demande</Text>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#FFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      ) : (
        <>
          <View style={s.declinedBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
            <Text style={s.declinedText}>
              Votre dossier ne répond pas encore aux critères d'éligibilité. Contactez votre conseiller STB.
            </Text>
          </View>
          <TouchableOpacity style={s.outlineBtn} onPress={onNewRequest}>
            <Text style={s.outlineBtnText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingBottom: 40 },

  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 28,
  },
  scoreCardLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  scoreNumber: { fontSize: 64, fontWeight: '700', color: COLORS.text, lineHeight: 68 },
  scoreMax: { fontSize: 16, color: COLORS.textMuted, marginBottom: 16 },

  scoreBg: { width: '100%', height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 4 },
  markers: { flexDirection: 'row', width: '100%', marginBottom: 14, position: 'relative', height: 16 },
  marker: { fontSize: 10, fontWeight: '700', position: 'absolute' },

  riskBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, marginBottom: 10 },
  riskDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  riskText: { fontSize: 12, fontWeight: '700' },
  avgNote: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },

  criteriaRow: { marginBottom: 16 },
  criteriaLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  criteriaLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  criteriaPct: { fontSize: 13, fontWeight: '700' },
  criteriaBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  criteriaFill: { height: '100%', borderRadius: 3 },

  tipsBox: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginTop: 8, marginBottom: 24 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginLeft: 6 },
  tipRow: { flexDirection: 'row', marginBottom: 6 },
  tipNum: { fontSize: 12, fontWeight: '700', color: COLORS.primary, width: 20 },
  tipText: { fontSize: 12, color: COLORS.textLight, flex: 1, lineHeight: 17 },

  primaryBtn: { height: 52, flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  outlineBtn: { height: 52, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textLight },

  declinedBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF3E0', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#FFE0B2' },
  declinedText: { fontSize: 12, color: COLORS.warning, marginLeft: 8, flex: 1, lineHeight: 18 },
});
