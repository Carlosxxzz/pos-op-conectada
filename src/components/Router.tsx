import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import PatientLoginPage from '@/components/pages/PatientLoginPage';
import PatientPasswordRecoveryPage from '@/components/pages/PatientPasswordRecoveryPage';
import PatientDashboardPage from '@/components/pages/PatientDashboardPage';
import PatientChecklistPage from '@/components/pages/PatientChecklistPage';
import PatientPhotoUploadPage from '@/components/pages/PatientPhotoUploadPage';
import PatientPhotosPage from '@/components/pages/PatientPhotosPage';
import PatientHistoryPage from '@/components/pages/PatientHistoryPage';
import PatientEvaluationsPage from '@/components/pages/PatientEvaluationsPage';
import ProfessionalLoginPage from '@/components/pages/ProfessionalLoginPage';
import NursingDashboardPage from '@/components/pages/NursingDashboardPage';
import NursingEvaluationPage from '@/components/pages/NursingEvaluationPage';
import NursingReferralViewPage from '@/components/pages/NursingReferralViewPage';
import MedicalDashboardPage from '@/components/pages/MedicalDashboardPage';
import MedicalEvaluationPage from '@/components/pages/MedicalEvaluationPage';
import MedicalEvaluationHistoryPage from '@/components/pages/MedicalEvaluationHistoryPage';
import MedicalProfilePage from '@/components/pages/MedicalProfilePage';
import AdminDashboardPage from '@/components/pages/AdminDashboardPage';
import { ProfessionalProtectedRoute } from '@/components/ProfessionalProtectedRoute';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        routeMetadata: {
          pageIdentifier: 'home',
        },
      },
      {
        path: "patient-login",
        element: <PatientLoginPage />,
      },
      {
        path: "patient-password-recovery",
        element: <PatientPasswordRecoveryPage />,
      },
      {
        path: "patient-dashboard",
        element: <PatientDashboardPage />,
      },
      {
        path: "patient-checklist",
        element: <PatientChecklistPage />,
      },
      {
        path: "patient-photo-upload/:checklistId",
        element: <PatientPhotoUploadPage />,
      },
      {
        path: "patient-photos",
        element: <PatientPhotosPage />,
      },
      {
        path: "patient-history",
        element: <PatientHistoryPage />,
      },
      {
        path: "patient-evaluations",
        element: <PatientEvaluationsPage />,
      },
      {
        path: "professional-login",
        element: <ProfessionalLoginPage />,
      },
      {
        path: "nursing-dashboard",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Enfermeiro']}>
            <NursingDashboardPage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "nursing-evaluation/:id",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Enfermeiro']}>
            <NursingEvaluationPage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "nursing-referral-view/:referralId",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Enfermeiro']}>
            <NursingReferralViewPage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "medical-dashboard",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Médico']}>
            <MedicalDashboardPage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "medical-evaluation/:id",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Médico']}>
            <MedicalEvaluationPage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "medical-evaluation-history/:id",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Médico']}>
            <MedicalEvaluationHistoryPage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "medical-profile",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Médico']}>
            <MedicalProfilePage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "admin-dashboard",
        element: (
          <ProfessionalProtectedRoute allowedProfiles={['Administrador']}>
            <AdminDashboardPage />
          </ProfessionalProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
