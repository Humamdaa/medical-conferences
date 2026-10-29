import { useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { authApi } from '../api/auth.api';
import type { AuthUser, LoginPayload, RegisterPayload } from '../api/auth.api';
import { ApiError } from '../../../shared/api/http';
import { AuthContext } from './auth.context';
import type { AuthStatus } from './auth.context';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    const run = generation.current;
    authApi.me().then((current) => {
      if (!active || run !== generation.current) return;
      setUser(current); setStatus('authenticated');
    }).catch((err: unknown) => {
      if (!active || run !== generation.current) return;
      setUser(null);
      setStatus(err instanceof ApiError && err.status === 401 ? 'guest' : 'error');
    });
    return () => { active = false; };
  }, []);

  async function signIn(data: LoginPayload) {
    generation.current += 1;
    const response = await authApi.login(data);
    setUser(response.user); setStatus('authenticated');
    return response.user;
  }
  async function signUp(data: RegisterPayload) {
    generation.current += 1;
    const response = await authApi.register(data);
    setUser(response.user); setStatus('authenticated');
    return response.user;
  }
  async function signOut() {
    await authApi.logout();
    generation.current += 1;
    setUser(null); setStatus('guest');
  }
  return <AuthContext.Provider value={{ user, status, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
