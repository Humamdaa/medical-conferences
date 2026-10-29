import { http } from '../../../shared/api/http';

export interface SpecialistOption {
  id: string;
  name: string;
}

export interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  doctorExists: boolean;
  specialist: SpecialistOption | null;
  nationalId: string | null;
  residence: string | null;
  clinicAddress: string | null;
  phoneNumber: string | null;
  certificateIssuedAt: string | null;
  certificateNumber: string | null;
  fatherName: string | null;
  isComplete: boolean;
  missingFields: string[];
}

export interface UpdateDoctorProfileInput {
  firstName?: string;
  lastName?: string;
  specialistId?: string;
  nationalId?: string;
  residence?: string;
  clinicAddress?: string;
  phoneNumber?: string;
  certificateIssuedAt?: string;
  certificateNumber?: string;
  fatherName?: string;
}

export const doctorApi = {
  profile: () => http<DoctorProfile>('/doctor-profile/me'),
  updateProfile: (input: UpdateDoctorProfileInput) =>
    http<DoctorProfile>('/doctor-profile/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  specialists: () => http<SpecialistOption[]>('/specialists'),
};
