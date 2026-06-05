import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Notification";
import { useLoading } from "@/context/LoadingContext";
import {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  uploadPicture,
} from "@/lib/api";
import { getDriverImageHtml } from "@/lib/image";
import { isRequired, isValidEmail } from "@/lib/validation";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

export function DriverManagement() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const { withLoading: loading } = useLoading();

  const [drivers, setDrivers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [formId, setFormId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formSex, setFormSex] = useState("");
  const [formBloodType, setFormBloodType] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formPicture, setFormPicture] = useState(null);

  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [weightError, setWeightError] = useState("");

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadDrivers = async () => {
    try {
      const data = await listDrivers({
        order: { column: "name", ascending: true },
      });
      setDrivers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const resetForm = () => {
    setFormId("");
    setFormEmail("");
    setFormName("");
    setFormNickname("");
    setFormBirthDate("");
    setFormSex("");
    setFormBloodType("");
    setFormWeight("");
    setFormPicture(null);
    setEmailError("");
    setNameError("");
    setWeightError("");
    setEditing(false);
  };

  const handleClear = () => {
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = formEmail.trim();
    const name = formName.trim();
    const nickname = formNickname.trim();
    const birthDate = formBirthDate;
    const sex = formSex;
    const bloodType = formBloodType.trim();
    const weightValue = formWeight;
    const weight = weightValue ? Number(weightValue) : null;

    setEmailError("");
    setNameError("");
    setWeightError("");

    let hasError = false;

    if (!isRequired(email) || !isValidEmail(email)) {
      setEmailError(t("validation.validEmailRequired"));
      hasError = true;
    }
    if (!isRequired(name)) {
      setNameError(t("validation.driverNameRequired"));
      hasError = true;
    }
    if (weightValue && Number.isNaN(weight)) {
      setWeightError(t("validation.weightMustBeNumber"));
      hasError = true;
    }
    if (
      !formId &&
      drivers.some((d) => d.email.toLowerCase() === email.toLowerCase())
    ) {
      setEmailError(t("validation.emailExists"));
      hasError = true;
    }

    if (hasError) {
      notify(t("notifications.pleaseFix"), "warning");
      return;
    }

    try {
      await loading(async () => {
        let pictureUrl = null;
        if (formPicture) {
          pictureUrl = await uploadPicture(formPicture);
        }

        const payload = {
          email,
          name,
          nickname: nickname || null,
          birth_date: birthDate || null,
          sex: sex || null,
          blood_type: bloodType || null,
          weight: weight,
          picture_url: pictureUrl || null,
        };

        if (formId) {
          if (!pictureUrl) delete payload.picture_url;
          await updateDriver(formId, payload);
          notify(t("notifications.driverUpdated"), "success");
        } else {
          await createDriver(payload);
          notify(t("notifications.driverCreated"), "success");
        }
      });
      resetForm();
      await loadDrivers();
    } catch (err) {
      notify(err.message || "Failed to save driver", "error");
    }
  };

  const handleEdit = (driver) => {
    setFormId(driver.id);
    setFormEmail(driver.email);
    setFormName(driver.name);
    setFormNickname(driver.nickname || "");
    setFormBirthDate(driver.birth_date || "");
    setFormSex(driver.sex || "");
    setFormBloodType(driver.blood_type || "");
    setFormWeight(driver.weight || "");
    setFormPicture(null);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRequest = (driver) => {
    setConfirmDelete(driver);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await loading(async () => {
        await deleteDriver(confirmDelete.id);
        notify(t("notifications.driverDeleted"), "success");
      });
      await loadDrivers();
    } catch (err) {
      notify(err.message || "Failed to delete driver", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 className="h3 mb-0">{t("driverManagement.title")}</h1>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h2 className="h6 mb-0">
                {editing
                  ? t("driverManagement.form.editTitle")
                  : t("driverManagement.form.createTitle")}
              </h2>
            </div>
            <div className="card-body">
              <form id="driver-form" noValidate onSubmit={handleSubmit}>
                <input type="hidden" id="driver-id" value={formId} />
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-email">
                    {t("common.labels.email")}
                  </label>
                  <input
                    type="email"
                    className={`form-control ${emailError ? "is-invalid" : ""}`}
                    id="driver-email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={editing}
                    required
                  />
                  {emailError && (
                    <div className="invalid-feedback">{emailError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-name">
                    {t("driverManagement.form.fullName")}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    id="driver-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                  {nameError && (
                    <div className="invalid-feedback">{nameError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-nickname">
                    {t("driverManagement.form.nickname")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="driver-nickname"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-birthdate">
                    {t("driverManagement.form.birthDate")}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="driver-birthdate"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-sex">
                    {t("driverManagement.form.sex")}
                  </label>
                  <select
                    className="form-select"
                    id="driver-sex"
                    value={formSex}
                    onChange={(e) => setFormSex(e.target.value)}
                  >
                    <option value="">
                      {t("driverManagement.form.sexSelect")}
                    </option>
                    <option value="Male">
                      {t("driverManagement.form.sexMale")}
                    </option>
                    <option value="Female">
                      {t("driverManagement.form.sexFemale")}
                    </option>
                    <option value="Other">
                      {t("driverManagement.form.sexOther")}
                    </option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-blood">
                    {t("driverManagement.form.bloodType")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="driver-blood"
                    placeholder={t("driverManagement.form.bloodPlaceholder")}
                    value={formBloodType}
                    onChange={(e) => setFormBloodType(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-weight">
                    {t("common.labels.weight")}
                  </label>
                  <input
                    type="number"
                    className={`form-control ${weightError ? "is-invalid" : ""}`}
                    id="driver-weight"
                    min="0"
                    step="0.1"
                    placeholder={t("driverManagement.form.weightPlaceholder")}
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                  />
                  {weightError && (
                    <div className="invalid-feedback">{weightError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="driver-picture">
                    {t("common.labels.picture")}
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="driver-picture"
                    accept="image/*"
                    onChange={(e) => setFormPicture(e.target.files[0] || null)}
                  />
                  <div className="form-text">
                    {t("driverManagement.form.pictureHelp")}
                  </div>
                </div>
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 w-sm-auto flex-sm-grow-1"
                  >
                    {editing
                      ? t("common.actions.update")
                      : t("common.actions.create")}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 w-sm-auto"
                      onClick={handleClear}
                    >
                      {t("common.actions.cancel")}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h2 className="h6 mb-0">{t("driverManagement.list.title")}</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>{t("driverManagement.table.driver")}</th>
                      <th>{t("driverManagement.table.weight")}</th>
                      <th>{t("driverManagement.table.nickname")}</th>
                      <th>{t("driverManagement.table.birthDate")}</th>
                      <th className="text-end">
                        {t("driverManagement.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingList ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <div
                              className="spinner-border spinner-border-sm"
                              role="status"
                            ></div>
                            <span>{t("common.status.loadingDrivers")}</span>
                          </div>
                        </td>
                      </tr>
                    ) : !drivers.length ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          {t("driverManagement.list.empty")}
                        </td>
                      </tr>
                    ) : (
                      drivers.map((driver) => (
                        <tr key={driver.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {getDriverImageHtml({
                                src: driver.picture_url,
                                seed: driver.id || driver.email || driver.name,
                                alt: driver.name,
                                className: "rounded-circle",
                                size: 36,
                              })}
                              <span>{driver.name}</span>
                            </div>
                          </td>
                          <td>
                            {driver.weight !== null &&
                            driver.weight !== undefined
                              ? driver.weight
                              : "-"}
                          </td>
                          <td>{driver.nickname || "-"}</td>
                          <td>{driver.birth_date || "-"}</td>
                          <td className="text-end">
                            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(driver)}
                              >
                                {t("common.actions.edit")}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteRequest(driver)}
                              >
                                {t("common.actions.delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={!!confirmDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        message={t("driverManagement.confirmDelete")}
        title={t("common.actions.confirm")}
      />
    </div>
  );
}
