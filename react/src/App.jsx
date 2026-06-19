import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SeasonProvider } from "@/context/SeasonContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ToastProvider } from "@/components/Notification";
import { Navbar } from "@/components/layout/Navbar";
import { MainContent } from "@/components/layout/MainContent";
import { Footer } from "@/components/layout/Footer";
import { LoginPage } from "@/pages/LoginPage";
import { PublicRankings } from "@/pages/PublicRankings";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { SeasonManagement } from "@/pages/SeasonManagement";
import { DriverManagement } from "@/pages/DriverManagement";
import { CupManagement } from "@/pages/CupManagement";
import { RaceManagement } from "@/pages/RaceManagement";
import { RaceDetail } from "@/pages/RaceDetail";
import { DriverLoginPage } from "@/pages/driver/DriverLoginPage";
import { DriverProfilePage } from "@/pages/driver/DriverProfilePage";
import { AuthCallback } from "@/pages/AuthCallback";

/**
 * Protects admin-only routes.
 * Redirects unauthenticated users to /login and driver sessions
 * to /driver/profile (they should not access admin pages).
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isDriver, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
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
