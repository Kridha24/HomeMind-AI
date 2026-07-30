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
  theme: 'dark' | 'light' | 'glass';
  language: string;
  pushNotifications: boolean;
  emailAlerts: boolean;
  aiSuggestions: boolean;
  aiPredictions: boolean;
  aiRecipes: boolean;
  aiOcr: boolean;
  isLoading: boolean;
  
  // Actions
  setCountry: (countryCode: string) => void;
  setCurrency: (currencyCode: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'glass') => void;
  updateSettings: (newSettings: Partial<SettingState>) => Promise<void>;
  fetchSettings: () => Promise<void>;
  format: (amount: number) => string;
}

export const useSettingStore = create<SettingState>((set, get) => ({
  country: localStorage.getItem('hm_country') || 'US',
  currency: localStorage.getItem('hm_currency') || 'USD',
  currencySymbol: localStorage.getItem('hm_currencySymbol') || '$',
  timeZone: localStorage.getItem('hm_timeZone') || 'America/New_York',
  dateFormat: localStorage.getItem('hm_dateFormat') || 'MM/DD/YYYY',
  unitSystem: (localStorage.getItem('hm_unitSystem') as 'Metric' | 'Imperial') || 'Imperial',
  theme: (localStorage.getItem('hm_theme') as 'dark' | 'light' | 'glass') || 'dark',
  language: 'English',
  pushNotifications: true,
  emailAlerts: true,
  aiSuggestions: true,
  aiPredictions: true,
  aiRecipes: true,
  aiOcr: true,
  isLoading: false,

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

  setTheme: (theme: 'dark' | 'light' | 'glass') => {
    localStorage.setItem('hm_theme', theme);
    set({ theme });
  },

  format: (amount: number) => {
    const { currency, currencySymbol } = get();
    return formatCurrency(amount, currency, currencySymbol);
  },

  updateSettings: async (newSettings: Partial<SettingState>) => {
    if (newSettings.theme) {
      localStorage.setItem('hm_theme', newSettings.theme);
    }
    set((state) => ({ ...state, ...newSettings }));
    try {
      await apiClient.put('/settings', newSettings);
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

        localStorage.setItem('hm_currency', s.currency || 'USD');
        localStorage.setItem('hm_currencySymbol', symbol);
        localStorage.setItem('hm_theme', savedTheme);

        set({
          country: s.country || 'US',
          currency: s.currency || 'USD',
          currencySymbol: symbol,
          timeZone: s.timeZone || 'America/New_York',
          dateFormat: s.dateFormat || 'MM/DD/YYYY',
          unitSystem: s.unitSystem || 'Imperial',
          theme: savedTheme,
          language: s.language || 'English',
          pushNotifications: s.pushNotifications ?? true,
          emailAlerts: s.emailAlerts ?? true,
          isLoading: false,
        });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
