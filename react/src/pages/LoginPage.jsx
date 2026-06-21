import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Notification";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notify } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setServerError("");

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      notify(t("notifications.welcomeBack"), "success");
      navigate("/admin", { replace: true });
    } catch (err) {
      setServerError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h1 className="h5 mb-0">{t("login.title")}</h1>
            </div>
            <div className="card-body">
              {serverError && (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                </div>
              )}
              <form id="login-form" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    {t("common.labels.email")}
                  </label>
                  <input
                    type="email"
                    className={`form-control ${emailError ? "is-invalid" : ""}`}
                    id="email"
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
                    required
                  />
                  {emailError && (
                    <div className="invalid-feedback">{emailError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    {t("common.labels.password")}
                  </label>
                  <input
                    type="password"
                    className={`form-control ${passwordError ? "is-invalid" : ""}`}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                      e.target.setCustomValidity("");
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      setPasswordError(t("validation.passwordRequired"));
                    }}
                    autoComplete="current-password"
                    required
                  />
                  {passwordError && (
                    <div className="invalid-feedback">{passwordError}</div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={submitting}
                >
                  {submitting ? t("login.signingIn") : t("login.signIn")}
                </button>
              </form>
            </div>
            <div className="card-footer text-center">
              <Link to="/driver/login" className="text-muted small">
                {t("login.driverLoginLink")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
