import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Notification";
import { useLoading } from "@/context/LoadingContext";
import { DriverImage } from "@/components/driverImage";
import { formatDateTime } from "@/lib/formatting";
import { calculatePenaltyPoints, parseLapTime } from "@/lib/points";
import {
  getSupabaseClient,
  getSeasonById,
  listRaceResults,
  createRaceResult,
  updateRaceResult,
  deleteRaceResult,
  createPenalties,
  listDrivers,
} from "@/lib/api";
import { isValidLapTime } from "@/lib/validation";
import { RaceResultModal } from "@/components/modals/RaceResultModal";
import { OcrImportModal } from "@/components/modals/OcrImportModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { matchDriverName } from "@/lib/matching";

export function RaceDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useToast();
  const { withLoading: loading } = useLoading();

  const raceId = searchParams.get("id");

  const [race, setRace] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [results, setResults] = useState([]);
  const [seasonName, setSeasonName] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");

  const [showResultModal, setShowResultModal] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!raceId) {
        setError(t("errors.raceIdMissing"));
        setLoadingList(false);
        return;
      }

      try {
        setLoadingList(true);
        setError("");

        const supabase = getSupabaseClient();
        const { data: raceData, error: raceError } = await supabase
          .from("races")
          .select("*")
          .eq("id", raceId)
          .limit(1);
        if (raceError) {
          setError(raceError.message || t("errors.raceLoadFailed"));
          setLoadingList(false);
          return;
        }
        const loadedRace = raceData?.[0] || null;
        setRace(loadedRace);

        if (!loadedRace) {
          setError(t("errors.raceNotFound"));
          setLoadingList(false);
          return;
        }

        // Load season name
        const season = await getSeasonById(loadedRace.season_id);
        setSeasonName(season?.name || t("common.misc.unknown"));

        // Load drivers
        const driversList = await listDrivers({
          order: { column: "name", ascending: true },
        });
        setDrivers(driversList);

        // Load results
        const raceResults = await listRaceResults(raceId);
        setResults(raceResults);
      } catch (err) {
        console.error("Failed to load race:", err);
        setError(err.message || t("errors.raceLoadFailed"));
      } finally {
        setLoadingList(false);
      }
    };

    load();
  }, [raceId, t]);

  const renderRaceInfo = () => {
    if (!race) return null;
    return (
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="small">{t("raceDetail.info.dateTime")}</div>
              <div>
                {race.race_datetime ? formatDateTime(race.race_datetime) : "-"}
              </div>
            </div>
            <div className="col-md-4">
              <div className="small">{t("raceDetail.info.season")}</div>
              <div>{seasonName}</div>
            </div>
            <div className="col-md-4">
              <div className="small">
                {t("raceDetail.info.affectsChampionship")}
              </div>
              <div>
                {race.affects_championship
                  ? t("common.misc.yes")
                  : t("common.misc.no")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!results.length) {
      return (
        <tr>
          <td colSpan="7" className="text-center">
            {t("raceDetail.noResults")}
          </td>
        </tr>
      );
    }

    // Find fastest lap driver
    let fastestDriverId = null;
    let fastestTime = null;
    results.forEach((result) => {
      const time = parseLapTime(result.best_lap_time);
      if (time === null) return;
      if (fastestTime === null || time < fastestTime) {
        fastestTime = time;
        fastestDriverId = result.driver_id;
      } else if (
        time === fastestTime &&
        result.finish_position <
          (results.find((r) => r.driver_id === fastestDriverId) || {})
            .finish_position
      ) {
        fastestDriverId = result.driver_id;
      }
    });

    return results.map((result) => {
      const penalties = result.penalties || [];
      const penaltyTotal = calculatePenaltyPoints(penalties);
      const isFastest = result.driver_id === fastestDriverId;

      return (
        <tr key={result.id}>
          <td>{result.finish_position}</td>
          <td>
            <div className="d-flex align-items-center gap-2">
              <DriverImage
                src={result.drivers ? result.drivers.picture_url : null}
                seed={
                  result.driver_id ||
                  (result.drivers ? result.drivers.email : null) ||
                  (result.drivers ? result.drivers.name : null)
                }
                alt={result.drivers
                  ? result.drivers.name
                  : t("common.labels.driver")}
                className="rounded-circle"
                size={32}
              />
              <span>
                {result.drivers ? result.drivers.name : result.driver_id}
              </span>
            </div>
          </td>
          <td>{result.grid_start_position || "-"}</td>
          <td className={isFastest ? "text-decoration-underline" : ""}>
            {result.best_lap_time || "-"}
          </td>
          <td>
            {penalties.length ? `${penalties.length} (${penaltyTotal})` : "-"}
          </td>
          <td>
            {result.is_disqualified
              ? t("common.misc.yes")
              : t("common.misc.no")}
          </td>
          <td className="text-end">
            <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleEditResult(result)}
              >
                {t("common.actions.edit")}
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setShowConfirmDelete(result.id)}
              >
                {t("common.actions.delete")}
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  const handleEditResult = (result) => {
    setEditingResult(result);
    setShowResultModal(true);
  };

  const handleResultSave = async (payload) => {
    try {
      await loading(async () => {
        if (payload.id) {
          const updated = await updateRaceResult(payload.id, {
            race_id: raceId,
            driver_id: payload.driver_id,
            finish_position: payload.finish_position,
            grid_start_position: payload.grid_start_position,
            best_lap_time: payload.best_lap_time,
            is_disqualified: payload.is_disqualified,
            comments: payload.comments,
          });
          if (payload.penalties.length) {
            await createPenalties(
              payload.penalties.map((penalty) => ({
                ...penalty,
                race_result_id: updated.id,
              })),
            );
          }
        } else {
          const created = await createRaceResult({
            race_id: raceId,
            driver_id: payload.driver_id,
            finish_position: payload.finish_position,
            grid_start_position: payload.grid_start_position,
            best_lap_time: payload.best_lap_time,
            is_disqualified: payload.is_disqualified,
            comments: payload.comments,
          });
          if (payload.penalties.length) {
            await createPenalties(
              payload.penalties.map((penalty) => ({
                ...penalty,
                race_result_id: created.id,
              })),
            );
          }
          notify(t("notifications.raceResultCreated"), "success");
        }
      });
      const raceResults = await listRaceResults(raceId);
      setResults(raceResults);
    } catch (err) {
      notify(
        err.message || t("common.errors.routeLoad", { message: err.message }),
        "error",
      );
    }
  };

  const handleOcrSave = async ({ mode, rows }) => {
    if (!rows.length) {
      notify(t("ocrImport.noValidRows"), "warning");
      return false;
    }

    if (mode === "race" && results.length) {
      notify(t("ocrImport.blockedRace"), "warning");
      return false;
    }

    if (mode === "qualifying" && !results.length) {
      notify(t("ocrImport.blockedQualifying"), "warning");
      return false;
    }

    try {
      await loading(async () => {
        if (mode === "race") {
          await Promise.all(
            rows.map((row) =>
              createRaceResult({
                race_id: raceId,
                driver_id: row.driverId,
                finish_position: row.position,
                grid_start_position: null,
                best_lap_time: isValidLapTime(row.bestLapTime)
                  ? row.bestLapTime
                  : null,
                is_disqualified: false,
                comments: null,
              }),
            ),
          );
          notify(t("ocrImport.saveSuccessRace"), "success");
        } else if (mode === "qualifying") {
          const resultMap = new Map(results.map((r) => [r.driver_id, r]));
          const positionMap = new Map(
            rows.map((row) => [row.driverId, row.position]),
          );
          const updates = rows
            .map((row) => resultMap.get(row.driverId))
            .filter(Boolean)
            .map((r) =>
              updateRaceResult(r.id, {
                grid_start_position: positionMap.get(r.driver_id),
              }),
            );
          if (updates.length) {
            await Promise.all(updates);
          }
          notify(t("ocrImport.saveSuccessQualifying"), "success");
        }
      });
      return true;
    } catch (err) {
      notify(err.message || t("ocrImport.saveFailure"), "error");
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await loading(async () => {
        await deleteRaceResult(showConfirmDelete);
        notify(t("notifications.raceResultDeleted"), "success");
      });
      const raceResults = await listRaceResults(raceId);
      setResults(raceResults);
    } catch (err) {
      notify(
        err.message || t("common.errors.routeLoad", { message: err.message }),
        "error",
      );
    } finally {
      setShowConfirmDelete(null);
    }
  };

  if (loadingList) {
    return (
      <div className="container mt-4">
        <div className="d-flex align-items-center justify-content-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          <span>{t("raceDetail.loadingResults")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
        <div className="w-50">
          <h1 className="h3 mb-0">{t("raceDetail.title")}</h1>
          <p className="mb-0">{race?.location || ""}</p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
          <button
            className="btn btn-primary w-100 w-sm-auto"
            onClick={() => {
              setEditingResult(null);
              setShowResultModal(true);
            }}
          >
            {t("raceDetail.addResult")}
          </button>
          <button
            className="btn btn-outline-primary w-100 w-sm-auto"
            onClick={() => setShowOcrModal(true)}
          >
            {t("raceDetail.importResults")}
          </button>
          <Link
            to="/admin/races"
            className="btn btn-outline-secondary w-100 w-sm-auto"
          >
            {t("raceDetail.backToRaces")}
          </Link>
        </div>
      </div>

      {renderRaceInfo()}

      <div className="card shadow-sm">
        <div className="card-header text-white">
          <h2 className="h6 mb-0">{t("raceDetail.resultsTitle")}</h2>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>{t("raceDetail.table.position")}</th>
                  <th>{t("raceDetail.table.driver")}</th>
                  <th>{t("raceDetail.table.grid")}</th>
                  <th>{t("raceDetail.table.bestLap")}</th>
                  <th>{t("raceDetail.table.penalties")}</th>
                  <th>{t("raceDetail.table.dq")}</th>
                  <th className="text-end">{t("raceDetail.table.actions")}</th>
                </tr>
              </thead>
              <tbody id="results-table-body">{renderResults()}</tbody>
            </table>
          </div>
        </div>
      </div>

      {showResultModal && (
        <RaceResultModal
          drivers={drivers}
          existingResults={results}
          initialData={editingResult}
          onSave={handleResultSave}
          onClose={() => {
            setShowResultModal(false);
            setEditingResult(null);
          }}
        />
      )}

      {showOcrModal && (
        <OcrImportModal
          raceId={raceId}
          drivers={drivers}
          existingResults={results}
          onSave={handleOcrSave}
          onClose={() => setShowOcrModal(false)}
        />
      )}

      <ConfirmModal
        show={!!showConfirmDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(null)}
        message={t("raceDetail.confirmDelete")}
        title={t("common.actions.confirm")}
      />
    </div>
  );
}
