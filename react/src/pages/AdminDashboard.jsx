import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Notification";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/validation";
import { changePassword, createAdmin } from "@/lib/auth";
import { useLoading } from "@/context/LoadingContext";
import { Link } from "react-router-dom";

export function AdminDashboard() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { withLoading: loading } = useLoading();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminTempPassword, setAdminTempPassword] = useState("");
  const [adminEmailError, setAdminEmailError] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [isFirstAdmin, setIsFirstAdmin] = useState(true);

  useEffect(() => {
    const checkFirst = async () => {
      const { listDrivers } = await import("@/lib/api");
      try {
        const drivers = await listDrivers({ limit: 1 });
        const count = drivers.length;
        setIsFirstAdmin(count <= 1);
        if (count > 1 && !isAuthenticated) {
          setIsFirstAdmin(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkFirst();
  }, [isAuthenticated]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setNewPasswordError("");
    setConfirmPasswordError("");

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t("validation.passwordsMustMatch"));
      notify(t("notifications.pleaseFix"), "warning");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await loading(() => changePassword(newPassword));
      notify(t("notifications.passwordUpdated"), "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      notify(
        err.message || t("common.errors.routeLoad", { message: err.message }),
        "error",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setAdminEmailError("");
    setAdminPasswordError("");

    const email = adminEmail.trim();
    const password = adminTempPassword;

    // Defense-in-depth: native HTML5 validation already blocks invalid emails,
    // but keep this guard so no bad input ever reaches Supabase.
    if (!isValidEmail(email)) {
      setAdminEmailError(t("validation.validEmailRequired"));
      notify(t("notifications.pleaseFix"), "warning");
      return;
    }

    setAdminSubmitting(true);
    try {
      await loading(() => createAdmin(email, password));
      notify(t("notifications.adminCreated"), "success");
      setAdminEmail("");
      setAdminTempPassword("");
    } catch (err) {
      notify(
        err.message || t("common.errors.routeLoad", { message: err.message }),
        "error",
      );
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{t("adminDashboard.title")}</h1>
          <p className="h6 mb-0">{t("adminDashboard.subtitle")}</p>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                {t("adminDashboard.cards.races.title")}
              </h5>
              <p className="card-text">
                {t("adminDashboard.cards.races.description")}
              </p>
              <Link
                to="/admin/races"
                className="btn btn-outline-primary btn-sm"
              >
                {t("common.actions.manage")}
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                {t("adminDashboard.cards.drivers.title")}
              </h5>
              <p className="card-text">
                {t("adminDashboard.cards.drivers.description")}
              </p>
              <Link
                to="/admin/drivers"
                className="btn btn-outline-primary btn-sm"
              >
                {t("common.actions.manage")}
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                {t("adminDashboard.cards.cups.title")}
              </h5>
              <p className="card-text">
                {t("adminDashboard.cards.cups.description")}
              </p>
              <Link to="/admin/cups" className="btn btn-outline-primary btn-sm">
                {t("common.actions.manage")}
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                {t("adminDashboard.cards.seasons.title")}
              </h5>
              <p className="card-text">
                {t("adminDashboard.cards.seasons.description")}
              </p>
              <Link
                to="/admin/seasons"
                className="btn btn-outline-primary btn-sm"
              >
                {t("common.actions.manage")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-4">
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h2 className="h6 mb-0">
                {t("adminDashboard.changePassword.title")}
              </h2>
            </div>
            <div className="card-body">
              <form id="password-form" onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="new-password">
                    {t("adminDashboard.changePassword.newPassword")}
                  </label>
                  <input
                    type="password"
                    className={`form-control ${newPasswordError ? "is-invalid" : ""}`}
                    id="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (newPasswordError) setNewPasswordError("");
                      e.target.setCustomValidity("");
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      setNewPasswordError(t("validation.newPasswordRequired"));
                    }}
                    autoComplete="new-password"
                  />
                  {newPasswordError && (
                    <div className="invalid-feedback">{newPasswordError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="confirm-password">
                    {t("adminDashboard.changePassword.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    className={`form-control ${confirmPasswordError ? "is-invalid" : ""}`}
                    id="confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                      e.target.setCustomValidity("");
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      setConfirmPasswordError(
                        t("validation.newPasswordRequired"),
                      );
                    }}
                    autoComplete="new-password"
                  />
                  {confirmPasswordError && (
                    <div className="invalid-feedback">
                      {confirmPasswordError}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="password-submit"
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting
                    ? t("adminDashboard.changePassword.updating")
                    : t("adminDashboard.changePassword.submit")}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h2 className="h6 mb-0">
                {t("adminDashboard.inviteAdmin.title")}
              </h2>
            </div>
            <div className="card-body">
              {isFirstAdmin ? (
                <>
                  <form id="admin-form" onSubmit={handleInviteSubmit}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="admin-email">
                        {t("common.labels.email")}
                      </label>
                      <input
                        type="email"
                        className={`form-control ${adminEmailError ? "is-invalid" : ""}`}
                        id="admin-email"
                        required
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          if (adminEmailError) setAdminEmailError("");
                          e.target.setCustomValidity("");
                        }}
                        onInvalid={(e) => {
                          e.preventDefault();
                          setAdminEmailError(
                            e.target.validity.valueMissing
                              ? t("validation.emailRequired")
                              : t("validation.validEmailRequired"),
                          );
                        }}
                        autoComplete="email"
                      />
                      {adminEmailError && (
                        <div className="invalid-feedback">
                          {adminEmailError}
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="admin-password">
                        {t("adminDashboard.inviteAdmin.tempPassword")}
                      </label>
                      <input
                        type="password"
                        className={`form-control ${adminPasswordError ? "is-invalid" : ""}`}
                        id="admin-password"
                        required
                        value={adminTempPassword}
                        onChange={(e) => {
                          setAdminTempPassword(e.target.value);
                          if (adminPasswordError) setAdminPasswordError("");
                          e.target.setCustomValidity("");
                        }}
                        onInvalid={(e) => {
                          e.preventDefault();
                          setAdminPasswordError(
                            t("validation.tempPasswordRequired"),
                          );
                        }}
                        autoComplete="new-password"
                      />
                      {adminPasswordError && (
                        <div className="invalid-feedback">
                          {adminPasswordError}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="btn btn-outline-primary"
                      id="admin-submit"
                      disabled={adminSubmitting}
                    >
                      {adminSubmitting
                        ? t("adminDashboard.inviteAdmin.creating")
                        : t("adminDashboard.inviteAdmin.submit")}
                    </button>
                    <div className="form-text mt-2" id="admin-note">
                      {t("adminDashboard.inviteAdmin.noteInfo")}
                    </div>
                  </form>
                </>
              ) : (
                <div className="alert alert-info">
                  {t("adminDashboard.inviteAdmin.noteOnlyFirst")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
