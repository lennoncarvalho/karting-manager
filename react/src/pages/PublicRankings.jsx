import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSeason } from "@/context/SeasonContext";
import { DriverImage } from "@/components/driverImage";
import { listCups, listRaces, listRaceResultsByRaceIds } from "@/lib/api";
import {
  calculateRankings,
  calculatePenaltyRankings,
  parseLapTime,
} from "@/lib/points";

export function PublicRankings() {
  const { t } = useTranslation();
  const { seasons, selectedSeasonId, setSeasonId } = useSeason();

  const [races, setRaces] = useState([]);
  const [cups, setCups] = useState([]);
  const [raceResults, setRaceResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSeason, setSelectedSeason] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!selectedSeasonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const loadedCups = await listCups({
          seasonId: selectedSeasonId,
          order: { column: "start_date", ascending: true },
        });
        setCups(loadedCups);

        const loadedRaces = await listRaces({
          filters: [
            { column: "season_id", operator: "eq", value: selectedSeasonId },
          ],
          order: { column: "race_datetime", ascending: true },
        });
        setRaces(loadedRaces);

        if (loadedRaces.length) {
          const raceIds = loadedRaces.map((r) => r.id);
          const loadedResults = await listRaceResultsByRaceIds(raceIds);
          setRaceResults(loadedResults);
        } else {
          setRaceResults([]);
        }
      } catch (err) {
        console.error("Error loading rankings:", err);
        setError(
          err.message ||
          t("common.errors.routeLoad", { message: "Unknown error" }),
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedSeasonId, t]);

  const raceResultsByRace = new Map();
  raceResults.forEach((r) => {
    if (!raceResultsByRace.has(r.race_id)) raceResultsByRace.set(r.race_id, []);
    raceResultsByRace.get(r.race_id).push(r);
  });

  const now = Date.now();

  const getDriverDisplay = (result) => {
    if (!result) return null;
    const driver = result.drivers || {};
    return {
      name: driver.name || t("common.misc.unknown"),
      picture: driver.picture_url || null,
      seed: result.driver_id || driver.email || driver.name || null,
    };
  };

  const renderDriverCell = (driver) => {
    if (!driver) return "-";
    return (
      <div className="d-flex align-items-center gap-2">
        <DriverImage
          src={driver.picture}
          seed={driver.seed || driver.name}
          alt={driver.name}
          className="rounded-circle"
          size={32}
        />
        <span>{driver.name}</span>
      </div>
    );
  };

  const getWinnerDriver = (results) => {
    if (!results || !results.length) return null;
    const winner = results.find(
      (result) => Number(result.finish_position) === 1,
    );
    return getDriverDisplay(winner);
  };

  const getFastestLapDriver = (results) => {
    if (!results || !results.length) return null;
    let best = null;
    results.forEach((result) => {
      const time = parseLapTime(result.best_lap_time);
      if (time === null) return;
      const finish = Number.isFinite(Number(result.finish_position))
        ? Number(result.finish_position)
        : Number.MAX_SAFE_INTEGER;
      if (
        !best ||
        time < best.time ||
        (time === best.time && finish < best.finish)
      ) {
        best = { result, time, finish };
      }
    });
    return best ? getDriverDisplay(best.result) : null;
  };

  const getRaceTimestamp = (race) => {
    if (!race || !race.race_datetime) return null;
    const time = new Date(race.race_datetime).getTime();
    return Number.isNaN(time) ? null : time;
  };

  const overallRaces = races.filter(
    (race) => race.affects_championship !== false,
  );

  const sections = [
    {
      id: "calendar",
      label: t("publicRankings.calendar"),
      type: "calendar",
      races,
    },
    {
      id: "overall",
      label: t("publicRankings.overallChampionship"),
      races: overallRaces,
      ranking: "points",
    },
    ...cups.map((cup) => ({
      id: `cup-${cup.id}`,
      label: cup.name,
      races: races.filter((race) => race.cup_id === cup.id),
      ranking: "points",
    })),
    {
      id: "penalties",
      label: t("publicRankings.penalties"),
      races: overallRaces,
      ranking: "penalties",
    },
  ];

  const orderedCalendarRaces = [...races].sort((left, right) => {
    const leftTime = getRaceTimestamp(left) ?? Number.MAX_SAFE_INTEGER;
    const rightTime = getRaceTimestamp(right) ?? Number.MAX_SAFE_INTEGER;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return String(left.name || "").localeCompare(String(right.name || ""));
  });

  return (
    <div className="container mt-4">
      <div className="d-flex gap-2 mb-3 align-items-center">
        <div className="h5 mb-0">{t("publicRankings.title")}</div>
        <div className="d-flex w-auto">
          <select
            className="form-select form-select-sm"
            id="season-name"
            aria-label={t("publicRankings.seasonLabel")}
            value={selectedSeasonId || ""}
            onChange={(e) => setSeasonId(e.target.value)}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          <span>{t("common.status.loadingRankings")}</span>
        </div>
      ) : !selectedSeasonId ? (
        <div className="alert alert-info">
          {t("publicRankings.noAvailableSeasonsYet")}
        </div>
      ) : (
        <>
          <ul className="nav nav-tabs" id="rankings-tabs" role="tablist">
            {sections.map((section, index) => (
              <li className="nav-item" role="presentation" key={section.id}>
                <button
                  className={`nav-link ${index === 0 ? "active" : ""} text-nowrap`}
                  data-bs-toggle="tab"
                  data-bs-target={`#${section.id}`}
                  type="button"
                  role="tab"
                  id={`${section.id}-tab`}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="tab-content border border-top-0" id="rankings-content">
            {sections.map((section, index) => {
              if (section.type === "calendar") {
                return (
                  <div
                    className={`tab-pane fade ${index === 0 ? "show active" : ""}`}
                    id={section.id}
                    role="tabpanel"
                    key={section.id}
                  >
                    <div className="table-responsive">
                      <table className="table table-striped align-middle">
                        <thead>
                          <tr>
                            <th>{t("publicRankings.table.raceDate")}</th>
                            <th>{t("publicRankings.table.raceName")}</th>
                            <th>{t("publicRankings.table.winner")}</th>
                            <th>{t("publicRankings.table.fastestLap")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderedCalendarRaces.map((race) => {
                            const raceTime = getRaceTimestamp(race);
                            const isCompleted =
                              raceTime !== null && raceTime <= now;
                            const results =
                              raceResultsByRace.get(race.id) || [];
                            const showResults = isCompleted && results.length;
                            const winner = showResults
                              ? getWinnerDriver(results)
                              : null;
                            const fastest = showResults
                              ? getFastestLapDriver(results)
                              : null;

                            return (
                              <tr key={race.id}>
                                <td>
                                  {race.race_datetime
                                    ? (() => {
                                      const d = new Date(race.race_datetime);
                                      const day = String(d.getDate()).padStart(2, "0");
                                      const month = d.toLocaleString(
                                        undefined,
                                        { month: "short" },
                                      ).replace(/\.$/, "");
                                      const hour = String(d.getHours()).padStart(2, "0");
                                      const min = String(d.getMinutes()).padStart(2, "0");
                                      return `${day} ${month} ${hour}h${min}m`;
                                    })()
                                    : "-"}
                                </td>
                                <td>
                                  {race.id ? (
                                    <Link
                                      className="fw-semibold d-block"
                                      to={`/admin/race?id=${race.id}`}
                                    >
                                      {race.name || "-"}
                                    </Link>
                                  ) : (
                                    race.name || "-"
                                  )}
                                  <small>{race.location || "-"}</small>
                                </td>
                                <td>{renderDriverCell(winner)}</td>
                                <td>{renderDriverCell(fastest)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              const sectionResults = raceResults.filter((result) =>
                section.races.some((race) => race.id === result.race_id),
              );

              const rankings =
                section.ranking === "penalties"
                  ? calculatePenaltyRankings(section.races, sectionResults, {
                    type: "overall",
                  })
                  : calculateRankings(section.races, sectionResults, {
                    type: section.id === "overall" ? "overall" : "cup",
                  });

              if (!section.races.length || !sectionResults.length) {
                return (
                  <div
                    className={`tab-pane fade ${index === 0 ? "show active" : ""}`}
                    id={section.id}
                    role="tabpanel"
                    key={section.id}
                  >
                    <div className="alert alert-info">
                      {t("publicRankings.noResultsTab")}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  className={`tab-pane fade ${index === 0 ? "show active" : ""}`}
                  id={section.id}
                  role="tabpanel"
                  key={section.id}
                >
                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
                      <thead>
                        <tr>
                          <th>{t("publicRankings.table.position")}</th>
                          <th>{t("publicRankings.table.driver")}</th>
                          <th>{t("publicRankings.table.totalPoints")}</th>
                          <th>{t("publicRankings.table.penalties")}</th>
                          <th>{t("publicRankings.table.bestPosition")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.map((driver, i) => (
                          <tr key={driver.driverId}>
                            <td>{i + 1}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <DriverImage
                                  src={driver.picture}
                                  seed={driver.driverId || driver.name}
                                  alt={driver.name}
                                  className="rounded-circle"
                                  size={36}
                                />
                                <span>{driver.name}</span>
                              </div>
                            </td>
                            <td className="fw-semibold">
                              {driver.totalPoints}
                            </td>
                            <td>{driver.penalties || 0}</td>
                            <td>{driver.bestPosition || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
