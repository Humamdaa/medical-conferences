import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { GuestRoute, HomeRedirect, ProtectedRoute } from './features/auth/routing/AuthRoutes';
import { DoctorLayout } from './features/doctor/components/DoctorLayout';
import { DoctorProfilePage } from './features/doctor/pages/DoctorProfilePage';
import { DoctorActivitiesPage } from './features/doctor/pages/DoctorActivitiesPage';
import { RoleDashboard } from './features/auth/pages/RoleDashboard';
import { DoctorActivityDetailsPage } from './features/doctor/pages/DoctorActivityDetailsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute role="DOCTOR" />}>
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route path="activities/:id" element={<DoctorActivityDetailsPage />} />
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<DoctorProfilePage />} />
          <Route path="activities" element={<DoctorActivitiesPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route path="/admin" element={<RoleDashboard />} />
      </Route>
      <Route element={<ProtectedRoute role="SUPERVISOR" />}>
        <Route path="/supervisor" element={<RoleDashboard />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
