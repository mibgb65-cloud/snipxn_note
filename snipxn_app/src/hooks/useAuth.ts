import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}

export function useAuth(): AuthState {
  return useAuthStore(useShallow(state => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    accessToken: state.accessToken,
  })));
}

