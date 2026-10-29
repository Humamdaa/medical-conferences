import { http } from '../../../shared/api/http';

export type Role = 'ADMIN' | 'SUPERVISOR' | 'DOCTOR';
export interface AuthUser { id: string; firstName: string; lastName: string; email: string; role: Role; }
export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload extends LoginPayload { firstName: string; lastName: string; }
export interface AuthResponse { message: string; user: AuthUser; }
// Compatibility aliases for older auth screens; no duplicate interfaces.
export type CurrentUser = AuthUser;
export type LoginInput = LoginPayload;
export type RegisterInput = RegisterPayload;
interface MessageResponse { message: string; }

export const authApi = {
  login: (data: LoginPayload) => http<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: RegisterPayload) => http<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => http<AuthUser>('/auth/me'),
  logout: () => http<MessageResponse>('/auth/logout', { method: 'POST' }),
};
