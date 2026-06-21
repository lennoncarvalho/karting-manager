import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Notification";
import { DriverImage } from "@/components/driverImage";

// Fields a driver is allowed to self-edit (visual / non-critical only).
// Critical fields like id, email, name, created_at, updated_at are excluded.
const SELF_EDITABLE_FIELDS = [
  "nickname",
  "birth_date",
  "sex",
  "blood_type",
  "weight",
  "picture_url",
];

export function DriverProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isDriver, loading, logout } =
    useAuth();
  const { notify } = useToast();
  const fileInputRef = useRef(null);

  const [driver, setDriver] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const fetchDriver = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setDriver(data);
        setForm({
          nickname: data.nickname || "",
          birth_date: data.birth_date || "",
          sex: data.sex || "",
          blood_type: data.blood_type || "",
          weight: data.weight ?? "",
        });
      }
      setFetching(false);
    };

    fetchDriver();
  }, [user?.email]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      notify(t("driverProfile.invalidImage"), "error");
      return;
    }

    setUploading(true);
    try {
      // Upload to driver-pictures/{uid}/avatar with file extension
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-pictures")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("driver-pictures").getPublicUrl(path);

      // Update the driver row with the new picture URL (bust cache with timestamp)
      const pictureUrl = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("drivers")
        .update({ picture_url: pictureUrl })
        .eq("email", user.email);
      if (updateError) throw updateError;

      setDriver((prev) => ({ ...prev, picture_url: pictureUrl }));
      notify(t("driverProfile.avatarUpdated"), "success");
    } catch (err) {
      notify(err.message || t("errors.uploadFailed"), "error");
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Build update payload with only self-editable fields
      const updates = {};
      for (const field of SELF_EDITABLE_FIELDS) {
        if (field === "picture_url") continue; // handled separately via upload
        const value = form[field];
        updates[field] = value === "" ? null : value;
      }

      // Validate weight if provided
      if (updates.weight !== null && isNaN(Number(updates.weight))) {
        notify(t("validation.weightMustBeNumber"), "warning");
        setSaving(false);
        return;
      }
      if (updates.weight !== null) {
        updates.weight = Number(updates.weight);
      }

      const { data, error } = await supabase
        .from("drivers")
        .update(updates)
        .eq("email", user.email)
        .select("*")
        .single();
      if (error) throw error;

      setDriver(data);
      notify(t("driverProfile.saved"), "success");
    } catch (err) {
      notify(err.message || t("driverProfile.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/driver/login", { replace: true });
  };

  // Redirect unauthenticated or admin users (placed after all hooks)
  if (!loading && !isAuthenticated) {
    return <Navigate to="/driver/login" replace />;
  }
  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (loading || fetching) {
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

  // Email not registered as a driver
  if (notFound) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5 text-center">
            <div className="card shadow-sm">
              <div className="card-body py-5">
                <i
                  className="bi bi-exclamation-circle d-block mb-3"
                  style={{ fontSize: "2.5rem", color: "var(--bs-warning)" }}
                ></i>
                <p className="fw-semibold mb-1">
                  {t("driverProfile.notRegistered")}
                </p>
                <p className="text-muted small mb-3">
                  {t("driverProfile.notRegisteredDetail")}
                </p>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleSignOut}
                >
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header text-white d-flex justify-content-between align-items-center">
              <h1 className="h5 mb-0">{t("driverProfile.title")}</h1>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={handleSignOut}
              >
                {t("nav.logout")}
              </button>
            </div>
            <div className="card-body">
              {/* Avatar section */}
              <div className="text-center mb-4">
                <DriverImage
                  src={driver.picture_url}
                  seed={driver.name}
                  alt={driver.name}
                  size={120}
                  className="rounded-circle mb-2"
                />
                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="btn btn-sm btn-outline-primary"
                    style={{ minHeight: "40px", lineHeight: "28px" }}
                  >
                    {uploading
                      ? t("driverProfile.uploading")
                      : t("driverProfile.changePhoto")}
                  </label>
                  <input
                    ref={fileInputRef}
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Read-only info */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  {t("common.labels.name")}
                </label>
                <p className="form-control-plaintext">{driver.name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  {t("common.labels.email")}
                </label>
                <p className="form-control-plaintext">{driver.email}</p>
              </div>

              {/* Editable fields */}
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label htmlFor="dp-nickname" className="form-label">
                    {t("common.labels.nickname")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="dp-nickname"
                    value={form.nickname}
                    onChange={(e) => handleChange("nickname", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="dp-birth-date" className="form-label">
                    {t("common.labels.birthDate")}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="dp-birth-date"
                    value={form.birth_date}
                    onChange={(e) => handleChange("birth_date", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="dp-sex" className="form-label">
                    {t("common.labels.sex")}
                  </label>
                  <select
                    className="form-select"
                    id="dp-sex"
                    value={form.sex}
                    onChange={(e) => handleChange("sex", e.target.value)}
                  >
                    <option value="">
                      {t("driverManagement.form.sexSelect")}
                    </option>
                    <option value="M">
                      {t("driverManagement.form.sexMale")}
                    </option>
                    <option value="F">
                      {t("driverManagement.form.sexFemale")}
                    </option>
                    <option value="O">
                      {t("driverManagement.form.sexOther")}
                    </option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="dp-blood-type" className="form-label">
                    {t("common.labels.bloodType")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="dp-blood-type"
                    placeholder={t("driverManagement.form.bloodPlaceholder")}
                    value={form.blood_type}
                    onChange={(e) => handleChange("blood_type", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="dp-weight" className="form-label">
                    {t("common.labels.weight")}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="dp-weight"
                    placeholder={t("driverManagement.form.weightPlaceholder")}
                    value={form.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    step="0.1"
                    min="0"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2"
                  disabled={saving}
                  style={{ minHeight: "48px" }}
                >
                  {saving
                    ? t("common.status.updating")
                    : t("common.actions.save")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
