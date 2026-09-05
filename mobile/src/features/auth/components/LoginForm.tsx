import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../../../theme/colors';
import { StbLogo } from '../../../components/StbLogo';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

export const LoginForm = () => {
  const { t, isRTL } = useTranslation();
  const { control, handleSubmit, formState: { errors } } = useForm();
  const { login, loading, error: authError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError]     = useState<string | null>(null);
  const [rememberMe, setRememberMe]     = useState(true);
  const [emailFocused, setEmailFocused]     = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const onSubmit = async (data: any) => {
    setLocalError(null);
    try {
      await login(data);
    } catch (err: any) {
      setLocalError(err.message || 'Erreur de connexion');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo + Branding ── */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <StbLogo size={52} color="#1565C0" backgroundColor="#FFFFFF" />
          </View>
          <Text style={styles.bankName}>SOCIÉTÉ TUNISIENNE DE BANQUE</Text>
          <Text style={styles.appName}>SmartCredit</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <Text style={[styles.heading, isRTL && styles.rtl]}>
            {t('login_title')}
          </Text>
          <Text style={[styles.subheading, isRTL && styles.rtl]}>
            {t('login_sub')}
          </Text>

          {/* Error banner */}
          {(authError || localError) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#C62828" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{authError || localError}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={[styles.label, isRTL && styles.rtl]}>{t('login_email')}</Text>
          <Controller
            control={control}
            rules={{ required: true }}
            name="email"
            defaultValue=""
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused,
                  errors.email && styles.inputInvalid,
                  isRTL && styles.rtlInput,
                ]}
                placeholder={isRTL ? 'البريد الإلكتروني' : 'exemple@stb.com.tn'}
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => { onBlur(); setEmailFocused(false); }}
              />
            )}
          />
          {errors.email && (
            <Text style={[styles.fieldError, isRTL && styles.rtl]}>
              {isRTL ? 'البريد الإلكتروني مطلوب' : 'Identifiant requis'}
            </Text>
          )}

          {/* Password */}
          <Text style={[styles.label, isRTL && styles.rtl]}>{t('login_password')}</Text>
          <Controller
            control={control}
            rules={{ required: true }}
            name="password"
            defaultValue=""
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[
                styles.inputRow,
                passwordFocused && styles.inputFocused,
                errors.password && styles.inputInvalid,
                isRTL && { flexDirection: 'row-reverse' },
              ]}>
                <TextInput
                  style={[styles.passwordInput, isRTL && styles.rtlInput]}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => { onBlur(); setPasswordFocused(false); }}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text style={[styles.fieldError, isRTL && styles.rtl]}>
              {isRTL ? 'رمز المرور مطلوب' : 'Code secret requis'}
            </Text>
          )}

          {/* Remember me / Forgot */}
          <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity
              style={[styles.row, { gap: 8 }, isRTL && { flexDirection: 'row-reverse' }]}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberText}>
                {isRTL ? 'تذكرني' : 'Se souvenir'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>{t('login_forgot')}</Text>
            </TouchableOpacity>
          </View>

          {/* Connect CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.primaryBtnText}>{t('login_cta')}</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>{t('login_or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Biometrics */}
          <TouchableOpacity
            style={[styles.outlineBtn, isRTL && { flexDirection: 'row-reverse' }]}
            onPress={handleSubmit(onSubmit)}
          >
            <Ionicons name="finger-print-outline" size={20} color={COLORS.primary} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
            <Text style={styles.outlineBtnText}>{t('login_biometrics')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Ionicons name="call-outline" size={14} color="#94A3B8" />
          <Text style={styles.footerText}>
            {isRTL ? 'الدعم: 1800 200 400' : 'Support : 71 148 000'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 36,
  },

  /* ── Logo ── */
  logoSection: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 36,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  bankName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  /* ── Form ── */
  form: {
    flex: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 28,
    lineHeight: 20,
  },
  rtl: {
    textAlign: 'right',
  },

  /* Error banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
    flex: 1,
  },

  /* Labels */
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
  },

  /* Inputs */
  input: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  inputRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 14,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  inputInvalid: {
    borderColor: '#EF4444',
  },
  rtlInput: {
    textAlign: 'right',
  },
  passwordInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    width: 44,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  /* Row helpers */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  /* Buttons */
  primaryBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    paddingHorizontal: 14,
  },
  outlineBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
