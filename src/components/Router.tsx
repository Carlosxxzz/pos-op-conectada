import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import PatientLoginPage from '@/components/pages/PatientLoginPage';
import PatientDashboardPage from '@/components/pages/PatientDashboardPage';
import PatientChecklistPage from '@/components/pages/PatientChecklistPage';
import PatientPhotosPage from '@/components/pages/PatientPhotosPage';
import PatientHistoryPage from '@/components/pages/PatientHistoryPage';
import NursingDashboardPage from '@/components/pages/NursingDashboardPage';
import NursingEvaluationPage from '@/components/pages/NursingEvaluationPage';
import MedicalDashboardPage from '@/components/pages/MedicalDashboardPage';
import MedicalEvaluationPage from '@/components/pages/MedicalEvaluationPage';
import AdminDashboardPage from '@/components/pages/AdminDashboardPage';

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
        path: "patient-dashboard",
        element: <PatientDashboardPage />,
      },
      {
        path: "patient-checklist",
        element: <PatientChecklistPage />,
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
        path: "nursing-dashboard",
        element: <NursingDashboardPage />,
      },
      {
        path: "nursing-evaluation/:id",
        element: <NursingEvaluationPage />,
      },
      {
        path: "medical-dashboard",
        element: <MedicalDashboardPage />,
      },
      {
        path: "medical-evaluation/:id",
        element: <MedicalEvaluationPage />,
      },
      {
        path: "admin-dashboard",
        element: <AdminDashboardPage />,
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
