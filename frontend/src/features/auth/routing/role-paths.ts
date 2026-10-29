import type { Role } from '../api/auth.api';
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/admin', SUPERVISOR: '/supervisor', DOCTOR: '/doctor/profile',
};
