import { http } from '../../../shared/api/http';
import { z } from 'zod';

export type CustomValue = string | number | boolean;
export interface CreateActivityInput {
  name: string; activityType: string; startAt: string; endAt: string;
  location: string; institution: string; description: string; points: number;
  latitude: number | null; longitude: number | null; specialistId: string;
  expectedFormVersion: number; customFields: Record<string, CustomValue>;
}
const specialistOptions = z.array(z.object({ id: z.string().regex(/^[1-9]\d*$/), name: z.string() }));
export type SpecialistOption = z.infer<typeof specialistOptions>[number];

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
  createActivity: (data: CreateActivityInput) => http<AdminActivityDetails>('/activities', {
    method: 'POST', body: JSON.stringify(data),
  }),
  specialists: async (signal?: AbortSignal): Promise<SpecialistOption[]> => {
    const result = specialistOptions.safeParse(await http<unknown>('/specialists', { signal }));
    if (!result.success) throw new Error('استجابة الاختصاصات غير صالحة. أعد التحميل.');
    return result.data;
  },
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
