import { http } from '../../../shared/api/http';

export interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN';
}

export interface AdminActivity {
  id: string;
  name: string;
  activityType: string;
  startAt: string;
  endAt: string;
  location: string;
  institution: string;
  description: string;
  points: number;
  specialist: { id: string; name: string };
}

export interface AdminActivityDetails extends AdminActivity {
  customFields?: unknown;
  formSchemaSnapshot?: unknown;
}

export interface AdminActivityList {
  items: AdminActivity[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const adminApi = {
  getProfile: () => http<AdminProfile>('/admin-profile/me'),
  updateProfile: (data: { firstName?: string; lastName?: string }) =>
    http<AdminProfile>('/admin-profile/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listActivities: (page = 1, pageSize = 9) =>
    http<AdminActivityList>(`/activities?page=${page}&pageSize=${pageSize}`),
  getActivity: (id: string) =>
    http<AdminActivityDetails>(`/activities/${encodeURIComponent(id)}`),
};
