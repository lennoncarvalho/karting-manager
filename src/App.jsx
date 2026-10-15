import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SeasonProvider } from "@/context/SeasonContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ToastProvider } from "@/components/Notification";
import { Spinner } from "@/components/Spinner";
import { Navbar } from "@/components/layout/Navbar";
import { MainContent } from "@/components/layout/MainContent";
import { Footer } from "@/components/layout/Footer";

const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const PublicRankings = lazy(() =>
  import("@/pages/PublicRankings").then((m) => ({ default: m.PublicRankings })),
);
const AdminDashboard = lazy(() =>
  import("@/pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard })),
);
const SeasonManagement = lazy(() =>
  import("@/pages/SeasonManagement").then((m) => ({
    default: m.SeasonManagement,
  })),
);
const DriverManagement = lazy(() =>
  import("@/pages/DriverManagement").then((m) => ({
    default: m.DriverManagement,
  })),
);
const CupManagement = lazy(() =>
  import("@/pages/CupManagement").then((m) => ({ default: m.CupManagement })),
);
const RaceManagement = lazy(() =>
  import("@/pages/RaceManagement").then((m) => ({ default: m.RaceManagement })),
);
const RaceDetail = lazy(() =>
  import("@/pages/RaceDetail").then((m) => ({ default: m.RaceDetail })),
);
const DriverLoginPage = lazy(() =>
  import("@/pages/driver/DriverLoginPage").then((m) => ({
    default: m.DriverLoginPage,
  })),
);
const DriverProfilePage = lazy(() =>
  import("@/pages/driver/DriverProfilePage").then((m) => ({
    default: m.DriverProfilePage,
  })),
);
const AuthCallback = lazy(() =>
  import("@/pages/AuthCallback").then((m) => ({ default: m.AuthCallback })),
);

/**
 * Protects admin-only routes.
 * Redirects unauthenticated users to /login and driver sessions
 * to /driver/profile (they should not access admin pages).
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isDriver, loading } = useAuth();

  if (loading) {
    return <Spinner sm centered />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Driver sessions must not access admin routes
  if (isDriver) {
    return <Navigate to="/driver/profile" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner sm centered />}>
      <Routes>
        <Route path="/" element={<Navigate to="/rankings" replace />} />
        <Route path="/rankings" element={<PublicRankings />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/driver/login" element={<DriverLoginPage />} />
        <Route path="/driver/profile" element={<DriverProfilePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/seasons"
          element={
            <AdminRoute>
              <SeasonManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/drivers"
          element={
            <AdminRoute>
              <DriverManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cups"
          element={
            <AdminRoute>
              <CupManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/races"
          element={
            <AdminRoute>
              <RaceManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/race"
          element={
            <AdminRoute>
              <RaceDetail />
            </AdminRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <SeasonProvider>
        <LoadingProvider>
          <ToastProvider>
            <Navbar />
            <MainContent>
              <AppRoutes />
            </MainContent>
            <Footer />
          </ToastProvider>
        </LoadingProvider>
      </SeasonProvider>
    </AuthProvider>
  );
}

export default App;
