import { useOutletContext } from 'react-router-dom';
import type { DoctorOutletContext } from '../components/DoctorLayout';
export function useDoctorProfile() {
  return useOutletContext<DoctorOutletContext>();
}
