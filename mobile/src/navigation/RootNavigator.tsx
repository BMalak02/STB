import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

// Localization provider
import { I18nProvider, useTranslation } from '../utils/i18n';

// Screens
import { SplashScreen } from '../features/main/components/SplashScreen';
import { OnboardingScreen } from '../features/main/components/OnboardingScreen';
import { LoginForm } from '../features/auth/components/LoginForm';
import { HomeDashboard } from '../features/main/components/HomeDashboard';
import { NewRequestScreen } from '../features/main/components/NewRequestScreen';
import { DocumentUploadScreen } from '../features/main/components/DocumentUploadScreen';
import { AiScoreResultScreen } from '../features/main/components/AiScoreResultScreen';
import { DossierTrackingScreen } from '../features/main/components/DossierTrackingScreen';
import { NotificationsScreen } from '../features/main/components/NotificationsScreen';
import { ProfileScreen } from '../features/main/components/ProfileScreen';

const RootNavigatorContent = () => {
  const { t, isRTL } = useTranslation();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Core navigation states
  const [showSplash, setShowSplash] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0: Home, 1: Request, 2: Tracking, 3: Notifs, 4: Profile
  
  // Credit application sub-state
  const [activeCreditType, setActiveCreditType] = useState<string>('Personnel');
  const [reqScreenState, setReqScreenState] = useState<'type' | 'upload' | 'score' | 'tracking'>('type');
  
  // Tracking alerts state
  const [showDossierWarning, setShowDossierWarning] = useState(true);

  // Transition from request views
  const handleNextToUpload = (creditType: string) => {
    setActiveCreditType(creditType);
    setReqScreenState('upload');
  };

  const handleFinishUploads = () => {
    setReqScreenState('score');
  };

  const handleFinishScore = () => {
    setReqScreenState('tracking');
    setShowDossierWarning(false);
  };

  const handleUploadMissing = () => {
    setCurrentTab(1); 
    setReqScreenState('upload');
  };

  const handleSelectNotification = (id: number) => {
    if (id === 1) { // Eligibility analysis notification
      setCurrentTab(1);
      setReqScreenState('score');
    } else if (id === 2) { // Missing document warning notification
      setCurrentTab(2);
    }
  };

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 0:
        return (
          <HomeDashboard 
            onNavigateToTab={(index) => {
              setCurrentTab(index);
              if (index === 1) setReqScreenState('type');
            }}
            onOpenDossierDetail={() => {
              setCurrentTab(2);
            }}
          />
        );
      case 1:
        if (reqScreenState === 'type') {
          return <NewRequestScreen onNextStep={handleNextToUpload} />;
        } else if (reqScreenState === 'upload') {
          return <DocumentUploadScreen creditType={activeCreditType} onFinishUploads={handleFinishUploads} />;
        } else if (reqScreenState === 'score') {
          return <AiScoreResultScreen onContinue={handleFinishScore} />;
        } else {
          return <DossierTrackingScreen onUploadMissingDocument={handleUploadMissing} showWarning={false} />;
        }
      case 2:
        return <DossierTrackingScreen onUploadMissingDocument={handleUploadMissing} showWarning={showDossierWarning} />;
      case 3:
        return <NotificationsScreen onSelectNotification={handleSelectNotification} />;
      case 4:
        return <ProfileScreen />;
      default:
        return <HomeDashboard onNavigateToTab={setCurrentTab} onOpenDossierDetail={() => setCurrentTab(2)} />;
    }
  };

  const getHeaderTitle = () => {
    switch (currentTab) {
      case 0:
        return 'STB SmartCredit';
      case 1:
        if (reqScreenState === 'type') return t('req_title');
        if (reqScreenState === 'upload') return t('up_title');
        if (reqScreenState === 'score') return t('score_title');
        return t('nav_dossiers');
      case 2:
        return t('nav_dossiers');
      case 3:
        return t('notif_title');
      case 4:
        return t('nav_profile');
      default:
        return 'STB SmartCredit';
    }
  };

  // 1. Splash Screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Onboarding
  if (!isOnboarded) {
    return <OnboardingScreen onFinish={() => setIsOnboarded(true)} />;
  }

  // 3. Authenticated Check
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // 4. Main App Shell with Bottom Tabs
  return (
    <SafeAreaView style={styles.appContainer}>
      {/* Header bar */}
      <View style={[styles.headerBar, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <Text style={styles.stbBrandTag}>Société Tunisienne de Banque</Text>
      </View>

      {/* Screen area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Tabs custom navigation */}
      <View style={[styles.tabBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab(0)}
        >
          <Ionicons 
            name={currentTab === 0 ? "home" : "home-outline"} 
            size={22} 
            color={currentTab === 0 ? COLORS.primary : COLORS.textMuted} 
          />
          <Text style={[styles.tabLabel, currentTab === 0 && styles.tabLabelActive]}>
            {t('nav_home')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            setCurrentTab(1);
            setReqScreenState('type');
          }}
        >
          <Ionicons 
            name={currentTab === 1 ? "add-circle" : "add-circle-outline"} 
            size={22} 
            color={currentTab === 1 ? COLORS.primary : COLORS.textMuted} 
          />
          <Text style={[styles.tabLabel, currentTab === 1 && styles.tabLabelActive]}>
            {t('nav_request')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab(2)}
        >
          <Ionicons 
            name={currentTab === 2 ? "folder" : "folder-outline"} 
            size={22} 
            color={currentTab === 2 ? COLORS.primary : COLORS.textMuted} 
          />
          <Text style={[styles.tabLabel, currentTab === 2 && styles.tabLabelActive]}>
            {t('nav_dossiers')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab(3)}
        >
          <View style={styles.badgeContainer}>
            <Ionicons 
              name={currentTab === 3 ? "notifications" : "notifications-outline"} 
              size={22} 
              color={currentTab === 3 ? COLORS.primary : COLORS.textMuted} 
            />
            <View style={styles.notifBadge} />
          </View>
          <Text style={[styles.tabLabel, currentTab === 3 && styles.tabLabelActive]}>
            {t('nav_notifications')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab(4)}
        >
          <Ionicons 
            name={currentTab === 4 ? "person" : "person-outline"} 
            size={22} 
            color={currentTab === 4 ? COLORS.primary : COLORS.textMuted} 
          />
          <Text style={[styles.tabLabel, currentTab === 4 && styles.tabLabelActive]}>
            {t('nav_profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const RootNavigator = () => {
  return (
    <I18nProvider>
      <RootNavigatorContent />
    </I18nProvider>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: Platform.OS === 'ios' ? 44 : 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#ECEFF1',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stbBrandTag: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#ECEFF1',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  badgeContainer: {
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.error,
  },
});
