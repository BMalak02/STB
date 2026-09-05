import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HomeDashboardProps {
  onNavigateToTab: (index: number) => void;
  onOpenDossierDetail: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigateToTab, onOpenDossierDetail }) => {
  const { t, isRTL } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Cher Client';

  const [amount, setAmount]     = useState(25000);
  const [duration, setDuration] = useState(48);

  const monthlyRate = 0.085 / 12;
  const estimatedMonthly = Math.round(
    (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration))
  );

  const makeSlider = (
    value: number, min: number, max: number, step: number,
    setter: (v: number) => void, label: string, valueLabel: string,
    minLabel: string, maxLabel: string
  ) => {
    const pct = ((value - min) / (max - min)) * 100;
    const onTouch = (e: any) => {
      const x = e.nativeEvent.locationX;
      const sw = width - 80;
      const p = Math.max(0, Math.min(100, (x / sw) * 100));
      setter(Math.round((min + ((max - min) * p) / 100) / step) * step);
    };
    return (
      <View style={s.sliderBlock}>
        <View style={s.sliderLabelRow}>
          <Text style={s.sliderLabel}>{label}</Text>
          <Text style={s.sliderValue}>{valueLabel}</Text>
        </View>
        <View style={s.sliderTrackWrapper} onTouchStart={onTouch} onTouchMove={onTouch}>
          <View style={s.sliderTrackBg} />
          <View style={[s.sliderTrackFill, { width: `${pct}%` }]} />
          <View style={[s.sliderThumb, { left: `${pct}%`, marginLeft: -11 }]} />
        </View>
        <View style={s.sliderMinMaxRow}>
          <Text style={s.sliderMinMax}>{minLabel}</Text>
          <Text style={s.sliderMinMax}>{maxLabel}</Text>
        </View>
      </View>
    );
  };

  const bars = [
    { m: 'Jan', v: 70 }, { m: 'Fév', v: 70 }, { m: 'Mar', v: 70 },
    { m: 'Avr', v: 70 }, { m: 'Mai', v: 70 }, { m: 'Jun', v: 0 },
  ];

  const actions = [
    { label: 'Nouvelle\ndemande',    icon: 'add-circle-outline' as const,       tab: 1, badge: 0 },
    { label: 'Mon\ndossier',          icon: 'folder-open-outline' as const,      tab: 2, badge: 0 },
    { label: 'Notifications',         icon: 'notifications-outline' as const,    tab: 3, badge: 2 },
    { label: 'Simulateur',            icon: 'calculator-outline' as const,       tab: 1, badge: 0 },
    { label: 'Conseiller',            icon: 'headset-outline' as const,          tab: 4, badge: 0 },
    { label: 'Mon profil',            icon: 'person-outline' as const,           tab: 4, badge: 0 },
  ];

  const offers = [
    { title: 'Crédit Vert STB', sub: 'Financement éco-responsable · Taux préférentiel 7,2%', icon: 'leaf-outline' as const },
    { title: 'Prêt Etudiant',   sub: 'Jusqu\'à 15 000 TND · Remboursement après diplôme',      icon: 'school-outline' as const },
    { title: 'Crédit Express',  sub: 'Réponse en 24h · Montant jusqu\'à 5 000 TND',             icon: 'flash-outline' as const },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{isRTL ? 'مرحباً،' : 'Bonjour,'} {firstName} 👋</Text>
          <Text style={s.headerSub}>Dernière connexion : aujourd'hui à 10:45</Text>
        </View>
        <View style={s.headerRight}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textMuted} />
          <View style={s.notifDot} />
        </View>
      </View>

      {/* ── Dossier actif ── */}
      <TouchableOpacity style={s.dossierCard} onPress={onOpenDossierDetail} activeOpacity={0.85}>
        <View style={s.dossierTopRow}>
          <View style={s.dossierStatusRow}>
            <View style={s.statusDot} />
            <Text style={s.dossierStatus}>En cours d'analyse</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
        <Text style={s.dossierRef}>#CR2026-0042 · Crédit Personnel</Text>
        <Text style={s.dossierAmount}>25 000 TND</Text>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: '60%' }]} />
        </View>
        <View style={s.dossierFooter}>
          <Text style={s.dossierFooterText}>Avancement : 60%</Text>
          <Text style={s.dossierFooterText}>Soumis le 14/07/2026</Text>
        </View>
      </TouchableOpacity>

      {/* ── Mini stats ── */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Ionicons name="wallet-outline" size={18} color={COLORS.primary} style={{ marginBottom: 6 }} />
          <Text style={s.statLabel}>Encours total</Text>
          <Text style={s.statValue}>60 000 TND</Text>
          <Text style={s.statSub}>1 crédit actif</Text>
        </View>
        <View style={[s.statCard, { marginHorizontal: 8 }]}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginBottom: 6 }} />
          <Text style={s.statLabel}>Mensualité</Text>
          <Text style={s.statValue}>685 TND</Text>
          <Text style={s.statSub}>Prochaine: 05/08</Text>
        </View>
        <View style={s.statCard}>
          <Ionicons name="trending-up-outline" size={18} color={COLORS.success} style={{ marginBottom: 6 }} />
          <Text style={s.statLabel}>Score IA</Text>
          <Text style={[s.statValue, { color: COLORS.success }]}>74 / 100</Text>
          <Text style={s.statSub}>Faible risque</Text>
        </View>
      </View>

      {/* ── Services ── */}
      <Text style={s.sectionTitle}>Services rapides</Text>
      <View style={s.actionsGrid}>
        {actions.map((a, i) => (
          <TouchableOpacity key={i} style={s.actionCard} onPress={() => onNavigateToTab(a.tab)}>
            {a.badge > 0 && (
              <View style={s.actionBadge}><Text style={s.actionBadgeText}>{a.badge}</Text></View>
            )}
            <View style={s.actionIconBox}>
              <Ionicons name={a.icon} size={22} color={COLORS.primary} />
            </View>
            <Text style={s.actionLabel} numberOfLines={2}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Graphique remboursements ── */}
      <Text style={s.sectionTitle}>Remboursements récents</Text>
      <View style={s.chartCard}>
        <View style={s.chartHeader}>
          <View>
            <Text style={s.chartTitle}>Crédit Auto #CR2024-0012</Text>
            <Text style={s.chartSub}>16 / 48 échéances · Taux 8,2%</Text>
          </View>
          <View style={s.chartBadge}>
            <Text style={s.chartBadgeText}>À jour</Text>
          </View>
        </View>
        <View style={s.barsRow}>
          {bars.map((b, i) => (
            <View key={i} style={s.barCol}>
              <View style={s.barTrack}>
                <View style={[s.barFill, { height: `${b.v}%`, backgroundColor: b.v > 0 ? COLORS.primary : COLORS.border }]} />
              </View>
              <Text style={s.barLabel}>{b.m}</Text>
            </View>
          ))}
        </View>
        <View style={s.chartFooter}>
          <Text style={s.chartFooterText}>Prochaine échéance : 05 Août 2026 · 685 TND</Text>
        </View>
      </View>

      {/* ── Simulateur ── */}
      <Text style={s.sectionTitle}>Simulateur de crédit</Text>
      <View style={s.simCard}>
        {makeSlider(amount, 1000, 100000, 500, setAmount,
          t('home_sim_amount'), `${amount.toLocaleString()} TND`, '1 000 TND', '100 000 TND')}
        {makeSlider(duration, 12, 84, 1, setDuration,
          t('home_sim_duration'), `${duration} mois`, '12 mois', '84 mois')}

        <View style={s.simResult}>
          <Text style={s.simResultLabel}>Mensualité estimée</Text>
          <Text style={s.simResultValue}>{estimatedMonthly.toLocaleString()} TND / mois</Text>
          <Text style={s.simResultRate}>T.E.G. fixe indicatif : 8,5% · Sous réserve d'approbation</Text>
        </View>

        <TouchableOpacity style={s.simCta} onPress={() => onNavigateToTab(1)}>
          <Text style={s.simCtaText}>Déposer une demande</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      {/* ── Offres STB ── */}
      <Text style={s.sectionTitle}>Offres spéciales STB</Text>
      {offers.map((o, i) => (
        <TouchableOpacity key={i} style={s.offerRow}>
          <View style={s.offerIcon}>
            <Ionicons name={o.icon} size={20} color={COLORS.primary} />
          </View>
          <View style={s.offerBody}>
            <Text style={s.offerTitle}>{o.title}</Text>
            <Text style={s.offerSub}>{o.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textHint} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16,
    borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 14,
  },
  greeting: { fontSize: 19, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 3, fontWeight: '500' },
  headerRight: { position: 'relative' },
  notifDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.white },

  dossierCard: {
    marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14,
  },
  dossierTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dossierStatusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary, marginRight: 6 },
  dossierStatus: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  dossierRef: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  dossierAmount: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  progressBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  dossierFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  dossierFooterText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start',
  },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  statSub: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase',
    letterSpacing: 0.6, paddingHorizontal: 16, marginBottom: 10, marginTop: 4,
  },

  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 20,
  },
  actionCard: {
    width: (width - 52) / 3, backgroundColor: COLORS.white, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    position: 'relative',
  },
  actionIconBox: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 7,
  },
  actionLabel: { fontSize: 10, fontWeight: '600', color: COLORS.text, textAlign: 'center', lineHeight: 14 },
  actionBadge: {
    position: 'absolute', top: 7, right: 10, backgroundColor: COLORS.error,
    minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  actionBadgeText: { fontSize: 9, color: '#FFF', fontWeight: '700' },

  chartCard: {
    marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  chartTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  chartSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  chartBadge: { backgroundColor: COLORS.successLight, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  chartBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.success },
  barsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 64, marginBottom: 12 },
  barCol: { alignItems: 'center', width: 36 },
  barTrack: { width: 16, height: 52, backgroundColor: COLORS.borderLight, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 },
  chartFooter: { borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 10 },
  chartFooterText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  simCard: {
    marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  sliderBlock: { marginBottom: 18 },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  sliderValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  sliderTrackWrapper: { height: 28, justifyContent: 'center', position: 'relative' },
  sliderTrackBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
  sliderTrackFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2, position: 'absolute', top: 12 },
  sliderThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.white,
    borderWidth: 3, borderColor: COLORS.primary, position: 'absolute', top: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  sliderMinMaxRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderMinMax: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  simResult: {
    backgroundColor: COLORS.background, borderRadius: 10, padding: 14,
    alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  simResultLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  simResultValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  simResultRate: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '500', textAlign: 'center' },
  simCta: {
    height: 48, flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  simCtaText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  offerRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  offerIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  offerBody: { flex: 1 },
  offerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  offerSub: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },
});
