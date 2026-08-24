import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { PatientLayout } from '../layouts/PatientLayout';
import { DoctorLayout } from '../layouts/DoctorLayout';

// Common Auth Guard
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { DoctorSearchPage } from '../pages/public/DoctorSearchPage';
import { DoctorDetailPage } from '../pages/public/DoctorDetailPage';
import { LoginPage } from '../pages/public/LoginPage';
import { PatientRegisterPage } from '../pages/public/PatientRegisterPage';
import { DoctorRegisterPage } from '../pages/public/DoctorRegisterPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

// Patient Pages
import { PatientDashboardPage } from '../pages/patient/PatientDashboardPage';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage';
import { PatientAppointmentsPage } from '../pages/patient/PatientAppointmentsPage';
import { PatientPrescriptionsPage } from '../pages/patient/PatientPrescriptionsPage';

// Doctor Pages
import { DoctorDashboardPage } from '../pages/doctor/DoctorDashboardPage';
import { DoctorProfilePage } from '../pages/doctor/DoctorProfilePage';
import { DoctorAvailabilityPage } from '../pages/doctor/DoctorAvailabilityPage';
import { DoctorAppointmentsPage } from '../pages/doctor/DoctorAppointmentsPage';
import { DoctorPatientsPage } from '../pages/doctor/DoctorPatientsPage';
import { DoctorPatientDetailPage } from '../pages/doctor/DoctorPatientDetailPage';
import { DoctorReviewsPage } from '../pages/doctor/DoctorReviewsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Public Routes Wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctors" element={<DoctorSearchPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/patient" element={<PatientRegisterPage />} />
        <Route path="/register/doctor" element={<DoctorRegisterPage />} />
      </Route>

      {/* 2. Patient Protected Routes Wrapped in PatientLayout */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PatientDashboardPage />} />
        <Route path="profile" element={<PatientProfilePage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
        <Route path="doctors" element={<Navigate to="/doctors" replace />} />
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
      </Route>

      {/* 3. Doctor Protected Routes Wrapped in DoctorLayout */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DoctorDashboardPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
        <Route path="availability" element={<DoctorAvailabilityPage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="patients/:id" element={<DoctorPatientDetailPage />} />
        <Route path="reviews" element={<DoctorReviewsPage />} />
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
      </Route>

      {/* 4. 404 Catch-all */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
