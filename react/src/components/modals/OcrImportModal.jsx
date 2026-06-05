import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { runOcr } from "@/lib/ocr";
import { detectSheetType, parseOcrRows } from "@/lib/ocrParsing";
import { matchDriverName } from "@/lib/matching";
import { isValidLapTime } from "@/lib/validation";
import { useToast } from "@/components/Notification";

const DRAFT_PREFIX = "ocrImportDraft:";
const enhanceDefaults = {
  enabled: true,
  contrast: 1.3,
  thresholdEnabled: false,
  threshold: 150,
};

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
  } catch {}
}

function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
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
  const [currentImage, setCurrentImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [cropSelection, setCropSelection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const [enhance, setEnhance] = useState({
    ...enhanceDefaults,
    enabled: savedDraft?.enhance ?? enhanceDefaults.enabled,
  });
  const [contrast, setContrast] = useState(
    savedDraft?.contrast ?? enhanceDefaults.contrast,
  );
  const [thresholdEnabled, setThresholdEnabled] = useState(
    savedDraft?.thresholdEnabled ?? enhanceDefaults.thresholdEnabled,
  );
  const [threshold, setThreshold] = useState(
    savedDraft?.threshold ?? enhanceDefaults.threshold,
  );

  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const previewContainerRef = useRef(null);

  useEffect(() => {
    writeDraft(draftKey, {
      mode,
      rows: parsedRows,
      text: ocrText,
      tables: ocrTables,
      enhance,
      contrast,
      thresholdEnabled,
      threshold,
    });
  }, [
    mode,
    parsedRows,
    ocrText,
    ocrTables,
    enhance,
    contrast,
    thresholdEnabled,
    threshold,
    draftKey,
  ]);

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

  const loadImageFromFile = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image."));
      };
      img.src = url;
    });

  const getImageDimensions = (image) => {
    if (!image) return { width: 0, height: 0 };
    if (image instanceof HTMLCanvasElement)
      return { width: image.width, height: image.height };
    return { width: image.naturalWidth, height: image.naturalHeight };
  };

  const applyEnhancementsToCanvas = (ctx, width, height) => {
    if (!enhance.enabled && !thresholdEnabled) return;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let value = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      if (enhance.enabled) {
        value = Math.round((value - 128) * contrast + 128);
      }
      if (thresholdEnabled) {
        value = value >= threshold ? 255 : 0;
      }
      value = Math.max(0, Math.min(255, value));
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const drawCropOverlay = (ctx) => {
    if (!cropSelection || cropSelection.w < 5 || cropSelection.h < 5) return;
    ctx.save();
    ctx.fillStyle = "rgba(0, 123, 255, 0.15)";
    ctx.strokeStyle = "rgba(0, 123, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.fillRect(
      cropSelection.x,
      cropSelection.y,
      cropSelection.w,
      cropSelection.h,
    );
    ctx.strokeRect(
      cropSelection.x + 1,
      cropSelection.y + 1,
      cropSelection.w - 2,
      cropSelection.h - 2,
    );
    ctx.restore();
  };

  const renderPreview = () => {
    if (!currentImage) return;
    const { width, height } = getImageDimensions(currentImage);
    if (!width || !height) return;
    const maxWidth = 900;
    const maxHeight = 600;
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    setPreviewScale(scale);
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    applyEnhancementsToCanvas(ctx, canvas.width, canvas.height);
    drawCropOverlay(ctx);
  };

  const getCanvasPoint = (event) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (!file) {
      setOriginalImage(null);
      setCurrentImage(null);
      setCropSelection(null);
      return;
    }
    try {
      const img = await loadImageFromFile(file);
      setOriginalImage(img);
      setCurrentImage(img);
      setCropSelection(null);
      renderPreview();
    } catch (err) {
      notify(err.message || t("ocrImport.noImage"), "error");
    }
  };

  const handleApplyCrop = () => {
    if (!currentImage || !cropSelection) return;
    const { width, height } = getImageDimensions(currentImage);
    const scale = previewScale || 1;
    const sx = Math.max(0, Math.round(cropSelection.x / scale));
    const sy = Math.max(0, Math.round(cropSelection.y / scale));
    const sw = Math.max(1, Math.round(cropSelection.w / scale));
    const sh = Math.max(1, Math.round(cropSelection.h / scale));
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.min(sw, width - sx);
    cropCanvas.height = Math.min(sh, height - sy);
    const ctx = cropCanvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(
      currentImage,
      sx,
      sy,
      cropCanvas.width,
      cropCanvas.height,
      0,
      0,
      cropCanvas.width,
      cropCanvas.height,
    );
    setCurrentImage(cropCanvas);
    setCropSelection(null);
    renderPreview();
  };

  const handleResetImage = () => {
    if (!originalImage) return;
    setCurrentImage(originalImage);
    setCropSelection(null);
    renderPreview();
  };

  const runOcrFlow = async () => {
    if (!selectedFile) {
      notify(t("ocrImport.noImage"), "warning");
      return;
    }
    if (!updateGateWarning()) return;

    setStatus("running");

    try {
      let ocrBlob = selectedFile;
      if (currentImage) {
        const { width, height } = getImageDimensions(currentImage);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(currentImage, 0, 0, width, height);
        applyEnhancementsToCanvas(ctx, width, height);
        ocrBlob = await new Promise((resolve) => {
          canvas.toBlob(
            (blob) => resolve(blob || selectedFile),
            "image/png",
            0.95,
          );
        });
      }

      const { text, tables, fallbackUsed } = await runOcr(ocrBlob);

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

  const canvasMouseDown = (event) => {
    if (!currentImage) return;
    const point = getCanvasPoint(event);
    setIsDragging(true);
    setDragStart(point);
    setCropSelection({ x: point.x, y: point.y, w: 0, h: 0 });
    renderPreview();
  };

  const canvasMouseMove = (event) => {
    if (!isDragging || !dragStart) return;
    const point = getCanvasPoint(event);
    const x1 = Math.max(0, Math.min(dragStart.x, point.x));
    const y1 = Math.max(0, Math.min(dragStart.y, point.y));
    const x2 = Math.min(
      previewCanvasRef.current?.width || 0,
      Math.max(dragStart.x, point.x),
    );
    const y2 = Math.min(
      previewCanvasRef.current?.height || 0,
      Math.max(dragStart.y, point.y),
    );
    setCropSelection({
      x: x1,
      y: y1,
      w: Math.max(0, x2 - x1),
      h: Math.max(0, y2 - y1),
    });
    renderPreview();
  };

  const canvasMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStart(null);
    if (cropSelection && (cropSelection.w < 5 || cropSelection.h < 5)) {
      setCropSelection(null);
    }
    renderPreview();
  };

  const canvasMouseLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStart(null);
    if (cropSelection && (cropSelection.w < 5 || cropSelection.h < 5)) {
      setCropSelection(null);
    }
    renderPreview();
  };

  const hasRows = parsedRows.length > 0;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl">
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
              <div className="col-md-8">
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
                capture="environment"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </div>

            <div className="mt-3 d-flex flex-column flex-md-row gap-2 align-items-md-center">
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

            <div className="mt-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">{t("ocrImport.cropTitle")}</h6>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="ocr-enhance-toggle"
                          checked={enhance.enabled}
                          onChange={(e) =>
                            setEnhance((prev) => ({
                              ...prev,
                              enabled: e.target.checked,
                            }))
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="ocr-enhance-toggle"
                        >
                          {t("ocrImport.enhance")}
                        </label>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="ocr-contrast">
                        {t("ocrImport.contrast")}
                      </label>
                      <input
                        className="form-range"
                        type="range"
                        id="ocr-contrast"
                        min="0.8"
                        max="1.8"
                        step="0.05"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                      />
                      <div className="small text-muted">
                        {contrast.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-check mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="ocr-threshold-toggle"
                          checked={thresholdEnabled}
                          onChange={(e) =>
                            setThresholdEnabled(e.target.checked)
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="ocr-threshold-toggle"
                        >
                          {t("ocrImport.threshold")}
                        </label>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="ocr-threshold">
                        {t("ocrImport.thresholdValue")}
                      </label>
                      <input
                        className="form-range"
                        type="range"
                        id="ocr-threshold"
                        min="80"
                        max="220"
                        step="5"
                        value={threshold}
                        disabled={!thresholdEnabled}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                      />
                      <div className="small text-muted">{threshold}</div>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleApplyCrop}
                      disabled={!cropSelection || !currentImage}
                    >
                      {t("ocrImport.applyCrop")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleResetImage}
                      disabled={
                        !originalImage || currentImage === originalImage
                      }
                    >
                      {t("ocrImport.resetImage")}
                    </button>
                  </div>
                  <div className="small text-muted mt-2">
                    {t("ocrImport.cropHint")}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              {currentImage ? (
                <canvas
                  ref={previewCanvasRef}
                  className="img-fluid rounded border"
                  onMouseDown={canvasMouseDown}
                  onMouseMove={canvasMouseMove}
                  onMouseUp={canvasMouseUp}
                  onMouseLeave={canvasMouseLeave}
                  style={{ cursor: currentImage ? "crosshair" : "default" }}
                />
              ) : null}
            </div>

            {hasRows && (
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
            )}
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
