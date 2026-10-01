import { useSettingStore } from '../stores/useSettingStore';

export interface LanguageDef {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageDef> = {
  en: { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  hinglish: { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish (Conversational)', flag: '🇮🇳' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
};

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  // English (Default)
  en: {
    // Nav
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

    // Dashboard
    'dash.welcome': 'Welcome',
    'dash.household': 'Home Residence',
    'dash.daysLeft': 'Days Left in',
    'dash.addIncome': 'Add Income',
    'dash.addExpense': 'Add Expense',
    'dash.addBill': 'Add Bill',
    'dash.addGrocery': 'Add Grocery',
    'dash.addTask': 'Add Task',
    'dash.quickMenu': 'for Quick Menu',
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

    // Common
    'common.save': 'Save',
    'common.saveChanges': 'Save Changes',
    'common.search': 'Search expenses, groceries, chores (or press ⌘K)...',
    'common.notifications': 'Notifications',
    'common.verified': 'Verified',
  },

  // Hindi (हिन्दी)
  hi: {
    // Nav
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

    // Dashboard
    'dash.welcome': 'नमस्ते',
    'dash.household': 'घर',
    'dash.daysLeft': 'दिन बचे हैं',
    'dash.addIncome': '+ कमाई जोड़ें',
    'dash.addExpense': '+ खर्च जोड़ें',
    'dash.addBill': '+ बिल जोड़ें',
    'dash.addGrocery': '+ राशन जोड़ें',
    'dash.addTask': '+ काम जोड़ें',
    'dash.quickMenu': 'क्विक मेन्यू के लिए',
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

    // Common
    'common.save': 'सहेजें',
    'common.saveChanges': 'बदलाव सहेजें',
    'common.search': 'खर्च, राशन, बिल खोजें (या ⌘K दबाएं)...',
    'common.notifications': 'सूचनाएं',
    'common.verified': 'सत्यापित',
  },

  // Hinglish (Easy Conversational Hindi + English)
  hinglish: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.expenses': 'Kharcha & Expenses',
    'nav.bills': 'Bills & Room Rent',
    'nav.inventory': 'Grocery & Ration',
    'nav.tasks': 'Ghar Ke Chores/Tasks',
    'nav.family': 'Family Members',
    'nav.income': 'Monthly Kamai/Income',
    'nav.pantryVision': 'Photo & Bill Scanner',
    'nav.appliances': 'Home Appliances',
    'nav.medicines': 'Medicines Tracker',
    'nav.sustainability': 'Power & Eco Score',
    'nav.analytics': 'Monthly Insights',
    'nav.reports': 'PDF Download Reports',
    'nav.manual': 'User Manual',
    'nav.profile': 'Apna Profile',
    'nav.settings': 'Settings',

    // Dashboard
    'dash.welcome': 'Welcome',
    'dash.household': 'Home Residence',
    'dash.daysLeft': 'Days bache hain',
    'dash.addIncome': '+ Income Add Karein',
    'dash.addExpense': '+ Kharcha Log Karein',
    'dash.addBill': '+ Bill Add Karein',
    'dash.addGrocery': '+ Grocery Add Karein',
    'dash.addTask': '+ Task Assign Karein',
    'dash.quickMenu': 'Quick Menu ke liye',
    'dash.income': 'Monthly Income',
    'dash.spent': 'Total Spend',
    'dash.allTimeSpend': 'Ab tak ka Total Kharcha',
    'dash.saved': 'Total Bachat/Savings',
    'dash.totalBalance': 'Current Balance',
    'dash.upcomingBills': 'Aane Wale Bills & Room Rent',
    'dash.upcomingBillsDesc': 'Room rent, mess fees, Wi-Fi aur electricity bills due date ke sath track karein.',
    'dash.totalBillsDue': 'Total Due Bills',
    'dash.recentTransactions': 'Recent Transactions History',
    'dash.latestEntries': 'Latest Entries',
    'dash.noTransactions': 'Abhi tak koi transaction record nahi hui.',

    // Vitals
    'vitals.title': 'Home Health Score',
    'vitals.status': 'Live Status',
    'vitals.subtitle': 'Ghar ki savings, kitchen food aur daily tasks ka 1-second view',
    'vitals.great': 'Sab Control Mein Hai 👍',
    'vitals.attention': 'Dhyan Dene Ki Zaroorat Hai ⚠️',
    'vitals.budget': '1. Paisa Saved (Budget)',
    'vitals.food': '2. Kitchen Food Freshness',
    'vitals.chores': '3. Nipat Gaye Ghar Ke Kaam',
    'vitals.score': 'Score',

    // AI
    'ai.suggestions': 'Smart AI Recommendations',
    'ai.quickActions': 'Quick Actions',
    'ai.copilot': 'AI Copilot',

    // Common
    'common.save': 'Save',
    'common.saveChanges': 'Changes Save Karein',
    'common.search': 'Kharcha, bills, ration search karein (ya ⌘K)...',
    'common.notifications': 'Notifications',
    'common.verified': 'Verified',
  },

  // Spanish (Español)
  es: {
    'nav.dashboard': 'Panel Principal',
    'nav.expenses': 'Gastos y Cuentas',
    'nav.bills': 'Facturas y Servicios',
    'nav.inventory': 'Despensa y Compras',
    'nav.tasks': 'Tareas del Hogar',
    'nav.family': 'Familia',
    'nav.income': 'Ingresos y Ganancias',
    'nav.pantryVision': 'Escáner de Recibos (OCR)',
    'nav.appliances': 'Electrodomésticos',
    'nav.medicines': 'Medicamentos',
    'nav.sustainability': 'Puntuación Ecológica',
    'nav.analytics': 'Análisis y Tendencias',
    'nav.reports': 'Informes PDF',
    'nav.manual': 'Manual de Usuario',
    'nav.profile': 'Tu Perfil',
    'nav.settings': 'Ajustes',

    'dash.welcome': 'Bienvenido',
    'dash.household': 'Hogar',
    'dash.daysLeft': 'Días restantes en',
    'dash.addIncome': '+ Ingreso',
    'dash.addExpense': '+ Gasto',
    'dash.addBill': '+ Factura',
    'dash.addGrocery': '+ Despensa',
    'dash.addTask': '+ Tarea',
    'dash.quickMenu': 'para Menú Rápido',
    'dash.income': 'Ingresos',
    'dash.spent': 'Gastado',
    'dash.allTimeSpend': 'Gasto Total Histórico',
    'dash.saved': 'Ahorros',
    'dash.totalBalance': 'Balance Total',
    'dash.upcomingBills': 'Próximas Facturas y Alquiler',
    'dash.upcomingBillsDesc': 'Control de alquiler, wifi, luz y servicios debidos este mes.',
    'dash.totalBillsDue': 'Facturas por Pagar',
    'dash.recentTransactions': 'Transacciones Recientes',
    'dash.latestEntries': 'Últimas Entradas',
    'dash.noTransactions': 'Aún no hay transacciones registradas.',

    'vitals.title': 'Salud del Hogar',
    'vitals.status': 'Estado en Vivo',
    'vitals.subtitle': 'Vista rápida de tus ahorros, comida y tareas domésticas',
    'vitals.great': 'Todo Excelente 👍',
    'vitals.attention': 'Atención Requerida ⚠️',
    'vitals.budget': '1. Dinero Ahorrado (Presupuesto)',
    'vitals.food': '2. Frescura de la Comida',
    'vitals.chores': '3. Tareas Realizadas',
    'vitals.score': 'Puntos',

    'ai.suggestions': 'Sugerencias Inteligentes',
    'ai.quickActions': 'Acciones Rápidas',
    'ai.copilot': 'Copiloto IA',

    'common.save': 'Guardar',
    'common.saveChanges': 'Guardar Cambios',
    'common.search': 'Buscar gastos, comida, tareas (o ⌘K)...',
    'common.notifications': 'Notificaciones',
    'common.verified': 'Verificado',
  },

  // French (Français)
  fr: {
    'nav.dashboard': 'Tableau de Bord',
    'nav.expenses': 'Dépenses',
    'nav.bills': 'Factures & Loyer',
    'nav.inventory': 'Épicerie & Frigo',
    'nav.tasks': 'Tâches Ménagères',
    'nav.family': 'Espace Famille',
    'nav.income': 'Revenus',
    'nav.pantryVision': 'Scanner Reçus & Frigo',
    'nav.appliances': 'Appareils',
    'nav.medicines': 'Médicaments',
    'nav.sustainability': 'Score Écologique',
    'nav.analytics': 'Analyses',
    'nav.reports': 'Rapports PDF',
    'nav.manual': 'Manuel',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',

    'dash.welcome': 'Bienvenue',
    'dash.household': 'Résidence',
    'dash.daysLeft': 'Jours restants en',
    'dash.addIncome': '+ Revenu',
    'dash.addExpense': '+ Dépense',
    'dash.addBill': '+ Facture',
    'dash.addGrocery': '+ Épicerie',
    'dash.addTask': '+ Tâche',
    'dash.quickMenu': 'pour Menu Rapide',
    'dash.income': 'Revenus',
    'dash.spent': 'Dépensé',
    'dash.allTimeSpend': 'Dépenses Totales',
    'dash.saved': 'Épargne',
    'dash.totalBalance': 'Solde Total',
    'dash.upcomingBills': 'Factures & Loyers à Venir',
    'dash.upcomingBillsDesc': 'Suivi des loyers, wifi, électricité et charges dues.',
    'dash.totalBillsDue': 'Total Dû',
    'dash.recentTransactions': 'Transactions Récentes',
    'dash.latestEntries': 'Dernières Entrées',
    'dash.noTransactions': 'Aucune transaction enregistrée.',

    'vitals.title': 'Score Santé du Foyer',
    'vitals.status': 'Statut en Direct',
    'vitals.subtitle': 'Aperçu en 1 seconde de votre épargne, cuisine et tâches',
    'vitals.great': 'Tout Va Bien 👍',
    'vitals.attention': 'Attention Requise ⚠️',
    'vitals.budget': '1. Épargne & Budget',
    'vitals.food': '2. Fraîcheur des Aliments',
    'vitals.chores': '3. Tâches Complétées',
    'vitals.score': 'Score',

    'ai.suggestions': 'Suggestions Intelligentes IA',
    'ai.quickActions': 'Actions Rapides',
    'ai.copilot': 'Assistant IA',

    'common.save': 'Enregistrer',
    'common.saveChanges': 'Enregistrer les Modifications',
    'common.search': 'Rechercher dépenses, courses, tâches (ou ⌘K)...',
    'common.notifications': 'Notifications',
    'common.verified': 'Vérifié',
  },

  // German (Deutsch)
  de: {
    'nav.dashboard': 'Übersicht',
    'nav.expenses': 'Ausgaben',
    'nav.bills': 'Rechnungen & Miete',
    'nav.inventory': 'Vorräte & Einkäufe',
    'nav.tasks': 'Haushaltsaufgaben',
    'nav.family': 'Familie',
    'nav.income': 'Einnahmen',
    'nav.pantryVision': 'Beleg- & Vorratsscanner',
    'nav.appliances': 'Haushaltsgeräte',
    'nav.medicines': 'Medikamente',
    'nav.sustainability': 'Nachhaltigkeit',
    'nav.analytics': 'Analysen',
    'nav.reports': 'PDF-Berichte',
    'nav.manual': 'Handbuch',
    'nav.profile': 'Profil',
    'nav.settings': 'Einstellungen',

    'dash.welcome': 'Willkommen',
    'dash.household': 'Haushalt',
    'dash.daysLeft': 'Tage verbleibend im',
    'dash.addIncome': '+ Einnahme',
    'dash.addExpense': '+ Ausgabe',
    'dash.addBill': '+ Rechnung',
    'dash.addGrocery': '+ Vorrat',
    'dash.addTask': '+ Aufgabe',
    'dash.quickMenu': 'für Schnellmenü',
    'dash.income': 'Einnahmen',
    'dash.spent': 'Ausgegeben',
    'dash.allTimeSpend': 'Gesamtausgaben',
    'dash.saved': 'Ersparnisse',
    'dash.totalBalance': 'Gesamtsaldo',
    'dash.upcomingBills': 'Anstehende Rechnungen & Miete',
    'dash.upcomingBillsDesc': 'Miete, Strom, Internet und fällige Zahlungen im Blick behalten.',
    'dash.totalBillsDue': 'Fällige Rechnungen',
    'dash.recentTransactions': 'Letzte Transaktionen',
    'dash.latestEntries': 'Neueste Einträge',
    'dash.noTransactions': 'Noch keine Transaktionen vorhanden.',

    'vitals.title': 'Haushalts-Gesundheitswert',
    'vitals.status': 'Live-Status',
    'vitals.subtitle': '1-Sekunden-Überblick über Finanzen, Küche und Aufgaben',
    'vitals.great': 'Alles Bestens 👍',
    'vitals.attention': 'Aufmerksamkeit Erforderlich ⚠️',
    'vitals.budget': '1. Gespartes Geld (Budget)',
    'vitals.food': '2. Frische der Lebensmittel',
    'vitals.chores': '3. Erledigte Aufgaben',
    'vitals.score': 'Punkte',

    'ai.suggestions': 'Smarte KI-Empfehlungen',
    'ai.quickActions': 'Schnellaktionen',
    'ai.copilot': 'KI-Assistent',

    'common.save': 'Speichern',
    'common.saveChanges': 'Änderungen Speichern',
    'common.search': 'Ausgaben, Einkäufe suchen (oder ⌘K)...',
    'common.notifications': 'Benachrichtigungen',
    'common.verified': 'Verifiziert',
  },
};

/**
 * React hook to get translated text easily
 */
export function useI18n() {
  const language = useSettingStore((s) => s.language) || 'en';

  // Normalize language key: 'English' -> 'en', 'Hindi' -> 'hi', 'Hinglish' -> 'hinglish', etc.
  const normalizedLang =
    language.toLowerCase().startsWith('hi') && !language.toLowerCase().includes('hinglish')
      ? 'hi'
      : language.toLowerCase().includes('hinglish')
      ? 'hinglish'
      : language.toLowerCase().startsWith('es')
      ? 'es'
      : language.toLowerCase().startsWith('fr')
      ? 'fr'
      : language.toLowerCase().startsWith('de')
      ? 'de'
      : language.toLowerCase().startsWith('ja')
      ? 'ja'
      : language.toLowerCase().startsWith('ar')
      ? 'ar'
      : 'en';

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[normalizedLang] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || defaultText || key;
  };

  const currentLangDef = SUPPORTED_LANGUAGES[normalizedLang] || SUPPORTED_LANGUAGES['en'];

  return { t, language: normalizedLang, currentLangDef, supportedLanguages: SUPPORTED_LANGUAGES };
}
