import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Notification";
import { useLoading } from "@/context/LoadingContext";
import { useSeason } from "@/context/SeasonContext";
import {
  listSeasons,
  listCups,
  createCup,
  updateCup,
  deleteCup,
} from "@/lib/api";
import { formatDisplayDate } from "@/lib/formatting";
import {
  isRequired,
  isValidDateRange,
  isValidCupDateRange,
  isValidHexColor,
} from "@/lib/validation";
import { getDriverImageHtml } from "@/lib/image";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

export function CupManagement() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const { withLoading: loading } = useLoading();
  const { seasons, selectedSeasonId, setSeasonId } = useSeason();

  const [cups, setCups] = useState([]);
  const [allSeasons, setAllSeasons] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [formId, setFormId] = useState("");
  const [formSeason, setFormSeason] = useState(selectedSeasonId || "");
  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");

  const [seasonError, setSeasonError] = useState("");
  const [nameError, setNameError] = useState("");
  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ongoingSeasons = await listSeasons({
          order: { column: "start_date", ascending: true },
          filters: [{ column: "is_ongoing", operator: "eq", value: true }],
        });
        setAllSeasons(ongoingSeasons);

        const cupData = await listCups({
          order: { column: "start_date", ascending: true },
        });
        setCups(cupData);

        if (
          selectedSeasonId &&
          ongoingSeasons.some((s) => String(s.id) === selectedSeasonId)
        ) {
          setFormSeason(selectedSeasonId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, [selectedSeasonId]);

  const resetForm = () => {
    setFormId("");
    // formSeason defaults to selectedSeasonId from context
    setFormName("");
    setFormStart("");
    setFormEnd("");
    setSeasonError("");
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
    const seasonId = formSeason;
    const name = formName.trim();
    const startDate = formStart;
    const endDate = formEnd;

    setSeasonError("");
    setNameError("");
    setStartError("");
    setEndError("");

    let hasError = false;
    if (!isRequired(seasonId)) {
      setSeasonError(t("validation.seasonRequired"));
      hasError = true;
    }
    if (!isRequired(name)) {
      setNameError(t("validation.cupNameRequired"));
      hasError = true;
    }
    if (!isRequired(startDate)) {
      setStartError(t("validation.startDateRequired"));
      hasError = true;
    }
    if (!isRequired(endDate) || !isValidDateRange(startDate, endDate)) {
      setEndError(t("validation.endDateAfterStart"));
      hasError = true;
    }

    const season = allSeasons.find((s) => String(s.id) === seasonId);
    if (
      season &&
      !isValidCupDateRange(
        season.start_date,
        season.end_date,
        startDate,
        endDate,
      )
    ) {
      setEndError(t("validation.cupDatesWithinSeason"));
      hasError = true;
    }

    if (hasError) {
      notify(t("notifications.pleaseFix"), "warning");
      return;
    }

    try {
      await loading(async () => {
        const payload = {
          season_id: seasonId,
          name,
          start_date: startDate,
          end_date: endDate,
        };
        if (formId) {
          await updateCup(formId, payload);
          notify(t("notifications.cupUpdated"), "success");
        } else {
          await createCup(payload);
          notify(t("notifications.cupCreated"), "success");
        }
      });
      resetForm();
      const cupData = await listCups({
        order: { column: "start_date", ascending: true },
      });
      setCups(cupData);
    } catch (err) {
      notify(err.message || "Failed to save cup", "error");
    }
  };

  const handleEdit = (cup) => {
    setFormId(cup.id);
    setFormSeason(cup.season_id);
    setFormName(cup.name);
    setFormStart(cup.start_date);
    setFormEnd(cup.end_date);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRequest = (cup) => {
    setConfirmDelete(cup);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await loading(async () => {
        await deleteCup(confirmDelete.id);
        notify(t("notifications.cupDeleted"), "success");
      });
      const cupData = await listCups({
        order: { column: "start_date", ascending: true },
      });
      setCups(cupData);
    } catch (err) {
      notify(err.message || "Failed to delete cup", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const seasonMap = Object.fromEntries(
    allSeasons.map((s) => [String(s.id), s]),
  );

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 className="h3 mb-0">{t("cupManagement.title")}</h1>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h2 className="h6 mb-0">
                {editing
                  ? t("cupManagement.form.editTitle")
                  : t("cupManagement.form.createTitle")}
              </h2>
            </div>
            <div className="card-body">
              <form id="cup-form" noValidate onSubmit={handleSubmit}>
                <input type="hidden" id="cup-id" value={formId} />
                <div className="mb-3">
                  <label className="form-label" htmlFor="cup-season">
                    {t("common.labels.season")}
                  </label>
                  <select
                    className={`form-select ${seasonError ? "is-invalid" : ""}`}
                    id="cup-season"
                    value={formSeason}
                    onChange={(e) => setFormSeason(e.target.value)}
                    required
                  >
                    <option value="">
                      {t("cupManagement.form.selectSeason")}
                    </option>
                    {allSeasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                  {seasonError && (
                    <div className="invalid-feedback">{seasonError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="cup-name">
                    {t("common.labels.name")}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    id="cup-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                  {nameError && (
                    <div className="invalid-feedback">{nameError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="cup-start">
                    {t("common.labels.startDate")}
                  </label>
                  <input
                    type="date"
                    className={`form-control ${startError ? "is-invalid" : ""}`}
                    id="cup-start"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    required
                  />
                  {startError && (
                    <div className="invalid-feedback">{startError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="cup-end">
                    {t("common.labels.endDate")}
                  </label>
                  <input
                    type="date"
                    className={`form-control ${endError ? "is-invalid" : ""}`}
                    id="cup-end"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    required
                  />
                  {endError && (
                    <div className="invalid-feedback">{endError}</div>
                  )}
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
              <h2 className="h6 mb-0">{t("cupManagement.list.title")}</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>{t("cupManagement.table.cup")}</th>
                      <th>{t("cupManagement.table.season")}</th>
                      <th>{t("cupManagement.table.start")}</th>
                      <th>{t("cupManagement.table.end")}</th>
                      <th className="text-end">
                        {t("cupManagement.table.actions")}
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
                            <span>{t("common.status.loadingCups")}</span>
                          </div>
                        </td>
                      </tr>
                    ) : !cups.length ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          {t("cupManagement.list.empty")}
                        </td>
                      </tr>
                    ) : (
                      cups.map((cup) => (
                        <tr key={cup.id}>
                          <td>{cup.name}</td>
                          <td>
                            {seasonMap[cup.season_id]
                              ? seasonMap[cup.season_id].name
                              : t("common.misc.unknown")}
                          </td>
                          <td>
                            {cup.start_date
                              ? formatDisplayDate(cup.start_date)
                              : "-"}
                          </td>
                          <td>
                            {cup.end_date
                              ? formatDisplayDate(cup.end_date)
                              : "-"}
                          </td>
                          <td className="text-end">
                            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(cup)}
                              >
                                {t("common.actions.edit")}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteRequest(cup)}
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
        message={t("cupManagement.confirmDelete")}
        title={t("common.actions.confirm")}
      />
    </div>
  );
}
