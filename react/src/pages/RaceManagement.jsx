import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Notification";
import { useLoading } from "@/context/LoadingContext";
import { useSeason } from "@/context/SeasonContext";
import { formatDateTime, formatDateTimeForInput } from "@/lib/formatting";
import {
  listSeasons,
  listCups,
  listRaces,
  createRace,
  updateRace,
  deleteRace,
} from "@/lib/api";
import { isRequired } from "@/lib/validation";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

export function RaceManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { withLoading: loading } = useLoading();
  const { seasons, setSeasonId } = useSeason();

  const [races, setRaces] = useState([]);
  const [allCups, setAllCups] = useState([]);
  const [filterSeason, setFilterSeason] = useState("");
  const [filterCup, setFilterCup] = useState("");
  const [loadingList, setLoadingList] = useState(true);

  const [formId, setFormId] = useState("");
  const [formSeason, setFormSeason] = useState("");
  const [formCup, setFormCup] = useState("");
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDateTime, setFormDateTime] = useState("");
  const [formAffects, setFormAffects] = useState(true);

  const [seasonError, setSeasonError] = useState("");
  const [cupError, setCupError] = useState("");
  const [nameError, setNameError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [dateTimeError, setDateTimeError] = useState("");

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ongoingSeasons = await listSeasons({
          order: { column: "start_date", ascending: true },
          filters: [{ column: "is_ongoing", operator: "eq", value: true }],
        });
        setAllCups(
          await listCups({ order: { column: "start_date", ascending: true } }),
        );

        const storedSeasonId = localStorage.getItem("selectedSeasonId");
        let defaultSeason = "";
        if (
          storedSeasonId &&
          ongoingSeasons.some((s) => String(s.id) === storedSeasonId)
        ) {
          defaultSeason = storedSeasonId;
        }

        const filterS = filterSeason || defaultSeason;
        setFormSeason(filterS);

        const cupFilters = [];
        if (filterS)
          cupFilters.push({
            column: "season_id",
            operator: "eq",
            value: filterS,
          });
        setAllCups(
          await listCups({
            order: { column: "start_date", ascending: true },
            filters: cupFilters.length ? cupFilters : undefined,
          }),
        );

        const raceFilters = [];
        if (filterS)
          raceFilters.push({
            column: "season_id",
            operator: "eq",
            value: filterS,
          });
        if (filterCup)
          raceFilters.push({
            column: "cup_id",
            operator: "eq",
            value: filterCup,
          });

        const raceData = await listRaces({
          order: { column: "race_datetime", ascending: true },
          filters: raceFilters.length ? raceFilters : undefined,
        });
        setRaces(raceData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, [filterSeason, filterCup]);

  const cupOptions = (seasonId) => {
    if (!seasonId) return [];
    return allCups.filter((c) => c.season_id === seasonId);
  };

  const resetForm = () => {
    setFormId("");
    setFormSeason("");
    setFormCup("");
    setFormName("");
    setFormLocation("");
    setFormDateTime("");
    setFormAffects(true);
    setSeasonError("");
    setCupError("");
    setNameError("");
    setLocationError("");
    setDateTimeError("");
    setEditing(false);
  };

  const handleClear = () => {
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const seasonId = formSeason;
    const cupId = formCup || null;
    const name = formName.trim();
    const location = formLocation.trim();
    const raceDateTime = formDateTime;

    setSeasonError("");
    setCupError("");
    setNameError("");
    setLocationError("");
    setDateTimeError("");

    let hasError = false;
    if (!isRequired(seasonId)) {
      setSeasonError(t("validation.seasonRequired"));
      hasError = true;
    }
    if (!isRequired(name)) {
      setNameError(t("validation.raceNameRequired"));
      hasError = true;
    }
    if (!isRequired(location)) {
      setLocationError(t("validation.locationRequired"));
      hasError = true;
    }
    if (!isRequired(raceDateTime)) {
      setDateTimeError(t("validation.dateTimeRequired"));
      hasError = true;
    }

    if (cupId) {
      const cup = allCups.find((c) => c.id === cupId);
      if (!cup || cup.season_id !== seasonId) {
        setCupError(t("validation.cupBelongsSeason"));
        hasError = true;
      }
    }

    if (hasError) {
      notify(t("notifications.pleaseFix"), "warning");
      return;
    }

    const raceFilters = [];
    if (seasonId)
      raceFilters.push({
        column: "season_id",
        operator: "eq",
        value: seasonId,
      });
    if (filterCup)
      raceFilters.push({ column: "cup_id", operator: "eq", value: filterCup });

    try {
      await loading(async () => {
        const payload = {
          season_id: seasonId,
          cup_id: cupId,
          name,
          location,
          race_datetime: raceDateTime,
          affects_championship: formAffects,
        };
        if (formId) {
          await updateRace(formId, payload);
          notify(t("notifications.raceUpdated"), "success");
        } else {
          await createRace(payload);
          notify(t("notifications.raceCreated"), "success");
        }
      });
      resetForm();
      const raceData = await listRaces({
        order: { column: "race_datetime", ascending: true },
        filters: raceFilters.length ? raceFilters : undefined,
      });
      setRaces(raceData);
    } catch (err) {
      notify(err.message || "Failed to save race", "error");
    }
  };

  const handleEdit = (race) => {
    setFormId(race.id);
    setFormSeason(race.season_id);
    setFormCup(race.cup_id || "");
    setFormName(race.name);
    setFormLocation(race.location);
    setFormDateTime(
      race.race_datetime ? formatDateTimeForInput(race.race_datetime) : "",
    );
    setFormAffects(race.affects_championship !== false);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRequest = (race) => {
    setConfirmDelete(race);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const raceFilters = [];
    if (filterSeason)
      raceFilters.push({
        column: "season_id",
        operator: "eq",
        value: filterSeason,
      });
    if (filterCup)
      raceFilters.push({ column: "cup_id", operator: "eq", value: filterCup });

    try {
      await loading(async () => {
        await deleteRace(confirmDelete.id);
        notify(t("notifications.raceDeleted"), "success");
      });
      const raceData = await listRaces({
        order: { column: "race_datetime", ascending: true },
        filters: raceFilters.length ? raceFilters : undefined,
      });
      setRaces(raceData);
    } catch (err) {
      notify(err.message || "Failed to delete race", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const seasonMap = Object.fromEntries(seasons.map((s) => [String(s.id), s]));
  const cupMap = Object.fromEntries(allCups.map((c) => [c.id, c]));
  const availableCups = cupOptions(formSeason);

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 className="h3 mb-0">{t("raceManagement.title")}</h1>
      </div>

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label" htmlFor="race-filter-season">
                {t("raceManagement.filters.season")}
              </label>
              <select
                className="form-select"
                id="race-filter-season"
                value={filterSeason}
                onChange={(e) => {
                  setFilterSeason(e.target.value);
                }}
              >
                <option value="">{t("common.misc.allSeasons")}</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label" htmlFor="race-filter-cup">
                {t("raceManagement.filters.cup")}
              </label>
              <select
                className="form-select"
                id="race-filter-cup"
                value={filterCup}
                onChange={(e) => setFilterCup(e.target.value)}
              >
                <option value="">{t("common.misc.allCups")}</option>
                {(filterSeason ? availableCups : allCups).map((cup) => (
                  <option key={cup.id} value={cup.id}>
                    {cup.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => {
                  setFilterSeason("");
                  setFilterCup("");
                }}
              >
                {t("common.actions.clear")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header text-white">
              <h2 className="h6 mb-0">
                {editing
                  ? t("raceManagement.form.editTitle")
                  : t("raceManagement.form.createTitle")}
              </h2>
            </div>
            <div className="card-body">
              <form id="race-form" noValidate onSubmit={handleSubmit}>
                <input type="hidden" id="race-id" value={formId} />
                <div className="mb-3">
                  <label className="form-label" htmlFor="race-season">
                    {t("common.labels.season")}
                  </label>
                  <select
                    className={`form-select ${seasonError ? "is-invalid" : ""}`}
                    id="race-season"
                    value={formSeason}
                    onChange={(e) => {
                      setFormSeason(e.target.value);
                      setFormCup("");
                    }}
                    required
                  >
                    <option value="">
                      {t("cupManagement.form.selectSeason")}
                    </option>
                    {seasons.map((season) => (
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
                  <label className="form-label" htmlFor="race-cup">
                    {t("raceManagement.form.cupOptional")}
                  </label>
                  <select
                    className={`form-select ${cupError ? "is-invalid" : ""}`}
                    id="race-cup"
                    value={formCup}
                    onChange={(e) => setFormCup(e.target.value)}
                  >
                    <option value="">{t("common.misc.noCup")}</option>
                    {availableCups.map((cup) => (
                      <option key={cup.id} value={cup.id}>
                        {cup.name}
                      </option>
                    ))}
                  </select>
                  {cupError && (
                    <div className="invalid-feedback">{cupError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="race-name">
                    {t("common.labels.name")}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    id="race-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                  {nameError && (
                    <div className="invalid-feedback">{nameError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="race-location">
                    {t("common.labels.location")}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${locationError ? "is-invalid" : ""}`}
                    id="race-location"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    required
                  />
                  {locationError && (
                    <div className="invalid-feedback">{locationError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="race-datetime">
                    {t("raceManagement.form.raceDateTime")}
                  </label>
                  <input
                    type="datetime-local"
                    className={`form-control ${dateTimeError ? "is-invalid" : ""}`}
                    id="race-datetime"
                    value={formDateTime}
                    onChange={(e) => setFormDateTime(e.target.value)}
                    required
                  />
                  {dateTimeError && (
                    <div className="invalid-feedback">{dateTimeError}</div>
                  )}
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="race-affects"
                    checked={formAffects}
                    onChange={(e) => setFormAffects(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="race-affects">
                    {t("raceManagement.form.affectsChampionship")}
                  </label>
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
              <h2 className="h6 mb-0">{t("raceManagement.list.title")}</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>{t("raceManagement.table.race")}</th>
                      <th>{t("raceManagement.table.season")}</th>
                      <th>{t("raceManagement.table.cup")}</th>
                      <th>{t("raceManagement.table.date")}</th>
                      <th className="text-end">
                        {t("raceManagement.table.actions")}
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
                            <span>{t("common.status.loadingRaces")}</span>
                          </div>
                        </td>
                      </tr>
                    ) : !races.length ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          {t("raceManagement.list.empty")}
                        </td>
                      </tr>
                    ) : (
                      races.map((race) => (
                        <tr key={race.id}>
                          <td>
                            <div>
                              <Link
                                className="fw-semibold text-decoration-underline"
                                to={`/admin/race?id=${race.id}`}
                              >
                                {race.name}
                              </Link>
                              <small className="d-block">{race.location}</small>
                            </div>
                          </td>
                          <td>
                            {seasonMap[race.season_id]
                              ? seasonMap[race.season_id].name
                              : t("common.misc.unknown")}
                          </td>
                          <td>
                            {race.cup_id
                              ? cupMap[race.cup_id]
                                ? cupMap[race.cup_id].name
                                : t("common.misc.unknown")
                              : "-"}
                          </td>
                          <td>
                            {race.race_datetime
                              ? formatDateTime(race.race_datetime)
                              : "-"}
                          </td>
                          <td className="text-end">
                            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(race)}
                              >
                                {t("common.actions.edit")}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteRequest(race)}
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
        message={t("raceManagement.confirmDelete")}
        title={t("common.actions.confirm")}
      />
    </div>
  );
}
