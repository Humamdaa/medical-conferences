
import { http } from '../../../shared/api/http';

// User roles
export type Role = 'DOCTOR' | 'ADMIN' | 'SUPERVISOR';

// Authenticated user
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

// Login request
export interface LoginPayload {
  email: string;
  password: string;
}

// Register request
export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

// Login & Register response
export interface AuthResponse {
  message: string;
  user: AuthUser;
}

// Logout response
interface MessageResponse {
  message: string;
}

// Compatibility with existing components
export type CurrentUser = AuthUser;
export type LoginInput = LoginPayload;
export type RegisterInput = RegisterPayload;

// API requests
export const authApi = {
  login: (data: LoginPayload) =>
    http<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterPayload) =>
    http<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => http<AuthUser>('/auth/me'),

  logout: () =>
    http<MessageResponse>('/auth/logout', {
      method: 'POST',
    }),
};
