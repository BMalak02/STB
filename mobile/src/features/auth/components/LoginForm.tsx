import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
  const [localError, setLocalError] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    setLocalError(null);
    try {
      await login(data);
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Soft Blue Wave at top */}
        <View style={styles.waveHeader}>
          <View style={styles.logoBadge}>
            <StbLogo size={70} color="#1565C0" backgroundColor="#FFFFFF" />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('login_title')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('login_sub')}
          </Text>

          {(authError || localError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError || localError}</Text>
            </View>
          )}

          {/* Email input field */}
          <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('login_email')}
          </Text>
          <Controller
            control={control}
            rules={{ required: true }}
            name="email"
            defaultValue="mohamed.benali@stb.com.tn"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="ex: mohamed.benali@stb.com.tn"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, errors.email && styles.inputError, { textAlign: isRTL ? 'right' : 'left' }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && (
            <Text style={[styles.validationText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'identifiant est requis'}
            </Text>
          )}

          {/* Password input field */}
          <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('login_password')}
          </Text>
          <Controller
            control={control}
            rules={{ required: true }}
            name="password"
            defaultValue="••••••••"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.passwordContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  style={[styles.passwordInput, errors.password && styles.inputError, { textAlign: isRTL ? 'right' : 'left' }]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={COLORS.textMuted} 
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text style={[styles.validationText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'رمز المرور مطلوب' : 'Le code secret est requis'}
            </Text>
          )}

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotLink}>
            <Text style={[styles.forgotText, { textAlign: isRTL ? 'left' : 'right' }]}>
              {t('login_forgot')}
            </Text>
          </TouchableOpacity>

          {/* CTA: Se connecter */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>{t('login_cta')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login_or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Biometrics */}
          <TouchableOpacity style={[styles.biometricButton, isRTL && { flexDirection: 'row-reverse' }]} onPress={handleSubmit(onSubmit)}>
            <Ionicons name="finger-print-outline" size={20} color={COLORS.primary} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
            <Text style={styles.biometricText}>{t('login_biometrics')}</Text>
          </TouchableOpacity>

          {/* Signup redirection */}
          <TouchableOpacity style={styles.registerContainer}>
            <Text style={styles.registerText}>{t('login_no_account')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  waveHeader: {
    backgroundColor: COLORS.primary,
    height: 170,
    borderBottomLeftRadius: 80,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -35,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  formCard: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 65,
    paddingBottom: 30,
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
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F7FA',
    color: COLORS.text,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    fontSize: 15,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 15,
    height: '100%',
    justifyContent: 'center',
  },
  validationText: {
    color: COLORS.error,
    fontSize: 11,
    marginTop: -8,
    marginBottom: 10,
  },
  errorContainer: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
  },
  forgotLink: {
    marginBottom: 20,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ECEFF1',
  },
  dividerText: {
    color: COLORS.textMuted,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 25,
  },
  biometricText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
