import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
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

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

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

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rankings" replace />} />
      <Route path="/rankings" element={<PublicRankings />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/seasons"
        element={
          <ProtectedRoute>
            <SeasonManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute>
            <DriverManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cups"
        element={
          <ProtectedRoute>
            <CupManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/races"
        element={
          <ProtectedRoute>
            <RaceManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/race"
        element={
          <ProtectedRoute>
            <RaceDetail />
          </ProtectedRoute>
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
