import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Linking, Alert } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation, Language } from '../../../utils/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { logout } from '../../auth/store/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '../../../theme/shadows';

export const ProfileScreen = () => {
  const { t, locale, setLocale, isRTL } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const userName  = user?.name  || 'Client STB';
  const userEmail = user?.email || 'client@stb.com.tn';
  const initials  = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled]             = useState(true);
  const [smsEnabled, setSmsEnabled]               = useState(true);

  const handleLanguageChange = (lang: Language) => setLocale(lang);
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const Row = ({ icon, label, value, onPress, danger = false, right }: {
    icon: string; label: string; value?: string;
    onPress?: () => void; danger?: boolean; right?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[s.row, isRTL && { flexDirection: 'row-reverse' }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[s.rowIcon, danger && { backgroundColor: COLORS.errorLight }]}>
        <Ionicons name={icon as any} size={17} color={danger ? COLORS.error : COLORS.primary} />
      </View>
      <Text style={[s.rowLabel, danger && { color: COLORS.error }, isRTL && { textAlign: 'right' }]}>
        {label}
      </Text>
      <View style={s.rowRight}>
        {value && <Text style={s.rowValue}>{value}</Text>}
        {right}
        {!right && !value && onPress && (
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={COLORS.textHint} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.profileHeader}>
        <View style={s.avatarWrapper}>
          <View style={[s.avatarCircle, SHADOWS.sm]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <TouchableOpacity style={s.avatarEdit}>
            <Ionicons name="camera-outline" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={s.profileName}>{userName}</Text>
        <Text style={s.profileEmail}>{userEmail}</Text>
        <View style={s.clientRow}>
          <View style={s.clientBadge}>
            <Ionicons name="id-card-outline" size={12} color={COLORS.textMuted} />
            <Text style={s.clientId}>N° Client : STB-******842</Text>
          </View>
        </View>
        {/* Score rapide */}
        <View style={s.scoreRow}>
          <View style={s.scoreMini}>
            <Text style={s.scoreMiniLabel}>Score IA</Text>
            <Text style={[s.scoreMiniValue, { color: COLORS.success }]}>74/100</Text>
          </View>
          <View style={s.scoreSep} />
          <View style={s.scoreMini}>
            <Text style={s.scoreMiniLabel}>Crédits actifs</Text>
            <Text style={s.scoreMiniValue}>1</Text>
          </View>
          <View style={s.scoreSep} />
          <View style={s.scoreMini}>
            <Text style={s.scoreMiniLabel}>Encours</Text>
            <Text style={s.scoreMiniValue}>60 000 TND</Text>
          </View>
        </View>
      </View>

      {/* ── Produits STB ── */}
      <Text style={s.sectionHeader}>{t('profile_products_section')}</Text>
      <View style={s.card}>
        <Row icon="card-outline" label="Carte Mastercard STB Gold" value="**** 1284" />
        <View style={s.divider} />
        <Row icon="wallet-outline" label="Compte Courant Chèque" value="…0500600" />
        <View style={s.divider} />
        <Row icon="receipt-outline" label="Relevé bancaire" onPress={() => {}} />
      </View>

      {/* ── Informations personnelles ── */}
      <Text style={s.sectionHeader}>{t('profile_info_section')}</Text>
      <View style={s.card}>
        <Row icon="person-outline"       label={isRTL ? 'تعديل البيانات' : 'Modifier mes informations'} onPress={() => {}} />
        <View style={s.divider} />
        <Row icon="lock-closed-outline"  label={isRTL ? 'تغيير كلمة المرور' : 'Changer le code secret'}  onPress={() => {}} />
        <View style={s.divider} />
        <Row icon="phone-portrait-outline" label="Numéro de téléphone" value="+216 *** *** 921" />
        <View style={s.divider} />
        <Row icon="location-outline"     label="Adresse" value="Tunis, Tunisie" />
        <View style={s.divider} />
        <Row icon="document-text-outline" label="Mes documents téléchargés" onPress={() => {}} />
      </View>

      {/* ── Sécurité ── */}
      <Text style={s.sectionHeader}>{t('profile_security_section')}</Text>
      <View style={s.card}>
        <Row
          icon="finger-print-outline"
          label={isRTL ? 'تسجيل البيومترية' : 'Connexion biométrique'}
          right={
            <Switch value={biometricsEnabled} onValueChange={setBiometricsEnabled}
              trackColor={{ true: COLORS.primary, false: COLORS.border }} thumbColor="#FFF" />
          }
        />
        <View style={s.divider} />
        <Row icon="shield-checkmark-outline" label="Authentification à 2 facteurs" value="Activée" />
        <View style={s.divider} />
        <Row icon="key-outline" label="Historique des connexions" onPress={() => {}} />
      </View>

      {/* ── Notifications ── */}
      <Text style={s.sectionHeader}>{t('profile_notif_section')}</Text>
      <View style={s.card}>
        <Row
          icon="notifications-outline"
          label={isRTL ? 'إشعارات الدفع' : 'Notifications push'}
          right={
            <Switch value={pushEnabled} onValueChange={setPushEnabled}
              trackColor={{ true: COLORS.primary, false: COLORS.border }} thumbColor="#FFF" />
          }
        />
        <View style={s.divider} />
        <Row
          icon="chatbubble-outline"
          label="Alertes SMS"
          right={
            <Switch value={smsEnabled} onValueChange={setSmsEnabled}
              trackColor={{ true: COLORS.primary, false: COLORS.border }} thumbColor="#FFF" />
          }
        />
      </View>

      {/* ── Langue ── */}
      <Text style={s.sectionHeader}>{t('profile_pref_section')}</Text>
      <View style={s.card}>
        <View style={[s.row, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={s.rowIcon}>
            <Ionicons name="language-outline" size={17} color={COLORS.primary} />
          </View>
          <Text style={[s.rowLabel, isRTL && { textAlign: 'right' }]}>{t('profile_pref_lang')}</Text>
          <View style={s.langGroup}>
            {(['fr', 'ar', 'en'] as Language[]).map(lang => (
              <TouchableOpacity
                key={lang}
                style={[s.langBtn, locale === lang && s.langBtnActive]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={[s.langText, locale === lang && s.langTextActive]}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.divider} />
        <Row icon="color-palette-outline" label="Thème de l'application" value="Clair" onPress={() => {}} />
      </View>

      {/* ── Support ── */}
      <Text style={s.sectionHeader}>Support & Aide</Text>
      <View style={s.card}>
        <Row icon="headset-outline"            label="Centre d'aide STB"                onPress={() => {}} />
        <View style={s.divider} />
        <Row icon="call-outline"               label="Appeler le support"               value="71 148 000"
          onPress={() => Linking.openURL('tel:+21671148000')} />
        <View style={s.divider} />
        <Row icon="chatbox-ellipses-outline"   label="Chat en ligne"                    onPress={() => {}} />
        <View style={s.divider} />
        <Row icon="shield-checkmark-outline"   label="Politique de confidentialité"     onPress={() => {}} />
        <View style={s.divider} />
        <Row icon="document-outline"           label="Conditions Générales d'Utilisation" onPress={() => {}} />
        <View style={s.divider} />
        <Row icon="star-outline"               label="Noter l'application"              onPress={() => {}} />
      </View>

      {/* ── Déconnexion ── */}
      <View style={[s.card, { marginBottom: 0 }]}>
        <Row icon="log-out-outline" label={isRTL ? 'تسجيل الخروج' : 'Se déconnecter'} danger onPress={handleLogout} />
      </View>

      <Text style={s.footer}>STB SmartCredit v2.1 · © 2026 Société Tunisienne de Banque</Text>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  profileHeader: {
    backgroundColor: COLORS.white, alignItems: 'center',
    paddingTop: 28, paddingBottom: 20,
    borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2, borderColor: COLORS.primaryMid,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  profileName: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  profileEmail: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', marginBottom: 10 },
  clientRow: { marginBottom: 14 },
  clientBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  clientId: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginLeft: 5 },

  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 10, paddingVertical: 10,
    paddingHorizontal: 20, width: '90%', borderWidth: 1, borderColor: COLORS.border,
  },
  scoreMini: { flex: 1, alignItems: 'center' },
  scoreMiniLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  scoreMiniValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  scoreSep: { width: 1, height: 28, backgroundColor: COLORS.border },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingBottom: 6, marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 18 },
  rowIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.text },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginLeft: 64 },

  langGroup: { flexDirection: 'row', gap: 4 },
  langBtn: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, borderWidth: 1.5, borderColor: COLORS.border },
  langBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  langTextActive: { color: '#FFF' },

  footer: { fontSize: 11, color: COLORS.textHint, textAlign: 'center', marginTop: 12, fontWeight: '500' },
});
