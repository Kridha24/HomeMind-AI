import { useSettingStore } from '../stores/useSettingStore';

export interface LanguageDef {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

/**
 * ONLY supported languages with real translations (Part 29)
 */
export const SUPPORTED_LANGUAGES: Record<string, LanguageDef> = {
  en: { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
};

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  // English (Default)
  en: {
    // Nav Sections
    'nav.core': 'Core',
    'nav.householdGroup': 'Household',
    'nav.insightsGroup': 'Insights',

    // Nav Links
    'nav.dashboard': 'Dashboard',
    'nav.expenses': 'Expenses & Ledger',
    'nav.bills': 'Bills & Utilities',
    'nav.inventory': 'Grocery Inventory',
    'nav.tasks': 'Household Tasks',
    'nav.family': 'Family Workspace',
    'nav.income': 'Income & Earnings',
    'nav.pantryVision': 'Pantry Vision OCR',
    'nav.appliances': 'Home Appliances',
    'nav.medicines': 'Medicine Tracker',
    'nav.sustainability': 'Sustainability Score',
    'nav.analytics': 'Analytics & Trends',
    'nav.reports': 'Financial Reports',
    'nav.manual': 'User Manual',
    'nav.profile': 'Your Profile',
    'nav.settings': 'App Settings',

    // Greetings & Times
    'dash.goodMorning': 'Good morning',
    'dash.goodAfternoon': 'Good afternoon',
    'dash.goodEvening': 'Good evening',
    'dash.welcome': 'Welcome',
    'dash.household': 'Home Residence',
    'dash.daysLeft': 'Days Left in',
    'dash.today': 'Today',
    'dash.todayOverview': 'Today At A Glance',
    'dash.tasksPending': 'Tasks Pending',
    'dash.billsDueSoon': 'Bills Due Soon',
    'dash.todayTransactions': 'Transactions Today',

    // Financial Cards
    'dash.financialSnapshot': 'Household Financial Snapshot',
    'dash.monthlyIncome': 'Monthly Income',
    'dash.monthlyExpenses': 'Monthly Expenses',
    'dash.overallExpenses': 'All-Time Spend',
    'dash.netBalance': 'Net Balance',
    'dash.billsDue': 'Bills Due',
    'dash.income': 'Income',
    'dash.spent': 'Spent',
    'dash.allTimeSpend': 'All-time Spend',
    'dash.saved': 'Saved',
    'dash.totalBalance': 'Total Balance',
    'dash.upcomingBills': 'Upcoming Bills & Rent',
    'dash.upcomingBillsDesc': 'Track room rent, mess fees, Wi-Fi, and electricity bills due this month.',
    'dash.totalBillsDue': 'Total Bills Due',
    'dash.recentTransactions': 'Recent Transactions',
    'dash.latestEntries': 'Latest Entries',
    'dash.noTransactions': 'No transactions recorded yet.',

    // Member Specific Dashboard
    'dash.myTasks': 'My Assigned Tasks',
    'dash.myTasksDesc': 'Chores and tasks specifically assigned to you',
    'dash.sharedGroceries': 'Shared Groceries',
    'dash.sharedGroceriesDesc': 'Pantry and household grocery shopping list',
    'dash.allowedBills': 'Upcoming Household Responsibilities',
    'dash.safeHouseholdActivity': 'Recent Household Activity',
    'dash.personalFinance': 'My Personal Transactions',
    'dash.noPersonalTransactions': 'No personal transactions recorded for your account.',
    'dash.rolePrivateNotice': 'Household-wide financial analytics are restricted to Owner & Co-Owner.',

    // Quick Actions
    'dash.quickActions': 'Quick Actions',
    'dash.addIncome': 'Add Income',
    'dash.addExpense': 'Add Expense',
    'dash.addBill': 'Add Bill',
    'dash.addGrocery': 'Add Grocery',
    'dash.addTask': 'Add Task',
    'dash.quickMenu': 'for Quick Menu',

    // Vitals
    'vitals.title': 'Home Health Score',
    'vitals.status': 'Live Status',
    'vitals.subtitle': 'Quick 1-second view of your savings, kitchen food, and home chores',
    'vitals.great': 'Looking Great 👍',
    'vitals.attention': 'Attention Needed ⚠️',
    'vitals.budget': '1. Money Saved (Budget)',
    'vitals.food': '2. Kitchen Food Freshness',
    'vitals.chores': '3. Home Chores & Tasks',
    'vitals.score': 'Score',

    // AI
    'ai.suggestions': 'Smart Home Suggestions',
    'ai.quickActions': 'Quick Actions',
    'ai.copilot': 'AI Copilot',

    // Member Drawer
    'member.profile': 'Profile',
    'member.responsibilities': 'Responsibilities',
    'member.finance': 'Finance',
    'member.activity': 'Activity',
    'member.activeTasks': 'Active Tasks',
    'member.completedTasks': 'Completed Tasks',
    'member.recentActivity': 'Recent Activity',
    'member.financialOverview': 'Financial Overview',
    'member.privateNotice': 'Financial information is private and restricted to Owner and Co-Owner.',

    // Common
    'common.save': 'Save',
    'common.saveChanges': 'Save Changes',
    'common.search': 'Search expenses, groceries, chores (or press ⌘K)...',
    'common.notifications': 'Notifications',
    'common.verified': 'Verified',
    'common.all': 'All',
  },

  // Hindi (हिन्दी)
  hi: {
    // Nav Sections
    'nav.core': 'मुख्य (Core)',
    'nav.householdGroup': 'घर और परिवार',
    'nav.insightsGroup': 'विश्लेषण और रिपोर्ट',

    // Nav Links
    'nav.dashboard': 'डैशबोर्ड',
    'nav.expenses': 'खर्च और हिसाब (Expenses)',
    'nav.bills': 'बिल और किराया (Bills)',
    'nav.inventory': 'राशन और किचन (Inventory)',
    'nav.tasks': 'घर के काम (Tasks)',
    'nav.family': 'परिवार के सदस्य (Family)',
    'nav.income': 'कमाई और आय (Income)',
    'nav.pantryVision': 'बिल और राशन स्कैनर (OCR)',
    'nav.appliances': 'घर के उपकरण (Appliances)',
    'nav.medicines': 'दवाइयां (Medicines)',
    'nav.sustainability': 'बिजली और बचत (Eco Score)',
    'nav.analytics': 'खर्च का हिसाब-किताब (Analytics)',
    'nav.reports': 'PDF रिपोर्ट (Reports)',
    'nav.manual': 'उपयोगकर्ता गाइड (Manual)',
    'nav.profile': 'आपकी प्रोफाइल (Profile)',
    'nav.settings': 'सेटिंग्स (Settings)',

    // Greetings & Times
    'dash.goodMorning': 'सुप्रभात',
    'dash.goodAfternoon': 'शुभ दोपहर',
    'dash.goodEvening': 'शुभ संध्या',
    'dash.welcome': 'नमस्ते',
    'dash.household': 'घर',
    'dash.daysLeft': 'दिन शेष',
    'dash.today': 'आज',
    'dash.todayOverview': 'आज की स्थिति',
    'dash.tasksPending': 'लंबित काम',
    'dash.billsDueSoon': 'निकटतम बिल',
    'dash.todayTransactions': 'आज के लेन-देन',

    // Financial Cards
    'dash.financialSnapshot': 'घर का वित्तीय सारांश',
    'dash.monthlyIncome': 'मासिक आय',
    'dash.monthlyExpenses': 'मासिक खर्च',
    'dash.overallExpenses': 'कुल खर्च',
    'dash.netBalance': 'शुद्ध बचत (Net Balance)',
    'dash.billsDue': 'देय बिल',
    'dash.income': 'कुल कमाई',
    'dash.spent': 'इस महीने का खर्च',
    'dash.allTimeSpend': 'कुल खर्च',
    'dash.saved': 'बचत (Savings)',
    'dash.totalBalance': 'कुल बैलेंस',
    'dash.upcomingBills': 'आने वाले बिल और रूम रेंट',
    'dash.upcomingBillsDesc': 'इस महीने का रूम रेंट, मेस फीस, वाई-फाई और बिजली का बिल ट्रैक करें।',
    'dash.totalBillsDue': 'कुल देय बिल',
    'dash.recentTransactions': 'हाल के लेन-देन (Transactions)',
    'dash.latestEntries': 'नवीनतम प्रविष्टियां',
    'dash.noTransactions': 'अभी तक कोई लेन-देन दर्ज नहीं है।',

    // Member Specific Dashboard
    'dash.myTasks': 'मेरे सौंपे गए काम',
    'dash.myTasksDesc': 'विशेष रूप से आपको सौंपे गए घरेलू कार्य',
    'dash.sharedGroceries': 'सांझा राशन सूची',
    'dash.sharedGroceriesDesc': 'रसोई और दैनिक राशन की खरीदारी सूची',
    'dash.allowedBills': 'आगामी घरेलू दायित्व व बिल',
    'dash.safeHouseholdActivity': 'घर की हालिया गतिविधियां',
    'dash.personalFinance': 'मेरा व्यक्तिगत हिसाब-किताब',
    'dash.noPersonalTransactions': 'आपके खाते से कोई व्यक्तिगत लेन-देन दर्ज नहीं है।',
    'dash.rolePrivateNotice': 'घर का समग्र वित्तीय विवरण केवल ओनर और को-ओनर के लिए उपलब्ध है।',

    // Quick Actions
    'dash.quickActions': 'त्वरित क्रियाएं',
    'dash.addIncome': '+ कमाई जोड़ें',
    'dash.addExpense': '+ खर्च जोड़ें',
    'dash.addBill': '+ बिल जोड़ें',
    'dash.addGrocery': '+ राशन जोड़ें',
    'dash.addTask': '+ काम जोड़ें',
    'dash.quickMenu': 'क्विक मेन्यू के लिए',

    // Vitals
    'vitals.title': 'घर का हेल्थ स्कोर',
    'vitals.status': 'लाइव स्टेटस',
    'vitals.subtitle': 'बचत, किचन का राशन और घर के कामों का 1-सेकंड सारांश',
    'vitals.great': 'सब कुछ बढ़िया है 👍',
    'vitals.attention': 'ध्यान देने की ज़रूरत है ⚠️',
    'vitals.budget': '1. कुल बचत (बजट)',
    'vitals.food': '2. किचन का खाना और ताज़गी',
    'vitals.chores': '3. पूरे हुए घर के काम',
    'vitals.score': 'स्कोर',

    // AI
    'ai.suggestions': 'स्मार्ट होम सुझाव (AI Suggestions)',
    'ai.quickActions': 'त्वरित कार्रवाई',
    'ai.copilot': 'AI सहायक',

    // Member Drawer
    'member.profile': 'प्रोफाइल',
    'member.responsibilities': 'ज़िम्मेदारियां',
    'member.finance': 'वित्तीय विवरण',
    'member.activity': 'गतिविधि',
    'member.activeTasks': 'सक्रिय कार्य',
    'member.completedTasks': 'पूरे हुए कार्य',
    'member.recentActivity': 'हाल की गतिविधियां',
    'member.financialOverview': 'वित्तीय अवलोकन',
    'member.privateNotice': 'वित्तीय विवरण गोपनीय हैं और केवल ओनर और को-ओनर को ही दिखाई देते हैं।',

    // Common
    'common.save': 'सहेजें',
    'common.saveChanges': 'बदलाव सहेजें',
    'common.search': 'खर्च, राशन, बिल खोजें (या ⌘K दबाएं)...',
    'common.notifications': 'सूचनाएं',
    'common.verified': 'सत्यापित',
    'common.all': 'सभी',
  },
};

/**
 * Normalizes language string to supported code ('en' | 'hi')
 */
export function normalizeLanguage(lang?: string | null): 'en' | 'hi' {
  if (!lang) return 'en';
  const clean = lang.toLowerCase().trim();
  if (clean === 'hi' || clean.startsWith('hindi') || clean.includes('हिन्दी')) {
    return 'hi';
  }
  return 'en';
}

/**
 * Locale-aware date formatting (Part 30)
 * Example:
 * English: Friday, 3 October 2026
 * Hindi: शनिवार, 3 अक्तूबर 2026
 */
export function formatLocalizedDate(
  dateInput: Date | string = new Date(),
  lang: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';
    const normLang = normalizeLanguage(lang);
    const locale = normLang === 'hi' ? 'hi-IN' : 'en-US';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Locale-aware month formatting
 */
export function formatLocalizedMonth(
  dateInput: Date | string = new Date(),
  lang: string = 'en'
): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const normLang = normalizeLanguage(lang);
    const locale = normLang === 'hi' ? 'hi-IN' : 'en-US';
    return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
  } catch {
    return '';
  }
}

/**
 * React hook to get translated text easily with reactive store subscription
 */
export function useI18n() {
  const rawLanguage = useSettingStore((s) => s.language) || 'en';
  const language = normalizeLanguage(rawLanguage);

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || defaultText || key;
  };

  const currentLangDef = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;

  return {
    t,
    language,
    currentLangDef,
    supportedLanguages: SUPPORTED_LANGUAGES,
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatLocalizedDate(date, language, options),
    formatMonth: (date: Date | string) =>
      formatLocalizedMonth(date, language),
  };
}
