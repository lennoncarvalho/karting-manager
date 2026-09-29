import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { runOcr } from "@/lib/ocr";
import { detectSheetType, parseOcrRows } from "@/lib/ocrParsing";
import { matchDriverName } from "@/lib/matching";
import { isValidLapTime } from "@/lib/validation";
import { useToast } from "@/components/Notification";

const DRAFT_PREFIX = "ocrImportDraft:";

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* best-effort draft persist; ignore quota/unavailable errors */
  }
}

function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* best-effort draft clear; ignore quota/unavailable storage */
  }
}

// Re-encodes non-PNG selections as PNG so the OCR providers receive a
// universally supported format (mirrors the legacy frontend behaviour).
function normalizeImageToPng(file) {
  if (file.type === "image/png" || /\.png$/i.test(file.name)) {
    return Promise.resolve(file);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const baseName = file.name.replace(/\.[^.]+$/, "");
            resolve(new File([blob], `${baseName}.png`, { type: "image/png" }));
          } else {
            resolve(file);
          }
        },
        "image/png",
        0.95,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function OcrImportModal({
  raceId,
  drivers = [],
  existingResults = [],
  onSave = null,
  onClose = null,
}) {
  const { t } = useTranslation();
  const { notify } = useToast();

  const hasResults = existingResults.length > 0;
  const draftKey = `${DRAFT_PREFIX}${raceId || "unknown"}`;
  const savedDraft = readDraft(draftKey);

  const [mode, setMode] = useState(savedDraft?.mode || "race");
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState(savedDraft?.rows || []);
  const [ocrText, setOcrText] = useState(savedDraft?.text || "");
  const [ocrTables, setOcrTables] = useState(savedDraft?.tables || []);
  const [status, setStatus] = useState("idle");
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    writeDraft(draftKey, {
      mode,
      rows: parsedRows,
      text: ocrText,
      tables: ocrTables,
    });
  }, [mode, parsedRows, ocrText, ocrTables, draftKey]);

  const updateGateWarning = () => {
    if (mode === "race" && hasResults) {
      notify(t("ocrImport.blockedRace"), "warning");
      return false;
    }
    if (mode === "qualifying" && !hasResults) {
      notify(t("ocrImport.blockedQualifying"), "warning");
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const runOcrFlow = async () => {
    if (!selectedFile) {
      notify(t("ocrImport.noImage"), "warning");
      return;
    }
    if (!updateGateWarning()) return;

    setStatus("running");

    try {
      const ocrFile = await normalizeImageToPng(selectedFile);
      const { text, tables, fallbackUsed } = await runOcr(ocrFile);

      if (fallbackUsed) {
        notify(t("ocrImport.fallbackNotice"), "warning");
      }

      setOcrText(text || "");
      setOcrTables(Array.isArray(tables) ? tables : []);
      setStatus("parsing");

      const detected = detectSheetType(text);
      if (detected && detected !== mode) {
        const detectedLabel =
          detected === "race"
            ? t("ocrImport.modeRace")
            : t("ocrImport.modeQualifying");
        const selectedLabel =
          mode === "race"
            ? t("ocrImport.modeRace")
            : t("ocrImport.modeQualifying");
        const confirmed = window.confirm(
          t("ocrImport.typeMismatch", {
            detected: detectedLabel,
            selected: selectedLabel,
          }),
        );
        if (!confirmed) {
          setMode(detected);
          if (!updateGateWarning()) return;
        }
      }

      const rows = parseOcrRows({ text, tables });
      const matchedRows = rows.map((row) => {
        const match = matchDriverName(row.name, drivers);
        return {
          position: row.position,
          name: row.name,
          bestLapTime: isValidLapTime(row.bestLapTime) ? row.bestLapTime : null,
          driverId: match.best ? match.best.id : null,
          skip: false,
        };
      });
      setParsedRows(matchedRows);
      setStatus(matchedRows.length > 0 ? "ready" : "noRows");
    } catch (err) {
      setStatus("idle");
      notify(err.message || t("ocrImport.ocrFailed"), "error");
    }
  };

  const handleReviewChange = (index, type, value) => {
    setParsedRows((prev) => {
      const next = [...prev];
      if (type === "driver") {
        next[index].driverId = value || null;
        next[index].skip = false;
      } else if (type === "skip") {
        next[index].skip = value;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!parsedRows.length) return;

    if (mode === "race" && hasResults) {
      notify(t("ocrImport.blockedRace"), "warning");
      return;
    }
    if (mode === "qualifying" && !hasResults) {
      notify(t("ocrImport.blockedQualifying"), "warning");
      return;
    }

    const unresolved = parsedRows.filter((row) => !row.skip && !row.driverId);
    if (unresolved.length) {
      notify(t("ocrImport.unresolvedRows"), "warning");
      return;
    }

    const selectedRows = parsedRows.filter((row) => !row.skip && row.driverId);
    if (!selectedRows.length) {
      notify(t("ocrImport.noValidRows"), "warning");
      return;
    }

    const duplicates = new Set();
    const seen = new Set();
    selectedRows.forEach((row) => {
      if (seen.has(row.driverId)) duplicates.add(row.driverId);
      seen.add(row.driverId);
    });
    if (duplicates.size > 0) {
      notify(t("ocrImport.duplicateDrivers"), "warning");
      return;
    }

    const success = await onSave({ mode, rows: selectedRows });
    if (success !== false) {
      clearDraft(draftKey);
      if (onClose) onClose();
    }
  };

  const hasRows = parsedRows.length > 0;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-fullscreen-md-down">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t("ocrImport.title")}</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => {
                if (onClose) onClose();
              }}
            ></button>
          </div>

          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="ocr-mode">
                  {t("ocrImport.modeLabel")}
                </label>
                <select
                  className="form-select"
                  id="ocr-mode"
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                  }}
                >
                  <option value="race">{t("ocrImport.modeRace")}</option>
                  <option value="qualifying">
                    {t("ocrImport.modeQualifying")}
                  </option>
                </select>
              </div>
              <div className="col-md-8 d-none d-lg-block">
                <label className="form-label">
                  {t("ocrImport.providerLabel")}
                </label>
                <div className="form-control-plaintext">
                  {t("ocrImport.providerAuto")}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label" htmlFor="ocr-file">
                {t("ocrImport.chooseImage")}
              </label>
              <input
                className="form-control"
                id="ocr-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </div>

            <div className="mt-3 d-flex flex-column flex-md-row gap-2 align-items-md-center">
              <div className="alert alert-warning" role="alert">
                {t("ocrImport.imageHint")}
              </div>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={runOcrFlow}
              >
                {t("ocrImport.runOcr")}
              </button>
              <div className="small text-muted">
                {status === "running" && t("ocrImport.statusRunning")}
                {status === "parsing" && t("ocrImport.statusParsing")}
                {status === "ready" && t("ocrImport.statusReady")}
                {status === "noRows" && t("ocrImport.statusNoRows")}
                {status === "idle" && t("ocrImport.statusIdle")}
              </div>
            </div>

            {selectedFile ? (
              <div className="mt-3">
                <img
                  src={
                    previewUrl /* blob: URL of the locally selected file — cannot contain HTML */
                  }
                  alt={selectedFile.name}
                  className="img-fluid w-100 rounded"
                />
              </div>
            ) : null}

            {hasRows ? (
              <div className="mt-4 table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>{t("ocrImport.table.position")}</th>
                      <th>{t("ocrImport.table.name")}</th>
                      {mode === "race" && (
                        <th>{t("ocrImport.table.bestLap")}</th>
                      )}
                      <th>{t("ocrImport.table.driver")}</th>
                      <th className="text-center">
                        {t("ocrImport.table.skip")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, index) => (
                      <tr
                        key={index}
                        className={
                          !row.driverId && !row.skip ? "table-warning" : ""
                        }
                      >
                        <td>{row.position}</td>
                        <td>{row.name}</td>
                        {mode === "race" && <td>{row.bestLapTime || "-"}</td>}
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={row.driverId || ""}
                            onChange={(e) =>
                              handleReviewChange(
                                index,
                                "driver",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">
                              {t("ocrImport.noDriverMatch")}
                            </option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={row.skip}
                            onChange={(e) =>
                              handleReviewChange(
                                index,
                                "skip",
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                if (onClose) onClose();
              }}
            >
              {t("ocrImport.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!hasRows}
            >
              {t("ocrImport.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
