import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/validation";

export function DriverLoginPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isDriver, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect already-authenticated users to their appropriate area
  if (!loading && isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isDriver) return <Navigate to="/driver/profile" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setServerError("");

    // Defense-in-depth: native HTML5 already blocks invalid emails on submit,
    // but keep this guard so no bad input ever reaches Supabase.
    if (!isValidEmail(email)) {
      setEmailError(t("validation.validEmailRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setEmailSent(true);
    } catch (err) {
      setServerError(err.message || t("driverLogin.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">{t("common.status.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h1 className="h5 mb-0">{t("driverLogin.title")}</h1>
            </div>
            <div className="card-body">
              {emailSent ? (
                /* Confirmation message after magic link is sent */
                <div className="text-center py-3">
                  <i
                    className="bi bi-envelope-check d-block mb-3"
                    style={{ fontSize: "2.5rem" }}
                  ></i>
                  <p className="mb-1 fw-semibold">
                    {t("driverLogin.checkInbox")}
                  </p>
                  <p className="text-muted small">
                    {t("driverLogin.checkInboxDetail", { email: email.trim() })}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm mt-2"
                    onClick={() => {
                      setEmailSent(false);
                      setServerError("");
                    }}
                  >
                    {t("driverLogin.tryAnother")}
                  </button>
                </div>
              ) : (
                <>
                  {serverError && (
                    <div className="alert alert-danger" role="alert">
                      {serverError}
                    </div>
                  )}
                  <p className="text-muted small mb-3" style={{ whiteSpace: "pre-line" }}>
                    {t("driverLogin.instructions")}
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="driver-email" className="form-label">
                        {t("common.labels.email")}
                      </label>
                      <input
                        type="email"
                        className={`form-control form-control-lg ${emailError ? "is-invalid" : ""}`}
                        id="driver-email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError("");
                          e.target.setCustomValidity("");
                        }}
                        onInvalid={(e) => {
                          e.preventDefault();
                          setEmailError(
                            e.target.validity.valueMissing
                              ? t("validation.emailRequired")
                              : t("validation.validEmailRequired"),
                          );
                        }}
                        autoComplete="email"
                        inputMode="email"
                        required
                      />
                      {emailError && (
                        <div className="invalid-feedback">{emailError}</div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2"
                      disabled={submitting}
                      style={{ minHeight: "48px" }}
                    >
                      {submitting
                        ? t("driverLogin.sending")
                        : t("driverLogin.sendLink")}
                    </button>
                  </form>
                </>
              )}
            </div>
            <div className="card-footer text-center">
              <Link to="/login" className="text-muted small">
                {t("driverLogin.adminLoginLink")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
