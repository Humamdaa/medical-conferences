
import { http } from '../../../shared/api/http';

export type AttendanceStatus =
  | 'REGISTERED'
  | 'ATTENDED'
  | 'CANCELLED';

export type ParticipationRole = 'ATTENDEE' | 'PARTICIPANT';

export interface MyActivity {
  activityId: string;
  activityName: string;
  date: string;
  participationRole: ParticipationRole;
  status: AttendanceStatus;
  availablePoints: number;
  earnedPoints: number;
}

export interface MyActivitiesResponse {
  totalPoints: number;
  activities: MyActivity[];
}

export const myActivitiesApi = {
  getAll: () =>
    http<MyActivitiesResponse>('/doctor-profile/me/points'),
};
