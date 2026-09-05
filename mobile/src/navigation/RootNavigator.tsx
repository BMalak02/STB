import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS } from '../theme/colors';

// Screens
import { HomeDashboard } from '../features/main/components/HomeDashboard';
import { NewRequestScreen } from '../features/main/components/NewRequestScreen';
import { DossierTrackingScreen } from '../features/main/components/DossierTrackingScreen';
import { NotificationsScreen } from '../features/main/components/NotificationsScreen';
import { ProfileScreen } from '../features/main/components/ProfileScreen';
import { DocumentUploadScreen } from '../features/main/components/DocumentUploadScreen';
import { AiScoreResultScreen } from '../features/main/components/AiScoreResultScreen';
import { ContractSignatureScreen } from '../features/main/components/ContractSignatureScreen';
import { LoginForm } from '../features/auth/components/LoginForm';
import { OnboardingScreen } from '../features/main/components/OnboardingScreen';
import { SplashScreen } from '../features/main/components/SplashScreen';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 0 | 1 | 2 | 3 | 4;
type CreditFlowStep = 'type' | 'docs' | 'score' | 'sign' | null;

const TABS = [
  { label: 'Accueil',   icon: 'home-outline'           as const },
  { label: 'Demande',   icon: 'add-circle-outline'      as const },
  { label: 'Dossier',   icon: 'folder-open-outline'     as const },
  { label: 'Alertes',   icon: 'notifications-outline'   as const },
  { label: 'Profil',    icon: 'person-outline'          as const },
];

export const RootNavigator = () => {
  const { user, isOnboarded } = useSelector((state: RootState) => state.auth);

  const [splashDone, setSplashDone] = useState(false);
  const [onboardDone, setOnboardDone] = useState(!!isOnboarded);
  const [activeTab, setActiveTab] = useState<Tab>(0);
  const [flowStep, setFlowStep] = useState<CreditFlowStep>(null);
  const [creditType, setCreditType] = useState('Personnel');
  const [notifCount] = useState(2);

  /* ── Not yet authenticated ── */
  if (!splashDone) return <SplashScreen onFinish={() => setSplashDone(true)} />;
  if (!onboardDone) return <OnboardingScreen onFinish={() => setOnboardDone(true)} />;
  if (!user) return <LoginForm />;

  /* ── Credit request flow overlay ── */
  if (flowStep === 'type') {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="Nouvelle demande" onBack={() => setFlowStep(null)} />
        <NewRequestScreen onNextStep={(type) => { setCreditType(type); setFlowStep('docs'); }} />
      </SafeAreaView>
    );
  }
  if (flowStep === 'docs') {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="Documents" onBack={() => setFlowStep('type')} />
        <DocumentUploadScreen creditType={creditType} onFinishUploads={() => setFlowStep('score')} />
      </SafeAreaView>
    );
  }
  if (flowStep === 'score') {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="Résultat d'analyse" onBack={() => setFlowStep('docs')} />
        <AiScoreResultScreen onContinue={() => setFlowStep('sign')} onNewRequest={() => setFlowStep(null)} />
      </SafeAreaView>
    );
  }
  if (flowStep === 'sign') {
    return (
      <SafeAreaView style={s.safe}>
        <Header title="Signature du contrat" onBack={() => setFlowStep('score')} />
        <ContractSignatureScreen onSigned={() => { setFlowStep(null); setActiveTab(2); }} />
      </SafeAreaView>
    );
  }

  /* ── Main tab navigation ── */
  const renderScreen = () => {
    switch (activeTab) {
      case 0: return <HomeDashboard onNavigateToTab={setActiveTab as (i: number) => void} onOpenDossierDetail={() => setActiveTab(2)} />;
      case 1: return <NewRequestScreen onNextStep={(type) => { setCreditType(type); setFlowStep('docs'); }} />;
      case 2: return <DossierTrackingScreen onNavigateToSign={() => setFlowStep('sign')} />;
      case 3: return <NotificationsScreen />;
      case 4: return <ProfileScreen />;
    }
  };

  const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ── Top Bar ── */}
      <View style={s.topBar}>
        <View>
          <Text style={s.topBarTitle}>{TABS[activeTab].label}</Text>
          <Text style={s.topBarSub}>STB SmartCredit</Text>
        </View>
        <View style={s.avatarBadge}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={s.content}>{renderScreen()}</View>

      {/* ── Tab Bar ── */}
      <View style={s.tabBar}>
        {TABS.map((tab, i) => {
          const active = activeTab === i;
          const showBadge = i === 3 && notifCount > 0;
          return (
            <TouchableOpacity
              key={i}
              style={s.tabItem}
              onPress={() => setActiveTab(i as Tab)}
            >
              <View style={s.tabIconWrap}>
                <Ionicons
                  name={active ? tab.icon.replace('-outline', '') as any : tab.icon}
                  size={22}
                  color={active ? COLORS.primary : COLORS.textHint}
                />
                {showBadge && (
                  <View style={s.tabBadge}>
                    <Text style={s.tabBadgeText}>{notifCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

/* ── Shared back-header ── */
const Header = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <View style={s.backHeader}>
    <TouchableOpacity style={s.backBtn} onPress={onBack}>
      <Ionicons name="arrow-back" size={22} color={COLORS.text} />
    </TouchableOpacity>
    <Text style={s.backTitle}>{title}</Text>
    <View style={{ width: 40 }} />
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  topBarSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: 1 },
  avatarBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5, borderColor: COLORS.primaryMid,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  content: { flex: 1 },

  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingBottom: Platform.OS === 'ios' ? 16 : 6,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { position: 'relative' },
  tabLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textHint, marginTop: 3 },
  tabLabelActive: { color: COLORS.primary },
  tabBadge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: COLORS.error,
    minWidth: 14, height: 14, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  tabBadgeText: { fontSize: 8, fontWeight: '700', color: '#FFF' },

  backHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});
