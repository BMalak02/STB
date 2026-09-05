import React, { createContext, useState, useContext } from 'react';
import { I18nManager } from 'react-native';

export type Language = 'fr' | 'ar';

const translations = {
  fr: {
    // Navigation
    nav_home: 'Tableau de bord',
    nav_request: 'Nouveau crédit',
    nav_dossiers: 'Suivi de dossier',
    nav_notifications: 'Notifications',
    nav_profile: 'Compte',

    // Screen 1: Splash
    splash_tagline: 'Services bancaires digitaux et instantanés',
    splash_title: 'STB SmartCredit',

    // Screen 2: Onboarding
    onboarding_next: 'Suivant',
    onboarding_start: 'Accéder aux services',
    onboarding_s1_title: 'Dépôt de dossier 100% digital',
    onboarding_s1_sub: 'Soumettez votre demande de financement sécurisée en quelques minutes.',
    onboarding_s2_title: 'Validation instantanée des pièces',
    onboarding_s2_sub: 'Notre système vérifie automatiquement la conformité de vos justificatifs.',
    onboarding_s3_title: 'Décision rapide et transparente',
    onboarding_s3_sub: 'Bénéficiez d\'une réponse définitive sous un délai de 48 heures ouvrables.',

    // Screen 3: Login
    login_title: 'Authentification',
    login_sub: 'Saisissez vos identifiants pour vous connecter à votre espace STB',
    login_email: 'Identifiant / Adresse e-mail',
    login_password: 'Mot de passe sécurisé',
    login_forgot: 'Identifiants oubliés ?',
    login_cta: 'Se connecter',
    login_or: 'ou',
    login_biometrics: 'Connexion par reconnaissance biométrique',
    login_no_account: 'Pas encore de compte ? Créer un accès',

    // Screen 4: Home Dashboard
    home_welcome: 'Bonjour, ',
    home_badge_active: 'Dossier de crédit en cours d\'étude',
    home_action_new: 'Nouvelle demande',
    home_action_files: 'Mes dossiers',
    home_action_notifs: 'Notifications',
    home_sim_title: 'Simulateur de crédit',
    home_sim_amount: 'Montant souhaité',
    home_sim_duration: 'Durée de remboursement',
    home_sim_result: 'Mensualité hors assurance',
    home_sim_currency: 'TND',
    home_sim_months: 'mois',

    // Screen 5: New Request
    req_title: 'Catégorie de crédit',
    req_sub: 'Sélectionnez le type de financement correspondant à votre besoin',
    req_step: 'Étape 1 sur 4',
    req_card1_title: 'Crédit Immobilier',
    req_card1_desc: 'Financement de votre résidence ou terrain',
    req_card2_title: 'Crédit Automobile',
    req_card2_desc: 'Acquisition de véhicules neufs ou d\'occasion',
    req_card3_title: 'Crédit Consommation',
    req_card3_desc: 'Financement de vos projets personnels',
    req_next: 'Valider et continuer',

    // Screen 6: Document Upload
    up_title: 'Pièces justificatives',
    up_progress: 'Pièces fournies : 2/4',
    up_cin: 'Carte Nationale d\'Identité (CIN)',
    up_payslip: 'Dernier bulletin de paie',
    up_statement: 'Relevés bancaires (3 derniers mois)',
    up_residence: 'Certificat de résidence ou facture STEG/SONEDE',
    up_status_done: 'Validé',
    up_status_pending: 'En cours de validation',
    up_status_required: 'Document obligatoire',
    up_status_empty: 'Non transmis',
    up_modal_title: 'Sélectionner le mode d\'import',
    up_modal_camera: 'Prendre une photo de la pièce',
    up_modal_gallery: 'Choisir depuis la galerie photo',
    up_modal_pdf: 'Importer le document au format PDF',

    // Screen 7: AI Score Result
    score_title: 'Étude d\'éligibilité de crédit',
    score_sub: 'Évaluation automatique basée sur vos critères déclarés',
    score_label: 'Éligible (Profil de confiance)',
    score_factor_income: 'Niveau de revenu',
    score_factor_stability: 'Ancienneté professionnelle',
    score_factor_history: 'Antécédents bancaires',
    score_factor_dti: 'Capacité d\'endettement',
    score_status_card: 'Dossier transmis au comité d\'octroi',
    score_status_est: 'Décision finale estimée le 15 Janvier 2026',
    score_cta: 'Suivre l\'état d\'avancement',

    // Screen 8: Dossier Tracking
    track_title: 'Suivi de la demande #CR2026-0042',
    track_s1_title: 'Dossier soumis',
    track_s1_desc: 'Votre demande a été enregistrée avec succès.',
    track_s2_title: 'Vérification documentaire',
    track_s2_desc: 'Contrôle de conformité de vos pièces justificatives.',
    track_s3_title: 'Analyse d\'éligibilité',
    track_s3_desc: 'Évaluation technique de la capacité financière.',
    track_s4_title: 'Comité d\'octroi',
    track_s4_desc: 'Décision finale du comité de crédit STB.',
    track_s5_title: 'Signature et déblocage',
    track_s5_desc: 'Signature des contrats et versement des fonds.',
    track_warning: 'Document manquant ou non conforme',
    track_warning_desc: 'Le relevé de compte est nécessaire pour finaliser l\'étude.',
    track_upload_now: 'Compléter le dossier',

    // Screen 9: Notifications
    notif_title: 'Centre de notifications',
    notif_mark_all: 'Tout marquer comme lu',
    notif_item1: 'Votre dossier a été approuvé par le comité !',
    notif_item2: 'Étude d\'éligibilité finalisée — Statut : Éligible',
    notif_item3: 'Pièce manquante : Relevé de compte requis',
    notif_item4: 'Ouverture de votre espace STB SmartCredit',
    notif_time_m: 'min',
    notif_time_h: 'h',
    notif_time_d: 'j',

    // Screen 10: Profile
    profile_products_section: 'Produits STB',
    profile_info_section: 'Informations personnelles',
    profile_security_section: 'Sécurité et accès',
    profile_notif_section: 'Notifications',
    profile_sec_section: 'Sécurité et accès',
    profile_sec_pwd: 'Changer le code secret',
    profile_sec_bio: 'Authentification par biométrie',
    profile_pref_section: 'Préférences',
    profile_pref_lang: 'Langue de l\'application',
    profile_pref_notif: 'Alertes et notifications push',
    profile_support: 'Contacter le support client',
    profile_about: 'Mentions légales & Informations STB',
    profile_logout: 'Se déconnecter de la session',
  },
  ar: {
    // Navigation
    nav_home: 'لوحة القيادة',
    nav_request: 'طلب قرض',
    nav_dossiers: 'متابعة الملف',
    nav_notifications: 'الإشعارات',
    nav_profile: 'الحساب',

    // Screen 1: Splash
    splash_tagline: 'خدمات مصرفية رقمية وفورية',
    splash_title: 'STB SmartCredit',

    // Screen 2: Onboarding
    onboarding_next: 'التالي',
    onboarding_start: 'الولوج إلى الخدمات',
    onboarding_s1_title: 'تقديم الملف رقمي 100%',
    onboarding_s1_sub: 'أرسل طلب التمويل الآمن الخاص بك في دقائق معدودة.',
    onboarding_s2_title: 'التثبت الفوري من الوثائق',
    onboarding_s2_sub: 'يقوم نظامنا بالتحقق تلقائياً من مطابقة وثائق الإثبات الخاصة بك.',
    onboarding_s3_title: 'قرار سريع وشفاف',
    onboarding_s3_sub: 'احصل على رد نهائي في غضون 48 ساعة عمل.',

    // Screen 3: Login
    login_title: 'الولوج إلى الحساب',
    login_sub: 'أدخل بيانات الهوية للاتصال بالفضاء الخاص بك لبنك الأمان STB',
    login_email: 'المعرف / البريد الإلكتروني',
    login_password: 'رمز المرور الآمن',
    login_forgot: 'نسيت بيانات الهوية؟',
    login_cta: 'اتصال',
    login_or: 'أو',
    login_biometrics: 'الاتصال عن طريق البصمة البيومترية',
    login_no_account: 'ليس لديك حساب؟ إنشاء حساب جديد',

    // Screen 4: Home Dashboard
    home_welcome: 'مرحباً، ',
    home_badge_active: 'طلب قرض قيد الدراسة الآن',
    home_action_new: 'طلب جديد',
    home_action_files: 'ملفاتي',
    home_action_notifs: 'الإشعارات',
    home_sim_title: 'محاكي القرض',
    home_sim_amount: 'المبلغ المطلوب',
    home_sim_duration: 'مدة السداد',
    home_sim_result: 'القسط الشهري دون تأمين',
    home_sim_currency: 'د.ت',
    home_sim_months: 'شهراً',

    // Screen 5: New Request
    req_title: 'فئة القرض',
    req_sub: 'اختر نوع التمويل المتوافق مع احتياجاتك الشخصية',
    req_step: 'الخطوة 1 من 4',
    req_card1_title: 'قرض عقاري',
    req_card1_desc: 'تمويل شراء مسكن أو أرض',
    req_card2_title: 'قرض سيارة',
    req_card2_desc: 'اقتناء سيارة جديدة أو مستعملة',
    req_card3_title: 'قرض الاستهلاك',
    req_card3_desc: 'تمويل مشاريعك واحتياجاتك الشخصية',
    req_next: 'تأكيد ومتابعة',

    // Screen 6: Document Upload
    up_title: 'وثائق الإثبات',
    up_progress: 'الوثائق المقدمة : 2/4',
    up_cin: 'بطاقة التعريف الوطنية (CIN)',
    up_payslip: 'آخر كشف راتب شهري',
    up_statement: 'كشف حساب بنكي (لآخر 3 أشهر)',
    up_residence: 'شهادة إقامة أو فاتورة كهرباء/غاز',
    up_status_done: 'مقبول',
    up_status_pending: 'قيد التثبت الفني',
    up_status_required: 'وثيقة إجبارية',
    up_status_empty: 'غير مرسل',
    up_modal_title: 'اختر طريقة تحميل الملف',
    up_modal_camera: 'التقاط صورة للوثيقة',
    up_modal_gallery: 'اختيار من معرض الصور',
    up_modal_pdf: 'تحميل ملف بصيغة PDF',

    // Screen 7: AI Score Result
    score_title: 'دراسة أهلية القرض',
    score_sub: 'تقييم فني وتلقائي بناء على معاييرك المصرح بها',
    score_label: 'مؤهل (ملف ذو ثقة عالية)',
    score_factor_income: 'مستوى الدخل الشهري',
    score_factor_stability: 'الأقدمية المهنية',
    score_factor_history: 'السوابق والتعاملات البنكية',
    score_factor_dti: 'القدرة على تحمل الديون',
    score_status_card: 'تمت إحالة الملف إلى لجنة الائتمان',
    score_status_est: 'القرار النهائي المتوقع في 15 جانفي 2026',
    score_cta: 'متابعة تقدم دراسة الملف',

    // Screen 8: Dossier Tracking
    track_title: 'متابعة الطلب #CR2026-0042',
    track_s1_title: 'تم تقديم الطلب',
    track_s1_desc: 'تم تسجيل طلب التمويل الخاص بك بنجاح.',
    track_s2_title: 'التثبت من الوثائق',
    track_s2_desc: 'مراقبة ومراجعة مطابقة وثائق الإثبات المقدمة.',
    track_s3_title: 'دراسة الأهلية والقدرة',
    track_s3_desc: 'تقييم فني للقدرة المالية والائتمانية للملف.',
    track_s4_title: 'لجنة الائتمان',
    track_s4_desc: 'القرار النهائي للجنة القروض لبنك STB.',
    track_s5_title: 'الإمضاء وصرف التمويل',
    track_s5_desc: 'توقيع العقود القانونية وتنزيل الأموال بالحساب.',
    track_warning: 'وثيقة مفقودة أو غير مطابقة',
    track_warning_desc: 'كشف الحساب البنكي ضروري لاستكمال دراسة الملف.',
    track_upload_now: 'استكمال ملف الوثائق',

    // Screen 9: Notifications
    notif_title: 'مركز الإشعارات الواردة',
    notif_mark_all: 'تحديد الكل كمقروء',
    notif_item1: 'تمت الموافقة على طلبك من لجنة الائتمان!',
    notif_item2: 'انتهت دراسة الأهلية — الحالة : مؤهل للحصول على التمويل',
    notif_item3: 'وثيقة مفقودة : كشف الحساب مطلوب لاستكمال الطلب',
    notif_item4: 'افتتاح فضاء الولوج الخاص بك لبنك STB SmartCredit',
    notif_time_m: 'دق',
    notif_time_h: 'ساعة',
    notif_time_d: 'يوم',

    // Screen 10: Profile
    profile_products_section: 'منتجات STB',
    profile_info_section: 'المعطيات الشخصية',
    profile_security_section: 'الأمان والولوج',
    profile_notif_section: 'الإشعارات',
    profile_sec_section: 'الأمان والولوج',
    profile_sec_pwd: 'تغيير الرمز السري',
    profile_sec_bio: 'تسجيل الدخول بالبيانات الحيوية',
    profile_pref_section: 'التفضيلات الشخصية',
    profile_pref_lang: 'لغة التطبيق الافتراضية',
    profile_pref_notif: 'تلقي التنبيهات الفورية',
    profile_support: 'الاتصال بمصلحة الحرفاء',
    profile_about: 'الشروط القانونية ومعلومات بنك STB',
    profile_logout: 'تسجيل الخروج من الجلسة',
  },
};

interface I18nContextProps {
  locale: Language;
  t: (key: keyof typeof translations['fr']) => string;
  setLocale: (lang: Language) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Language>('fr');

  const setLocale = (lang: Language) => {
    setLocaleState(lang);
    const rtl = lang === 'ar';
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  };

  const t = (key: keyof typeof translations['fr']): string => {
    return translations[locale][key] || translations['fr'][key] || String(key);
  };

  const isRTL = locale === 'ar';

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
