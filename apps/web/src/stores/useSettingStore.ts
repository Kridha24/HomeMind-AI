import { create } from 'zustand';
import { SUPPORTED_CURRENCIES, COUNTRY_DEFAULTS, getCountryDefaults, formatCurrency } from '../utils/currency';
import apiClient from '../services/apiClient';

interface SettingState {
  country: string;
  currency: string;
  currencySymbol: string;
  timeZone: string;
  dateFormat: string;
  unitSystem: 'Metric' | 'Imperial';
  theme: 'dark' | 'light' | 'glass' | 'system';
  language: string;
  pushNotifications: boolean;
  emailAlerts: boolean;
  aiSuggestions: boolean;
  aiPredictions: boolean;
  aiRecipes: boolean;
  aiOcr: boolean;
  isLoading: boolean;
  sidebarCollapsed: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
  
  // Actions
  setCountry: (countryCode: string) => void;
  setCurrency: (currencyCode: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'glass' | 'system') => void;
  setLanguage: (lang: string) => void;
  setTimeZone: (tz: string) => void;
  setDateFormat: (df: string) => void;
  setUnitSystem: (unit: 'Metric' | 'Imperial') => void;
  setReducedMotion: (reduced: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  saveSettings: () => Promise<void>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updateSettings: (newSettings: Partial<SettingState>) => Promise<void>;
  fetchSettings: () => Promise<void>;
  format: (amount: number) => string;
}

function applyThemeToDOM(theme: 'dark' | 'light' | 'glass' | 'system') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    theme === 'glass' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

function applyLangToDOM(lang: string) {
  if (typeof document === 'undefined') return;
  const norm = lang === 'hi' || lang.toLowerCase().startsWith('hindi') ? 'hi' : 'en';
  document.documentElement.lang = norm;
}

const initialTheme = (typeof window !== 'undefined' ? localStorage.getItem('hm_theme') : 'dark') as any || 'dark';
if (typeof window !== 'undefined') applyThemeToDOM(initialTheme);
const initialLang = (typeof window !== 'undefined' ? localStorage.getItem('hm_language') : 'en') || 'en';
if (typeof window !== 'undefined') applyLangToDOM(initialLang);

export const useSettingStore = create<SettingState>((set, get) => ({
  country: localStorage.getItem('hm_country') || 'US',
  currency: localStorage.getItem('hm_currency') || 'USD',
  currencySymbol: localStorage.getItem('hm_currencySymbol') || '$',
  timeZone: localStorage.getItem('hm_timeZone') || 'America/New_York',
  dateFormat: localStorage.getItem('hm_dateFormat') || 'MM/DD/YYYY',
  unitSystem: (localStorage.getItem('hm_unitSystem') as 'Metric' | 'Imperial') || 'Imperial',
  theme: initialTheme,
  language: initialLang,
  pushNotifications: true,
  emailAlerts: true,
  aiSuggestions: localStorage.getItem('hm_ai_suggestions') !== 'false',
  aiPredictions: localStorage.getItem('hm_ai_predictions') !== 'false',
  aiRecipes: localStorage.getItem('hm_ai_recipes') !== 'false',
  aiOcr: localStorage.getItem('hm_ai_ocr') !== 'false',
  isLoading: false,
  sidebarCollapsed: false,
  reducedMotion: localStorage.getItem('hm_reducedMotion') === 'true',
  compactMode: localStorage.getItem('hm_compactMode') === 'true',

  setReducedMotion: (reduced: boolean) => {
    localStorage.setItem('hm_reducedMotion', String(reduced));
    set({ reducedMotion: reduced });
  },

  setCompactMode: (compact: boolean) => {
    localStorage.setItem('hm_compactMode', String(compact));
    set({ compactMode: compact });
  },

  setLanguage: (lang: string) => {
    const norm = lang === 'hi' || lang.toLowerCase().startsWith('hindi') ? 'hi' : 'en';
    localStorage.setItem('hm_language', norm);
    applyLangToDOM(norm);
    set({ language: norm });
  },

  setTimeZone: (tz: string) => {
    localStorage.setItem('hm_timeZone', tz);
    set({ timeZone: tz });
  },

  setDateFormat: (df: string) => {
    localStorage.setItem('hm_dateFormat', df);
    set({ dateFormat: df });
  },

  setUnitSystem: (unit: 'Metric' | 'Imperial') => {
    localStorage.setItem('hm_unitSystem', unit);
    set({ unitSystem: unit });
  },

  saveSettings: async () => {
    const state = get();
    await state.updateSettings({
      country: state.country,
      currency: state.currency,
      currencySymbol: state.currencySymbol,
      timeZone: state.timeZone,
      dateFormat: state.dateFormat,
      unitSystem: state.unitSystem,
      theme: state.theme,
      language: state.language,
      pushNotifications: state.pushNotifications,
      emailAlerts: state.emailAlerts,
      aiSuggestions: state.aiSuggestions,
      aiPredictions: state.aiPredictions,
      aiRecipes: state.aiRecipes,
      aiOcr: state.aiOcr,
    });
  },

  toggleSidebar: () => {
    const current = get().sidebarCollapsed;
    set({ sidebarCollapsed: !current });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  setCountry: (countryCode: string) => {
    const defaults = getCountryDefaults(countryCode);
    localStorage.setItem('hm_country', countryCode);
    localStorage.setItem('hm_currency', defaults.currency);
    localStorage.setItem('hm_currencySymbol', defaults.currencySymbol);
    localStorage.setItem('hm_timeZone', defaults.timeZone);
    localStorage.setItem('hm_dateFormat', defaults.dateFormat);
    localStorage.setItem('hm_unitSystem', defaults.unitSystem);

    set({
      country: countryCode,
      currency: defaults.currency,
      currencySymbol: defaults.currencySymbol,
      timeZone: defaults.timeZone,
      dateFormat: defaults.dateFormat,
      unitSystem: defaults.unitSystem,
      language: defaults.language,
    });
  },

  setCurrency: (currencyCode: string) => {
    const info = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
    localStorage.setItem('hm_currency', info.code);
    localStorage.setItem('hm_currencySymbol', info.symbol);

    set({
      currency: info.code,
      currencySymbol: info.symbol,
    });
  },

  setTheme: (theme: 'dark' | 'light' | 'glass' | 'system') => {
    localStorage.setItem('hm_theme', theme);
    applyThemeToDOM(theme);
    set({ theme });
  },

  format: (amount: number) => {
    const { currency, currencySymbol } = get();
    return formatCurrency(amount, currency, currencySymbol);
  },

  updateSettings: async (newSettings: Partial<SettingState>) => {
    if (newSettings.theme) {
      localStorage.setItem('hm_theme', newSettings.theme);
      applyThemeToDOM(newSettings.theme);
    }
    if (newSettings.language) {
      const norm = newSettings.language === 'hi' || newSettings.language.toLowerCase().startsWith('hindi') ? 'hi' : 'en';
      newSettings.language = norm;
      localStorage.setItem('hm_language', norm);
      applyLangToDOM(norm);
    }
    if (newSettings.aiSuggestions !== undefined) {
      localStorage.setItem('hm_ai_suggestions', String(newSettings.aiSuggestions));
    }
    if (newSettings.aiPredictions !== undefined) {
      localStorage.setItem('hm_ai_predictions', String(newSettings.aiPredictions));
    }
    if (newSettings.aiRecipes !== undefined) {
      localStorage.setItem('hm_ai_recipes', String(newSettings.aiRecipes));
    }
    if (newSettings.aiOcr !== undefined) {
      localStorage.setItem('hm_ai_ocr', String(newSettings.aiOcr));
    }

    set((state) => ({ ...state, ...newSettings }));
    try {
      await apiClient.put('/settings', {
        ...newSettings,
        ...(newSettings.aiSuggestions !== undefined ? { proactiveAI: newSettings.aiSuggestions } : {}),
      });
    } catch (e) {
      console.warn('Failed to persist settings on server:', e);
    }
  },

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get('/settings');
      if (res.data) {
        const s = res.data;
        const symbol = SUPPORTED_CURRENCIES[s.currency]?.symbol || '$';
        const savedTheme = (localStorage.getItem('hm_theme') as 'dark' | 'light' | 'glass') || s.theme || 'dark';
        const savedLang = localStorage.getItem('hm_language') || (s.language ? (s.language === 'hi' || s.language.toLowerCase().startsWith('hindi') ? 'hi' : 'en') : 'en');

        localStorage.setItem('hm_currency', s.currency || 'USD');
        localStorage.setItem('hm_currencySymbol', symbol);
        localStorage.setItem('hm_theme', savedTheme);
        localStorage.setItem('hm_language', savedLang);
        applyThemeToDOM(savedTheme);
        applyLangToDOM(savedLang);

        const aiSuggestionsSaved = s.proactiveAI !== undefined ? s.proactiveAI : localStorage.getItem('hm_ai_suggestions') !== 'false';
        localStorage.setItem('hm_ai_suggestions', String(aiSuggestionsSaved));

        set({
          country: s.country || 'US',
          currency: s.currency || 'USD',
          currencySymbol: symbol,
          timeZone: s.timeZone || 'America/New_York',
          dateFormat: s.dateFormat || 'MM/DD/YYYY',
          unitSystem: s.unitSystem || 'Imperial',
          theme: savedTheme,
          language: savedLang,
          pushNotifications: s.pushNotifications ?? true,
          emailAlerts: s.emailAlerts ?? true,
          aiSuggestions: aiSuggestionsSaved,
          aiPredictions: localStorage.getItem('hm_ai_predictions') !== 'false',
          aiRecipes: localStorage.getItem('hm_ai_recipes') !== 'false',
          aiOcr: localStorage.getItem('hm_ai_ocr') !== 'false',
          isLoading: false,
        });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
