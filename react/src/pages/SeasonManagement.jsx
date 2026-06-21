import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Notification";
import { useLoading } from "@/context/LoadingContext";
import {
  listSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
} from "@/lib/api";
import { formatDisplayDate } from "@/lib/formatting";
import { isValidDateRange } from "@/lib/validation";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

export function SeasonManagement() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const { withLoading: loading } = useLoading();

  const [seasons, setSeasons] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formOngoing, setFormOngoing] = useState(false);
  const [formColor, setFormColor] = useState("#000000");

  const [nameError, setNameError] = useState("");
  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadSeasons = async () => {
    try {
      const data = await listSeasons({
        order: { column: "start_date", ascending: true },
      });
      setSeasons(data);
    } catch (err) {
      setSeasons([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  const resetForm = () => {
    setFormId("");
    setFormName("");
    setFormStart("");
    setFormEnd("");
    setFormOngoing(false);
    setFormColor("#000000");
    setNameError("");
    setStartError("");
    setEndError("");
    setEditing(false);
  };

  const handleClear = () => {
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    const start = formStart;
    const end = formEnd;
    const color = formColor;

    setNameError("");
    setStartError("");
    setEndError("");

    // Cross-field check: end must be >= start. Native min on the end input
    // handles instant UX feedback; keep JS guard for defense-in-depth.
    if (start && end && !isValidDateRange(start, end)) {
      setEndError(t("validation.endDateAfterStart"));
      notify(t("notifications.pleaseFix"), "warning");
      return;
    }

    try {
      await loading(async () => {
        const payload = {
          name,
          start_date: start,
          end_date: end,
          accent_color: color,
          is_ongoing: formOngoing,
        };
        if (formId) {
          await updateSeason(formId, payload);
          notify(t("notifications.seasonUpdated"), "success");
        } else {
          await createSeason(payload);
          notify(t("notifications.seasonCreated"), "success");
        }
      });
      resetForm();
      await loadSeasons();
    } catch (err) {
      notify(err.message || "Failed to save season", "error");
    }
  };

  const handleEdit = (season) => {
    setFormId(season.id);
    setFormName(season.name);
    setFormStart(season.start_date);
    setFormEnd(season.end_date);
    setFormColor(season.accent_color);
    setFormOngoing(!!season.is_ongoing);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRequest = (season) => {
    setConfirmDelete(season);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await loading(async () => {
        await deleteSeason(confirmDelete.id);
        notify(t("notifications.seasonDeleted"), "success");
      });
      await loadSeasons();
    } catch (err) {
      notify(err.message || "Failed to delete season", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 className="h3 mb-0">{t("seasonManagement.title")}</h1>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h2 className="h6 mb-0">
                {editing
                  ? t("seasonManagement.form.editTitle")
                  : t("seasonManagement.form.createTitle")}
              </h2>
            </div>
            <div className="card-body">
              <form id="season-form" onSubmit={handleSubmit}>
                <input type="hidden" id="season-id" value={formId} />
                <div className="mb-3">
                  <label className="form-label" htmlFor="season-name">
                    {t("common.labels.name")}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    id="season-name"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (nameError) setNameError("");
                      e.target.setCustomValidity("");
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      setNameError(t("validation.seasonNameRequired"));
                    }}
                    required
                  />
                  {nameError && (
                    <div className="invalid-feedback">{nameError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="season-start">
                    {t("common.labels.startDate")}
                  </label>
                  <input
                    type="date"
                    className={`form-control ${startError ? "is-invalid" : ""}`}
                    id="season-start"
                    value={formStart}
                    onChange={(e) => {
                      setFormStart(e.target.value);
                      if (startError) setStartError("");
                      e.target.setCustomValidity("");
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      setStartError(t("validation.startDateRequired"));
                    }}
                    required
                  />
                  {startError && (
                    <div className="invalid-feedback">{startError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="season-end">
                    {t("common.labels.endDate")}
                  </label>
                  <input
                    type="date"
                    className={`form-control ${endError ? "is-invalid" : ""}`}
                    id="season-end"
                    value={formEnd}
                    min={formStart || undefined}
                    onChange={(e) => {
                      setFormEnd(e.target.value);
                      if (endError) setEndError("");
                      e.target.setCustomValidity("");
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      setEndError(t("validation.endDateAfterStart"));
                    }}
                    required
                  />
                  {endError && (
                    <div className="invalid-feedback">{endError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="season-ongoing"
                      checked={formOngoing}
                      onChange={(e) => setFormOngoing(e.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="season-ongoing"
                    >
                      {t("seasonManagement.form.availableSeason")}
                    </label>
                  </div>
                  <div className="form-text">
                    {t("seasonManagement.form.availableHelp")}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="season-color">
                    {t("common.labels.accent")}
                  </label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    id="season-color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    required
                  />
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
              <h2 className="h6 mb-0">{t("seasonManagement.list.title")}</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>{t("seasonManagement.table.name")}</th>
                      <th>{t("seasonManagement.table.start")}</th>
                      <th>{t("seasonManagement.table.end")}</th>
                      <th>{t("seasonManagement.table.accent")}</th>
                      <th className="text-end">
                        {t("seasonManagement.table.actions")}
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
                            <span>{t("common.status.loadingSeasons")}</span>
                          </div>
                        </td>
                      </tr>
                    ) : !seasons.length ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          {t("seasonManagement.list.empty")}
                        </td>
                      </tr>
                    ) : (
                      seasons.map((season) => (
                        <tr key={season.id}>
                          <td>{season.name}</td>
                          <td>
                            {season.start_date
                              ? formatDisplayDate(season.start_date)
                              : "-"}
                          </td>
                          <td>
                            {season.end_date
                              ? formatDisplayDate(season.end_date)
                              : "-"}
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: season.accent_color,
                                color: "#fff",
                              }}
                            >
                              {season.accent_color}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(season)}
                              >
                                {t("common.actions.edit")}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteRequest(season)}
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
        message={t("seasonManagement.confirmDelete")}
        title={t("common.actions.confirm")}
      />
    </div>
  );
}
