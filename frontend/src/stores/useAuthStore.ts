import { create } from 'zustand';
import { User, Household } from '../types';

interface AuthState {
  user: User | null;
  household: Household | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, household: Household, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  household: JSON.parse(localStorage.getItem('household') || 'null'),
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  setAuth: (user, household, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('household', JSON.stringify(household));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, household, accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('household');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, household: null, accessToken: null, isAuthenticated: false });
  },
}));
