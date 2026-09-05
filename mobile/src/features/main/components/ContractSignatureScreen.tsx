import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Dimensions, Platform,
} from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path as SvgPath } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ContractSignatureScreenProps {
  onSigned?: () => void;
}

export const ContractSignatureScreen: React.FC<ContractSignatureScreenProps> = ({ onSigned }) => {
  const { isRTL } = useTranslation();

  const [paths, setPaths]           = useState<Array<Array<{x: number; y: number}>>>([]);
  const [currentPath, setCurrentPath] = useState<Array<{x: number; y: number}>>([]);
  const [otpSent, setOtpSent]       = useState(false);
  const [otpCode, setOtpCode]       = useState('');
  const [otpTimer, setOtpTimer]     = useState(59);
  const [loading, setLoading]       = useState(false);
  const [isSigned, setIsSigned]     = useState(false);

  useEffect(() => {
    let iv: any;
    if (otpSent && otpTimer > 0) {
      iv = setInterval(() => setOtpTimer(p => p - 1), 1000);
    }
    return () => clearInterval(iv);
  }, [otpSent, otpTimer]);

  const handleSendOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setOtpTimer(59);
      setLoading(false);
      Alert.alert('Code de sécurité', 'Votre code de signature temporaire est : 2026');
    }, 1200);
  };

  const handleTouchStart = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath([{ x: locationX, y: locationY }]);
  };

  const handleTouchMove = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
  };

  const handleTouchEnd = () => {
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath([]);
    }
  };

  const handleConfirm = () => {
    if (paths.length === 0) {
      Alert.alert('Signature requise', 'Veuillez apposer votre signature avant de valider.');
      return;
    }
    if (!otpSent || otpCode !== '2026') {
      Alert.alert('Code invalide', 'Saisissez le code reçu par SMS (2026 pour la simulation).');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSigned(true);
    }, 1500);
  };

  const getPathStr = (points: Array<{x: number; y: number}>) => {
    if (!points.length) return '';
    return points.reduce((d, p, i) => d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
  };

  /* ── Success screen ── */
  if (isSigned) {
    return (
      <View style={s.successRoot}>
        <View style={s.successCard}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle-outline" size={52} color={COLORS.success} />
          </View>
          <Text style={s.successTitle}>Contrat signé</Text>
          <Text style={s.successSub}>
            Votre prêt personnel STB est validé. Les fonds seront débloqués sous 48h ouvrées.
          </Text>

          <View style={s.receiptBox}>
            {[
              { label: 'Réf. Transaction', value: 'STB-TX-20268420' },
              { label: 'Mode de signature', value: 'OTP SMS + Tactile' },
              { label: 'Horodatage', value: new Date().toLocaleString() },
            ].map((r, i) => (
              <View key={i} style={[s.receiptRow, i > 0 && { borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 8, marginTop: 8 }]}>
                <Text style={s.receiptLabel}>{r.label}</Text>
                <Text style={s.receiptValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.outlineBtn}>
            <Ionicons name="download-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={s.outlineBtnText}>Télécharger le contrat (PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.primaryBtn} onPress={onSigned}>
            <Text style={s.primaryBtnText}>Retour au suivi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Main signature screen ── */
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Contract preview */}
      <Text style={s.sectionLabel}>Contrat de Prêt STB SmartCredit</Text>
      <View style={s.contractBox}>
        <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
          <Text style={s.contractTitle}>CONDITIONS PARTICULIÈRES DU CONTRAT DE CRÉDIT</Text>
          {[
            ['Objet', 'Prêt à la consommation — besoins personnels.'],
            ['Montant', '25 000 TND (Vingt-Cinq Mille Dinars Tunisiens).'],
            ['Taux', 'T.E.G. fixe de 8,5% l\'an hors assurance.'],
            ['Durée', '48 mensualités de 685 TND.'],
            ['Signature', 'Conformément à la réglementation BCT, la signature électronique à double facteur (OTP SMS + signature tactile) est juridiquement opposable.'],
          ].map(([k, v], i) => (
            <Text key={i} style={s.contractText}>
              <Text style={s.contractKey}>{k} : </Text>{v}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Step 1 — OTP */}
      <Text style={s.sectionLabel}>1. Validation de sécurité SMS</Text>
      {!otpSent ? (
        <TouchableOpacity style={s.outlineBtn} onPress={handleSendOtp} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.primary} />
            : <>
                <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={s.outlineBtnText}>Recevoir mon code par SMS</Text>
              </>
          }
        </TouchableOpacity>
      ) : (
        <View style={s.otpBox}>
          <View style={s.otpRow}>
            <TextInput
              style={s.otpInput}
              keyboardType="number-pad"
              placeholder="Code à 4 chiffres"
              placeholderTextColor={COLORS.textHint}
              value={otpCode}
              onChangeText={setOtpCode}
              maxLength={4}
            />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              {otpTimer > 0
                ? <Text style={s.timerText}>Renvoyer dans {otpTimer}s</Text>
                : <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={s.resendText}>Renvoyer</Text>
                  </TouchableOpacity>
              }
            </View>
          </View>
          <Text style={s.otpHint}>Pour la démonstration, saisissez « 2026 ».</Text>
        </View>
      )}

      {/* Step 2 — Signature pad */}
      <View style={s.padHeader}>
        <Text style={s.sectionLabel}>2. Signature tactile</Text>
        <TouchableOpacity onPress={() => { setPaths([]); setCurrentPath([]); }}>
          <Text style={s.clearText}>Effacer</Text>
        </TouchableOpacity>
      </View>

      <View
        style={s.signaturePad}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {paths.length === 0 && currentPath.length === 0 && (
          <View style={s.padPlaceholder}>
            <Ionicons name="create-outline" size={28} color={COLORS.textHint} />
            <Text style={s.padHint}>Signez ici avec votre doigt</Text>
          </View>
        )}
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((p, i) => (
            <SvgPath key={i} d={getPathStr(p)} stroke={COLORS.text} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          ))}
          {currentPath.length > 0 && (
            <SvgPath d={getPathStr(currentPath)} stroke={COLORS.text} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          )}
        </Svg>
      </View>

      {/* Confirm */}
      <TouchableOpacity
        style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
        onPress={handleConfirm}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFF" />
          : <Text style={s.primaryBtnText}>Valider et signer le contrat</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingBottom: 48 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: COLORS.text,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, marginTop: 4,
  },

  /* Contract */
  contractBox: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  contractTitle: {
    fontSize: 10, fontWeight: '700', color: COLORS.textMuted,
    textAlign: 'center', letterSpacing: 0.5, marginBottom: 10,
    textTransform: 'uppercase',
  },
  contractText: { fontSize: 12, color: COLORS.textLight, lineHeight: 18, marginBottom: 6 },
  contractKey: { fontWeight: '700', color: COLORS.text },

  /* OTP */
  otpBox: {
    backgroundColor: COLORS.background,
    borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 24,
  },
  otpRow: { flexDirection: 'row', alignItems: 'center' },
  otpInput: {
    height: 44, width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 12,
    fontSize: 16, fontWeight: '700', color: COLORS.text,
    marginRight: 12,
  },
  timerText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'right' },
  resendText: { fontSize: 12, color: COLORS.primary, fontWeight: '700', textAlign: 'right' },
  otpHint: { fontSize: 11, color: COLORS.textHint, marginTop: 8, fontWeight: '500' },

  /* Signature pad */
  padHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clearText: { fontSize: 13, fontWeight: '700', color: COLORS.error },
  signaturePad: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.background,
    marginBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  padPlaceholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padHint: { fontSize: 12, color: COLORS.textHint, marginTop: 6, fontWeight: '500' },

  /* Buttons */
  primaryBtn: {
    height: 52, backgroundColor: COLORS.primary,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, flexDirection: 'row',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  outlineBtn: {
    height: 48, flexDirection: 'row',
    borderWidth: 1.5, borderColor: COLORS.primaryMid,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, backgroundColor: COLORS.white,
  },
  outlineBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  /* Success */
  successRoot: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', padding: 24,
  },
  successCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 24, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  successSub: {
    fontSize: 13, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 19, marginBottom: 20,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 18,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  receiptValue: { fontSize: 12, color: COLORS.text, fontWeight: '700' },
});
