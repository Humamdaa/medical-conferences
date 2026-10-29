import { http } from '../../../shared/api/http';
export interface ActivitySummary {
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
export interface ActivityListResponse {
  items: ActivitySummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export const activitiesApi = {
  list: (page = 1, pageSize = 9) => http<ActivityListResponse>(`/activities?page=${page}&pageSize=${pageSize}`),
};
