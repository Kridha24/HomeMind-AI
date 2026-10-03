import { create } from 'zustand';
import { User, Household } from '../types';
import { queryClient } from '../queryClient';

export type AuthStatus = 'AUTH_LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthState {
  user: User | null;
  household: Household | null;
  accessToken: string | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  setAuth: (user: User, household: Household, accessToken: string, refreshToken: string) => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
  updateUser: (partialUser: Partial<User>) => void;
  updateHousehold: (partialHousehold: Partial<Household>) => void;
  setAuthStatus: (status: AuthStatus) => void;
  logout: () => void;
}

const getInitialAuthStatus = (): AuthStatus => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  if (token && user) return 'AUTHENTICATED';
  if (refreshToken) return 'AUTH_LOADING';
  return 'UNAUTHENTICATED';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  household: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('household') || 'null') : null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  authStatus: getInitialAuthStatus(),
  isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('accessToken')),

  setAuth: (user, household, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('household', JSON.stringify(household));
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    set({ user, household, accessToken, isAuthenticated: true, authStatus: 'AUTHENTICATED' });
  },

  updateTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ accessToken, isAuthenticated: true, authStatus: 'AUTHENTICATED' });
  },

  updateUser: (partialUser) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updated = { ...currentUser, ...partialUser };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  updateHousehold: (partialHousehold) => {
    const currentHousehold = get().household;
    if (!currentHousehold) return;
    const updated = { ...currentHousehold, ...partialHousehold };
    localStorage.setItem('household', JSON.stringify(updated));
    set({ household: updated });
  },

  setAuthStatus: (status: AuthStatus) => {
    set({ authStatus: status, isAuthenticated: status === 'AUTHENTICATED' });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('household');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    try {
      queryClient.clear();
    } catch {}
    set({ user: null, household: null, accessToken: null, isAuthenticated: false, authStatus: 'UNAUTHENTICATED' });
  },
}));

// Cross-tab Synchronization Listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'accessToken') {
      if (event.newValue) {
        useAuthStore.setState({
          accessToken: event.newValue,
          isAuthenticated: true,
          authStatus: 'AUTHENTICATED'
        });
      } else {
        useAuthStore.setState({
          user: null,
          household: null,
          accessToken: null,
          isAuthenticated: false,
          authStatus: 'UNAUTHENTICATED'
        });
      }
    } else if (event.key === 'user' && event.newValue) {
      try {
        useAuthStore.setState({ user: JSON.parse(event.newValue) });
      } catch {}
    } else if (event.key === 'household' && event.newValue) {
      try {
        useAuthStore.setState({ household: JSON.parse(event.newValue) });
      } catch {}
    }
  });

  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('homemind_auth_sync');
      channel.onmessage = (msg) => {
        if (msg.data?.type === 'TOKEN_REFRESHED' && msg.data?.accessToken) {
          useAuthStore.setState({
            accessToken: msg.data.accessToken,
            isAuthenticated: true,
            authStatus: 'AUTHENTICATED'
          });
        } else if (msg.data?.type === 'AUTH_LOGOUT') {
          useAuthStore.getState().logout();
        }
      };
    } catch {}
  }
}
