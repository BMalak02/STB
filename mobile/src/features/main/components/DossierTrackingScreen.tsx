import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Linking } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface DossierTrackingScreenProps {
  onNavigateToSign?: () => void;
}

const STEPS = [
  { id: 0, key: 'Réception du dossier',   icon: 'cloud-upload-outline' as const,      done: true,  date: '14/07/2026 · 09:12', eta: '' },
  { id: 1, key: 'Vérification des documents', icon: 'document-text-outline' as const, done: true,  date: '14/07/2026 · 14:35', eta: '' },
  { id: 2, key: 'Évaluation du score IA',  icon: 'analytics-outline' as const,         done: true,  date: '15/07/2026 · 08:20', eta: '' },
  { id: 3, key: 'Décision de crédit',      icon: 'checkmark-circle-outline' as const,  done: false, date: '',                   eta: 'Délai estimé : 24h ouvrables', active: true },
  { id: 4, key: 'Signature du contrat',    icon: 'create-outline' as const,            done: false, date: '',                   eta: 'Après décision favorable' },
  { id: 5, key: 'Déblocage des fonds',     icon: 'wallet-outline' as const,            done: false, date: '',                   eta: 'Sous 48h après signature' },
];

export const DossierTrackingScreen: React.FC<DossierTrackingScreenProps> = ({ onNavigateToSign }) => {
  const { isRTL } = useTranslation();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  const done = STEPS.filter(s => s.done).length;
  const pct  = Math.round((done / STEPS.length) * 100);

  return (
    <Animated.ScrollView style={[s.container, { opacity: fadeIn }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Résumé du dossier ── */}
      <View style={s.summaryCard}>
        <View style={s.summaryRow}>
          <View>
            <Text style={s.summaryRef}>#CR2026-0042</Text>
            <Text style={s.summaryType}>Crédit Personnel · STB SmartCredit</Text>
          </View>
          <View style={s.statusPill}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>En cours</Text>
          </View>
        </View>

        <View style={s.summaryValues}>
          <View style={s.summaryVal}>
            <Text style={s.summaryValLabel}>Montant</Text>
            <Text style={s.summaryValNum}>25 000 TND</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryVal}>
            <Text style={s.summaryValLabel}>Durée</Text>
            <Text style={s.summaryValNum}>48 mois</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryVal}>
            <Text style={s.summaryValLabel}>Mensualité</Text>
            <Text style={s.summaryValNum}>621 TND</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryVal}>
            <Text style={s.summaryValLabel}>Taux</Text>
            <Text style={s.summaryValNum}>8,5%</Text>
          </View>
        </View>

        <View style={s.summaryMeta}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
          <Text style={s.summaryMetaText}>Soumis le 14/07/2026 à 09:12</Text>
          <Ionicons name="person-outline" size={12} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
          <Text style={s.summaryMetaText}>Réf. STB-DX-2026-0042</Text>
        </View>

        <View style={s.progressRow}>
          <Text style={s.progressLabel}>{done} / {STEPS.length} étapes complétées</Text>
          <Text style={s.progressPct}>{pct}%</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* ── Timeline ── */}
      <Text style={s.sectionTitle}>Avancement du dossier</Text>
      {STEPS.map((st, i) => {
        const isLast = i === STEPS.length - 1;
        return (
          <View key={st.id} style={s.stepRow}>
            <View style={s.stepTrack}>
              <View style={[s.stepCircle, st.done && s.stepCircleDone, (st as any).active && s.stepCircleActive]}>
                {st.done
                  ? <Ionicons name="checkmark" size={14} color="#FFF" />
                  : <Ionicons name={st.icon} size={13} color={(st as any).active ? COLORS.primary : COLORS.textHint} />
                }
              </View>
              {!isLast && <View style={[s.stepLineV, st.done && s.stepLineVDone]} />}
            </View>
            <View style={s.stepContent}>
              <Text style={[s.stepTitle, st.done && s.stepTitleDone, (st as any).active && s.stepTitleActive]}>
                {st.key}
              </Text>
              {st.date !== '' && (
                <Text style={s.stepDate}>
                  <Ionicons name="checkmark-circle" size={11} color={COLORS.success} /> {st.date}
                </Text>
              )}
              {st.eta !== '' && !st.done && (
                <Text style={[(st as any).active ? s.stepActiveNote : s.stepPending]}>
                  {st.eta}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {/* ── Signature CTA ── */}
      {onNavigateToSign && (
        <TouchableOpacity style={s.signCta} onPress={onNavigateToSign}>
          <Ionicons name="create-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={s.signCtaText}>Signer le contrat en ligne</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}

      {/* ── Documents soumis ── */}
      <Text style={s.sectionTitle}>Documents soumis</Text>
      <View style={s.docsCard}>
        {[
          { name: 'Carte Nationale d\'Identité', icon: 'card-outline', ok: true },
          { name: '3 fiches de paie', icon: 'document-text-outline', ok: true },
          { name: 'Relevé bancaire (3 mois)', icon: 'stats-chart-outline', ok: true },
          { name: 'Justificatif de domicile', icon: 'home-outline', ok: false },
        ].map((d, i, arr) => (
          <View key={i} style={[s.docRow, i < arr.length - 1 && s.docRowBorder]}>
            <Ionicons name={d.icon as any} size={16} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            <Text style={s.docName}>{d.name}</Text>
            <Ionicons
              name={d.ok ? 'checkmark-circle' : 'alert-circle-outline'}
              size={16}
              color={d.ok ? COLORS.success : COLORS.warning}
            />
          </View>
        ))}
      </View>

      {/* ── Conseiller ── */}
      <Text style={s.sectionTitle}>Votre conseiller</Text>
      <View style={s.advisorCard}>
        <View style={s.advisorRow}>
          <View style={s.advisorAvatar}><Text style={s.advisorInitials}>AM</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.advisorName}>M. Ahmed Maaloul</Text>
            <Text style={s.advisorRole}>Chargé de crédit · STB Tunis Centre</Text>
            <Text style={s.advisorHours}>Disponible : Lun–Ven 8h–17h</Text>
          </View>
        </View>
        <View style={s.advisorActions}>
          <TouchableOpacity style={[s.advisorBtn, s.advisorBtnPrimary]} onPress={() => Linking.openURL('tel:+21671148000')}>
            <Ionicons name="call-outline" size={15} color="#FFF" />
            <Text style={s.advisorBtnTextWhite}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.advisorBtn, s.advisorBtnOutline]}>
            <Ionicons name="mail-outline" size={15} color={COLORS.primary} />
            <Text style={s.advisorBtnTextBlue}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.advisorBtn, s.advisorBtnOutline]}>
            <Ionicons name="chatbubble-outline" size={15} color={COLORS.primary} />
            <Text style={s.advisorBtnTextBlue}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 22,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  summaryRef: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  summaryType: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  summaryValues: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 10, padding: 12, marginBottom: 12,
  },
  summaryVal: { flex: 1, alignItems: 'center' },
  summaryValLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  summaryValNum: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  summaryDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  summaryMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryMetaText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginLeft: 4 },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  progressPct: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  progressBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 12, marginTop: 6,
  },

  stepRow: { flexDirection: 'row', marginBottom: 0 },
  stepTrack: { width: 36, alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepCircleDone: { backgroundColor: COLORS.success },
  stepCircleActive: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary },
  stepLineV: { width: 1.5, flex: 1, backgroundColor: COLORS.border, minHeight: 20, marginVertical: 2 },
  stepLineVDone: { backgroundColor: COLORS.success },
  stepContent: { flex: 1, paddingLeft: 10, paddingBottom: 20 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  stepTitleDone: { color: COLORS.text },
  stepTitleActive: { color: COLORS.text, fontWeight: '700' },
  stepDate: { fontSize: 11, color: COLORS.success, marginTop: 3, fontWeight: '500' },
  stepActiveNote: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 3 },
  stepPending: { fontSize: 11, color: COLORS.textHint, marginTop: 2, fontWeight: '500' },

  signCta: {
    flexDirection: 'row', height: 50, backgroundColor: COLORS.primary,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 22,
  },
  signCtaText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  docsCard: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: 20, paddingHorizontal: 14,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  docRowBorder: { borderBottomWidth: 1, borderColor: COLORS.borderLight },
  docName: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.text },

  advisorCard: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  advisorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  advisorAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryMid,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  advisorInitials: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  advisorName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  advisorRole: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  advisorHours: { fontSize: 10, color: COLORS.textHint, marginTop: 2, fontWeight: '500' },
  advisorActions: { flexDirection: 'row', gap: 8 },
  advisorBtn: { flex: 1, flexDirection: 'row', height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 5 },
  advisorBtnPrimary: { backgroundColor: COLORS.primary },
  advisorBtnOutline: { borderWidth: 1.5, borderColor: COLORS.primaryMid, backgroundColor: COLORS.white },
  advisorBtnTextWhite: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  advisorBtnTextBlue: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
