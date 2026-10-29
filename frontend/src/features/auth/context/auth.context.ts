import { createContext } from 'react';
import type { AuthUser, LoginPayload, RegisterPayload } from '../api/auth.api';
export type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error';
export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (input: LoginPayload) => Promise<AuthUser>;
  signUp: (input: RegisterPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
