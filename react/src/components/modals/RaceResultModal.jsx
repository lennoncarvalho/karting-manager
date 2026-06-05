import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  isPositiveInteger,
  isValidLapTime,
  isRequired,
} from "@/lib/validation";
import { useToast } from "@/components/Notification";

const standardPenalties = [
  {
    type: "disqualification",
    name: "Disqualification",
    labelKey: "raceResultModal.penalties.disqualification",
    points: -8,
  },
  {
    type: "cone_tire_warning",
    name: "Cone/Tire Warning",
    labelKey: "raceResultModal.penalties.coneTireWarning",
    points: -2,
  },
  {
    type: "race_direction_warning",
    name: "Race Direction Warning",
    labelKey: "raceResultModal.penalties.raceDirectionWarning",
    points: -4,
  },
  {
    type: "stop_and_go",
    name: "Stop and Go",
    labelKey: "raceResultModal.penalties.stopAndGo",
    points: -6,
  },
  {
    type: "missing_club_shirt",
    name: "Missing Club Shirt",
    labelKey: "raceResultModal.penalties.missingClubShirt",
    points: -2,
  },
];

export function RaceResultModal({
  drivers = [],
  existingResults = [],
  initialData = null,
  onSave = null,
  onClose = null,
}) {
  const { t } = useTranslation();
  const { notify } = useToast();
  const isEdit = Boolean(initialData && initialData.id);

  const [driverId, setDriverId] = useState(initialData?.driver_id || "");
  const [finishPosition, setFinishPosition] = useState(
    initialData?.finish_position || "",
  );
  const [gridStart, setGridStart] = useState(
    initialData?.grid_start_position || "",
  );
  const [bestLapTime, setBestLapTime] = useState(
    initialData?.best_lap_time || "",
  );
  const [disqualified, setDisqualified] = useState(
    initialData?.is_disqualified || false,
  );
  const [comments, setComments] = useState(initialData?.comments || "");
  const [standardPenalties, setStandardPenalties] = useState(
    standardPenalties.map((p) => ({
      ...p,
      count:
        initialData?.penalties?.find((pen) => pen.penalty_type === p.type)
          ?.count || 0,
    })),
  );
  const [customPenalties, setCustomPenalties] = useState(() => {
    if (initialData?.penalties) {
      return initialData.penalties
        .filter((pen) => pen.penalty_type === "custom")
        .map((pen) => ({
          name: pen.penalty_name || "",
          points: pen.point_deduction || "",
          count: pen.count || "",
        }));
    }
    return [];
  });

  const existingDriverIds = new Set(
    existingResults.map((r) => r.driver_id).filter(Boolean),
  );

  const handleSave = async () => {
    const driverField = {};
    const finishField = {};
    const gridField = {};
    const bestLapField = {};
    let hasError = false;

    if (!isRequired(driverId)) {
      hasError = true;
    }
    if (!isPositiveInteger(finishPosition)) {
      hasError = true;
    }
    if (gridStart && !isPositiveInteger(gridStart)) {
      hasError = true;
    }
    if (bestLapTime && !isValidLapTime(bestLapTime)) {
      hasError = true;
    }

    if (hasError) {
      notify(t("notifications.pleaseFix"), "warning");
      return;
    }

    const penalties = [];
    standardPenalties.forEach((p) => {
      if (p.count > 0) {
        penalties.push({
          penalty_type: p.type,
          penalty_name: p.name,
          point_deduction: p.points,
          count: p.count,
        });
      }
    });

    customPenalties.forEach((p) => {
      const points = Number(p.points);
      const count = Number(p.count);
      if (
        p.name &&
        !Number.isNaN(points) &&
        !Number.isNaN(count) &&
        count > 0
      ) {
        penalties.push({
          penalty_type: "custom",
          penalty_name: p.name,
          point_deduction: points,
          count,
        });
      }
    });

    const payload = {
      id: initialData?.id || null,
      driver_id: driverId,
      finish_position: Number(finishPosition),
      grid_start_position: gridStart ? Number(gridStart) : null,
      best_lap_time: bestLapTime || null,
      is_disqualified: disqualified,
      comments: comments || null,
      penalties,
    };

    if (onSave) {
      await onSave(payload);
    }

    // Reset form
    if (!isEdit) {
      setDriverId("");
      setFinishPosition("");
      setGridStart("");
      setBestLapTime("");
      setDisqualified(false);
      setComments("");
      setStandardPenalties(standardPenalties.map((p) => ({ ...p, count: 0 })));
      setCustomPenalties([]);
    }

    if (onClose) onClose();
  };

  const addCustomPenaltyRow = () => {
    setCustomPenalties((prev) => [
      ...prev,
      { name: "", points: "", count: "" },
    ]);
  };

  const removeCustomPenaltyRow = (index) => {
    setCustomPenalties((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomPenaltyRow = (index, field, value) => {
    setCustomPenalties((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isEdit
                ? t("raceResultModal.titleEdit")
                : t("raceResultModal.titleAdd")}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => {
                if (onClose) onClose();
              }}
            ></button>
          </div>

          <div className="modal-body">
            <form>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="result-driver">
                    {t("raceResultModal.driver")}
                  </label>
                  <select
                    className={`form-select ${!isRequired(driverId) ? "is-invalid" : ""}`}
                    id="result-driver"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    required
                  >
                    <option value="">
                      {t("raceResultModal.selectDriver")}
                    </option>
                    {drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                        disabled={
                          existingDriverIds.has(driver.id) &&
                          (!initialData || driver.id !== initialData.driver_id)
                        }
                      >
                        {driver.name}
                      </option>
                    ))}
                  </select>
                  {!isRequired(driverId) && (
                    <div className="invalid-feedback">
                      {t("validation.driverRequired")}
                    </div>
                  )}
                </div>

                <div className="col-md-3">
                  <label className="form-label" htmlFor="result-finish">
                    {t("raceResultModal.finishPosition")}
                  </label>
                  <input
                    type="number"
                    className={`form-control ${!isPositiveInteger(finishPosition) ? "is-invalid" : ""}`}
                    id="result-finish"
                    min="1"
                    value={finishPosition}
                    onChange={(e) => setFinishPosition(e.target.value)}
                    required
                  />
                  {!isPositiveInteger(finishPosition) && (
                    <div className="invalid-feedback">
                      {t("validation.finishPositionPositive")}
                    </div>
                  )}
                </div>

                <div className="col-md-3">
                  <label className="form-label" htmlFor="result-grid">
                    {t("raceResultModal.gridStart")}
                  </label>
                  <input
                    type="number"
                    className={`form-control ${gridStart && !isPositiveInteger(gridStart) ? "is-invalid" : ""}`}
                    id="result-grid"
                    min="1"
                    value={gridStart}
                    onChange={(e) => setGridStart(e.target.value)}
                  />
                  {gridStart && !isPositiveInteger(gridStart) && (
                    <div className="invalid-feedback">
                      {t("validation.gridStartPositive")}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="result-best-lap">
                    {t("raceResultModal.bestLapTime")}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${bestLapTime && !isValidLapTime(bestLapTime) ? "is-invalid" : ""}`}
                    id="result-best-lap"
                    placeholder={t("raceResultModal.bestLapPlaceholder")}
                    value={bestLapTime}
                    onChange={(e) => setBestLapTime(e.target.value)}
                  />
                  {bestLapTime && !isValidLapTime(bestLapTime) && (
                    <div className="invalid-feedback">
                      {t("validation.bestLapInvalid")}
                    </div>
                  )}
                </div>

                <div className="col-md-6 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="result-disqualified"
                      checked={disqualified}
                      onChange={(e) => setDisqualified(e.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="result-disqualified"
                    >
                      {t("raceResultModal.disqualified")}
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="result-comments">
                    {t("raceResultModal.comments")}
                  </label>
                  <textarea
                    className="form-control"
                    id="result-comments"
                    rows="2"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              </div>

              <hr />

              <div>
                <h6 className="mb-3">
                  {t("raceResultModal.standardPenalties")}
                </h6>
                <div className="row g-3">
                  {standardPenalties.map((penalty, index) => (
                    <div className="col-md-4" key={penalty.type}>
                      <label className="form-label">
                        {t(penalty.labelKey)} ({penalty.points})
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={penalty.count}
                        onChange={(e) => {
                          setStandardPenalties((prev) =>
                            prev.map((p, i) =>
                              i === index
                                ? { ...p, count: Number(e.target.value) }
                                : p,
                            ),
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <hr />

              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="mb-0">
                    {t("raceResultModal.customPenalties")}
                  </h6>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={addCustomPenaltyRow}
                  >
                    {t("raceResultModal.add")}
                  </button>
                </div>
                <div id="custom-penalties">
                  {customPenalties.map((penalty, index) => (
                    <div
                      className="row g-2 align-items-end mb-2 custom-penalty-row"
                      key={index}
                    >
                      <div className="col-md-5">
                        <label className="form-label">
                          {t("raceResultModal.customName")}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={penalty.name}
                          onChange={(e) =>
                            updateCustomPenaltyRow(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">
                          {t("raceResultModal.customPoints")}
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={penalty.points}
                          onChange={(e) =>
                            updateCustomPenaltyRow(
                              index,
                              "points",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">
                          {t("raceResultModal.customCount")}
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={penalty.count}
                          onChange={(e) =>
                            updateCustomPenaltyRow(
                              index,
                              "count",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="col-md-1">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeCustomPenaltyRow(index)}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                if (onClose) onClose();
              }}
            >
              {t("raceResultModal.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              {t("raceResultModal.saveResult")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
