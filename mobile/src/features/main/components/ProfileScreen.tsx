import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation, Language } from '../../../utils/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { logout } from '../../auth/store/authSlice';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen = () => {
  const { t, locale, setLocale, isRTL } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const userName = user?.name || 'Mohamed Ben Ali';
  const userEmail = user?.email || 'mohamed.benali@stb.com.tn';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  // Settings states
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleLanguageChange = (lang: Language) => {
    setLocale(lang);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header section with profile details */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>
      </View>

      {/* Settings Sections */}
      <View style={styles.sectionsContainer}>
        {/* Section 1: Personal info */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('profile_info_section')}
        </Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.itemRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'تعديل البيانات الشخصية' : 'Modifier mes informations'}
            </Text>
            <Ionicons 
              name={isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
              size={14} 
              color={COLORS.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.itemRow, styles.itemRowLast, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="clipboard-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'معلومات التوظيف والدخل' : 'Détails professionnels'}
            </Text>
            <Ionicons 
              name={isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
              size={14} 
              color={COLORS.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Section 2: Security */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('profile_sec_section')}
        </Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.itemRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile_sec_pwd')}
            </Text>
            <Ionicons 
              name={isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
              size={14} 
              color={COLORS.textMuted} 
            />
          </TouchableOpacity>
          
          <View style={[styles.itemRow, styles.itemRowLast, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile_sec_bio')}
            </Text>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#ECEFF1', true: '#BBDEFB' }}
              thumbColor={biometricsEnabled ? COLORS.primary : '#B0BEC5'}
            />
          </View>
        </View>

        {/* Section 3: Preferences */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('profile_pref_section')}
        </Text>
        <View style={styles.card}>
          {/* Language selector */}
          <View style={[styles.itemRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="globe-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile_pref_lang')}
            </Text>
            
            {/* Segmented language buttons */}
            <View style={styles.langSelector}>
              <TouchableOpacity
                style={[styles.langBtn, locale === 'fr' && styles.langBtnActive]}
                onPress={() => handleLanguageChange('fr')}
              >
                <Text style={[styles.langText, locale === 'fr' && styles.langTextActive]}>FR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, locale === 'ar' && styles.langBtnActive]}
                onPress={() => handleLanguageChange('ar')}
              >
                <Text style={[styles.langText, locale === 'ar' && styles.langTextActive]}>عربي</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications toggle */}
          <View style={[styles.itemRow, styles.itemRowLast, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile_pref_notif')}
            </Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#ECEFF1', true: '#BBDEFB' }}
              thumbColor={pushEnabled ? COLORS.primary : '#B0BEC5'}
            />
          </View>
        </View>

        {/* Section 4: Support & info */}
        <View style={styles.card}>
          <TouchableOpacity style={[styles.itemRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile_support')}
            </Text>
            <Ionicons 
              name={isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
              size={14} 
              color={COLORS.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.itemRow, styles.itemRowLast, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} style={styles.itemIcon} />
            <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('profile_about')}
            </Text>
            <Ionicons 
              name={isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
              size={14} 
              color={COLORS.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Logout CTA */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t('profile_logout')}</Text>
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
  profileHeader: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#BBDEFB',
  },
  sectionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#F0F4F8',
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    width: 24,
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingHorizontal: 10,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 3,
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
  },
  langText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 35,
  },
  logoutBtnText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
