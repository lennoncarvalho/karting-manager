import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

/**
 * Handles the redirect after a magic-link click.
 * Supabase automatically exchanges the URL token for a session,
 * so we just wait for the auth state to settle and then route
 * the user to the correct area based on their role.
 */
export function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isDriver, loading } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // No session established — magic link may have expired or been invalid
      setError(t("authCallback.failed"));
      const timer = setTimeout(() => navigate("/driver/login", { replace: true }), 3000);
      return () => clearTimeout(timer);
    }

    // Route to the correct area based on role
    if (isAdmin) {
      navigate("/admin", { replace: true });
    } else if (isDriver) {
      navigate("/driver/profile", { replace: true });
    } else {
      navigate("/driver/login", { replace: true });
    }
  }, [loading, user, isAdmin, isDriver, navigate, t]);

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "60vh" }}
    >
      {error ? (
        <div className="text-center">
          <div className="alert alert-danger">{error}</div>
          <p className="text-muted small">{t("authCallback.redirecting")}</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="spinner-border spinner-border-sm mb-3" role="status">
            <span className="visually-hidden">{t("common.status.loading")}</span>
          </div>
          <p className="text-muted">{t("authCallback.verifying")}</p>
        </div>
      )}
    </div>
  );
}
