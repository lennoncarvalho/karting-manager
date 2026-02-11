/**
 * OCR Import Modal
 * Handles image upload, OCR, review, and import confirmation.
 */

import { runOcr, hasAzureConfig } from '../services/ocr.js';
import { detectSheetType, parseOcrRows } from '../utils/parsing.js';
import { matchDriverName } from '../utils/matching.js';
import { showNotification, showConfirmation } from '../utils/helpers.js';
import { isValidLapTime } from '../utils/validation.js';
import { t } from '../services/i18n.js';

const DRAFT_PREFIX = 'ocrImportDraft:';

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeDraft(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage failures.
  }
}

function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore storage failures.
  }
}

export function openOcrImportModal(options = {}) {
  const {
    raceId,
    drivers = [],
    existingResults = [],
    onSave = null
  } = options;

  const modalId = `ocr-import-modal-${Date.now()}`;
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = modalId;
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('aria-hidden', 'true');

  const hasResults = existingResults.length > 0;
  const draftKey = `${DRAFT_PREFIX}${raceId || 'unknown'}`;
  const savedDraft = readDraft(draftKey);
  let selectedFile = null;
  let parsedRows = savedDraft?.rows || [];
  let lastOcrText = savedDraft?.text || '';
  let lastOcrTables = savedDraft?.tables || [];
  let originalImage = null;
  let currentImage = null;
  let previewScale = 1;
  let cropSelection = null;
  let isDragging = false;
  let dragStart = null;
  const enhanceOptions = {
    enabled: true,
    contrast: 1.3,
    thresholdEnabled: false,
    threshold: 150
  };

  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${t('ocrImport.title')}</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="${t('common.actions.close')}"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label" for="ocr-mode">${t('ocrImport.modeLabel')}</label>
              <select class="form-select" id="ocr-mode">
                <option value="race">${t('ocrImport.modeRace')}</option>
                <option value="qualifying">${t('ocrImport.modeQualifying')}</option>
              </select>
            </div>
            <div class="col-md-8">
              <label class="form-label">${t('ocrImport.providerLabel')}</label>
              <div class="form-control-plaintext">
                ${hasAzureConfig() ? t('ocrImport.providerAuto') : t('ocrImport.providerTesseract')}
              </div>
            </div>
          </div>
          <div class="mt-3">
            <label class="form-label" for="ocr-file">${t('ocrImport.chooseImage')}</label>
            <input class="form-control" id="ocr-file" type="file" accept="image/*" capture="environment">
          </div>
          <div class="mt-3 d-flex flex-column flex-md-row gap-2 align-items-md-center">
            <button type="button" class="btn btn-outline-primary" id="ocr-run">${t('ocrImport.runOcr')}</button>
            <div class="small text-muted" id="ocr-status">${t('ocrImport.statusIdle')}</div>
          </div>
          <div class="mt-3">
            <div class="card">
              <div class="card-body">
                <h6 class="mb-3">${t('ocrImport.cropTitle')}</h6>
                <div class="row g-3">
                  <div class="col-md-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="ocr-enhance-toggle" checked>
                      <label class="form-check-label" for="ocr-enhance-toggle">${t('ocrImport.enhance')}</label>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label" for="ocr-contrast">${t('ocrImport.contrast')}</label>
                    <input class="form-range" type="range" id="ocr-contrast" min="0.8" max="1.8" step="0.05" value="1.3">
                    <div class="small text-muted" id="ocr-contrast-value">1.30</div>
                  </div>
                  <div class="col-md-3">
                    <div class="form-check mt-4">
                      <input class="form-check-input" type="checkbox" id="ocr-threshold-toggle">
                      <label class="form-check-label" for="ocr-threshold-toggle">${t('ocrImport.threshold')}</label>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label" for="ocr-threshold">${t('ocrImport.thresholdValue')}</label>
                    <input class="form-range" type="range" id="ocr-threshold" min="80" max="220" step="5" value="150">
                    <div class="small text-muted" id="ocr-threshold-value">150</div>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-3">
                  <button type="button" class="btn btn-outline-primary" id="ocr-apply-crop" disabled>${t('ocrImport.applyCrop')}</button>
                  <button type="button" class="btn btn-outline-secondary" id="ocr-reset-image" disabled>${t('ocrImport.resetImage')}</button>
                </div>
                <div class="small text-muted mt-2">${t('ocrImport.cropHint')}</div>
              </div>
            </div>
          </div>
          <div class="mt-3 d-none" id="ocr-preview">
            <canvas id="ocr-preview-canvas" class="img-fluid rounded border"></canvas>
          </div>
          <div class="alert alert-warning mt-3 d-none" id="ocr-gate-warning"></div>
          <div class="mt-4" id="ocr-review"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${t('ocrImport.cancel')}</button>
          <button type="button" class="btn btn-primary" id="ocr-save" disabled>${t('ocrImport.save')}</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const modeSelect = modal.querySelector('#ocr-mode');
  const fileInput = modal.querySelector('#ocr-file');
  const runButton = modal.querySelector('#ocr-run');
  const statusLabel = modal.querySelector('#ocr-status');
  const previewContainer = modal.querySelector('#ocr-preview');
  const previewCanvas = modal.querySelector('#ocr-preview-canvas');
  const enhanceToggle = modal.querySelector('#ocr-enhance-toggle');
  const contrastRange = modal.querySelector('#ocr-contrast');
  const thresholdToggle = modal.querySelector('#ocr-threshold-toggle');
  const thresholdRange = modal.querySelector('#ocr-threshold');
  const contrastValue = modal.querySelector('#ocr-contrast-value');
  const thresholdValue = modal.querySelector('#ocr-threshold-value');
  const applyCropButton = modal.querySelector('#ocr-apply-crop');
  const resetImageButton = modal.querySelector('#ocr-reset-image');
  const reviewContainer = modal.querySelector('#ocr-review');
  const saveButton = modal.querySelector('#ocr-save');
  const gateWarning = modal.querySelector('#ocr-gate-warning');

  modeSelect.value = savedDraft?.mode || 'race';
  enhanceToggle.checked = enhanceOptions.enabled;
  contrastRange.value = String(enhanceOptions.contrast);
  contrastValue.textContent = enhanceOptions.contrast.toFixed(2);
  thresholdToggle.checked = enhanceOptions.thresholdEnabled;
  thresholdRange.value = String(enhanceOptions.threshold);
  thresholdValue.textContent = String(enhanceOptions.threshold);
  thresholdRange.disabled = !enhanceOptions.thresholdEnabled;

  const updateGateWarning = () => {
    gateWarning.classList.add('d-none');
    gateWarning.textContent = '';
    const mode = modeSelect.value;
    if (mode === 'race' && hasResults) {
      gateWarning.textContent = t('ocrImport.blockedRace');
      gateWarning.classList.remove('d-none');
      return false;
    }
    if (mode === 'qualifying' && !hasResults) {
      gateWarning.textContent = t('ocrImport.blockedQualifying');
      gateWarning.classList.remove('d-none');
      return false;
    }
    return true;
  };

  const updateSaveState = () => {
    const hasRows = parsedRows && parsedRows.length > 0;
    saveButton.disabled = !hasRows;
  };

  const persistDraft = () => {
    writeDraft(draftKey, {
      mode: modeSelect.value,
      rows: parsedRows,
      text: lastOcrText,
      tables: lastOcrTables
    });
  };

  const getImageDimensions = (image) => {
    if (!image) return { width: 0, height: 0 };
    if (image instanceof HTMLCanvasElement) {
      return { width: image.width, height: image.height };
    }
    return { width: image.naturalWidth, height: image.naturalHeight };
  };

  const applyEnhancementsToCanvas = (ctx, width, height) => {
    if (!enhanceOptions.enabled && !enhanceOptions.thresholdEnabled) return;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let value = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      if (enhanceOptions.enabled) {
        value = Math.round((value - 128) * enhanceOptions.contrast + 128);
      }
      if (enhanceOptions.thresholdEnabled) {
        value = value >= enhanceOptions.threshold ? 255 : 0;
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
    ctx.fillStyle = 'rgba(0, 123, 255, 0.15)';
    ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.fillRect(cropSelection.x, cropSelection.y, cropSelection.w, cropSelection.h);
    ctx.strokeRect(cropSelection.x + 1, cropSelection.y + 1, cropSelection.w - 2, cropSelection.h - 2);
    ctx.restore();
  };

  const renderPreview = () => {
    if (!currentImage) {
      previewContainer.classList.add('d-none');
      applyCropButton.disabled = true;
      resetImageButton.disabled = true;
      return;
    }
    previewContainer.classList.remove('d-none');
    const { width, height } = getImageDimensions(currentImage);
    if (!width || !height) return;
    const maxWidth = 900;
    const maxHeight = 600;
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    previewScale = scale;
    previewCanvas.width = Math.max(1, Math.round(width * scale));
    previewCanvas.height = Math.max(1, Math.round(height * scale));
    const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.drawImage(currentImage, 0, 0, previewCanvas.width, previewCanvas.height);
    applyEnhancementsToCanvas(ctx, previewCanvas.width, previewCanvas.height);
    drawCropOverlay(ctx);
    applyCropButton.disabled = !cropSelection;
    resetImageButton.disabled = currentImage !== originalImage;
  };

  const getCanvasPoint = (event) => {
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const loadImageFromFile = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });

  const buildOcrBlob = async () => {
    if (!currentImage) return selectedFile;
    const { width, height } = getImageDimensions(currentImage);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(currentImage, 0, 0, width, height);
    applyEnhancementsToCanvas(ctx, width, height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || selectedFile), 'image/png', 0.95);
    });
  };

  const renderReviewTable = () => {
    reviewContainer.innerHTML = '';
    if (!parsedRows.length) {
      updateSaveState();
      return;
    }

    const table = document.createElement('table');
    table.className = 'table table-sm table-striped align-middle';
    table.innerHTML = `
      <thead>
        <tr>
          <th>${t('ocrImport.table.position')}</th>
          <th>${t('ocrImport.table.name')}</th>
          ${modeSelect.value === 'race' ? `<th>${t('ocrImport.table.bestLap')}</th>` : ''}
          <th>${t('ocrImport.table.driver')}</th>
          <th>${t('ocrImport.table.skip')}</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    parsedRows.forEach((row, index) => {
      const tr = document.createElement('tr');
      if (!row.driverId && !row.skip) {
        tr.classList.add('table-warning');
      }
      const driverOptions = drivers.map((driver) => {
        const selected = row.driverId === driver.id ? 'selected' : '';
        return `<option value="${driver.id}" ${selected}>${driver.name}</option>`;
      }).join('');
      tr.innerHTML = `
        <td>${row.position}</td>
        <td>${row.name}</td>
        ${modeSelect.value === 'race' ? `<td>${row.bestLapTime || '-'}</td>` : ''}
        <td>
          <select class="form-select form-select-sm" data-row="${index}">
            <option value="">${t('ocrImport.noDriverMatch')}</option>
            ${driverOptions}
          </select>
        </td>
        <td class="text-center">
          <input type="checkbox" class="form-check-input" data-skip="${index}" ${row.skip ? 'checked' : ''}>
        </td>
      `;
      tbody.appendChild(tr);
    });

    reviewContainer.appendChild(table);
    updateSaveState();
  };

  const applyMatches = (rows) => rows.map((row) => {
    const match = matchDriverName(row.name, drivers);
    return {
      position: row.position,
      name: row.name,
      bestLapTime: isValidLapTime(row.bestLapTime) ? row.bestLapTime : null,
      driverId: match.best ? match.best.id : null,
      skip: false
    };
  });

  const loadDraft = () => {
    if (!parsedRows.length) return;
    renderReviewTable();
  };

  const runOcrFlow = async () => {
    if (!selectedFile) {
      showNotification(t('ocrImport.noImage'), 'warning');
      return;
    }
    if (!updateGateWarning()) {
      showNotification(gateWarning.textContent, 'warning');
      return;
    }
    statusLabel.textContent = t('ocrImport.statusRunning');
    try {
      const ocrBlob = await buildOcrBlob();
      if (!ocrBlob) {
        showNotification(t('ocrImport.noImage'), 'warning');
        statusLabel.textContent = t('ocrImport.statusIdle');
        return;
      }
      const { text, tables, fallbackUsed } = await runOcr(ocrBlob);
      if (fallbackUsed) {
        showNotification(t('ocrImport.fallbackNotice'), 'warning');
      }
      lastOcrText = text || '';
      lastOcrTables = Array.isArray(tables) ? tables : [];
      const detected = detectSheetType(lastOcrText);
      if (detected && detected !== modeSelect.value) {
        const detectedLabel = detected === 'race' ? t('ocrImport.modeRace') : t('ocrImport.modeQualifying');
        const selectedLabel = modeSelect.value === 'race' ? t('ocrImport.modeRace') : t('ocrImport.modeQualifying');
        const confirmed = await showConfirmation(
          t('ocrImport.typeMismatch', { detected: detectedLabel, selected: selectedLabel })
        );
        if (!confirmed) {
          modeSelect.value = detected;
          if (!updateGateWarning()) {
            persistDraft();
            return;
          }
        }
      }
      statusLabel.textContent = t('ocrImport.statusParsing');
      const rows = parseOcrRows({ text: lastOcrText, tables: lastOcrTables });
      parsedRows = applyMatches(rows);
      statusLabel.textContent = parsedRows.length ? t('ocrImport.statusReady') : t('ocrImport.statusNoRows');
      renderReviewTable();
      persistDraft();
    } catch (error) {
      statusLabel.textContent = t('ocrImport.statusIdle');
      showNotification(error.message || t('ocrImport.ocrFailed'), 'error');
    }
  };

  fileInput.addEventListener('change', async (event) => {
    selectedFile = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    if (!selectedFile) {
      originalImage = null;
      currentImage = null;
      cropSelection = null;
      renderPreview();
      return;
    }
    try {
      originalImage = await loadImageFromFile(selectedFile);
      currentImage = originalImage;
      cropSelection = null;
      renderPreview();
    } catch (error) {
      showNotification(error.message || t('ocrImport.noImage'), 'error');
    }
  });

  modeSelect.addEventListener('change', () => {
    updateGateWarning();
    renderReviewTable();
    persistDraft();
  });

  runButton.addEventListener('click', runOcrFlow);

  enhanceToggle.addEventListener('change', () => {
    enhanceOptions.enabled = enhanceToggle.checked;
    renderPreview();
  });

  contrastRange.addEventListener('input', () => {
    enhanceOptions.contrast = Number(contrastRange.value);
    contrastValue.textContent = enhanceOptions.contrast.toFixed(2);
    renderPreview();
  });

  thresholdToggle.addEventListener('change', () => {
    enhanceOptions.thresholdEnabled = thresholdToggle.checked;
    thresholdRange.disabled = !enhanceOptions.thresholdEnabled;
    renderPreview();
  });

  thresholdRange.addEventListener('input', () => {
    enhanceOptions.threshold = Number(thresholdRange.value);
    thresholdValue.textContent = String(enhanceOptions.threshold);
    renderPreview();
  });

  applyCropButton.addEventListener('click', () => {
    if (!currentImage || !cropSelection) return;
    const { width, height } = getImageDimensions(currentImage);
    const scale = previewScale || 1;
    const sx = Math.max(0, Math.round(cropSelection.x / scale));
    const sy = Math.max(0, Math.round(cropSelection.y / scale));
    const sw = Math.max(1, Math.round(cropSelection.w / scale));
    const sh = Math.max(1, Math.round(cropSelection.h / scale));
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.min(sw, width - sx);
    cropCanvas.height = Math.min(sh, height - sy);
    const ctx = cropCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(currentImage, sx, sy, cropCanvas.width, cropCanvas.height, 0, 0, cropCanvas.width, cropCanvas.height);
    currentImage = cropCanvas;
    cropSelection = null;
    renderPreview();
  });

  resetImageButton.addEventListener('click', () => {
    if (!originalImage) return;
    currentImage = originalImage;
    cropSelection = null;
    renderPreview();
  });

  previewCanvas.addEventListener('mousedown', (event) => {
    if (!currentImage) return;
    const point = getCanvasPoint(event);
    isDragging = true;
    dragStart = point;
    cropSelection = { x: point.x, y: point.y, w: 0, h: 0 };
    renderPreview();
  });

  previewCanvas.addEventListener('mousemove', (event) => {
    if (!isDragging || !dragStart) return;
    const point = getCanvasPoint(event);
    const x1 = Math.max(0, Math.min(dragStart.x, point.x));
    const y1 = Math.max(0, Math.min(dragStart.y, point.y));
    const x2 = Math.min(previewCanvas.width, Math.max(dragStart.x, point.x));
    const y2 = Math.min(previewCanvas.height, Math.max(dragStart.y, point.y));
    cropSelection = {
      x: x1,
      y: y1,
      w: Math.max(0, x2 - x1),
      h: Math.max(0, y2 - y1)
    };
    renderPreview();
  });

  previewCanvas.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    dragStart = null;
    if (cropSelection && (cropSelection.w < 5 || cropSelection.h < 5)) {
      cropSelection = null;
    }
    renderPreview();
  });

  previewCanvas.addEventListener('mouseleave', () => {
    if (!isDragging) return;
    isDragging = false;
    dragStart = null;
    if (cropSelection && (cropSelection.w < 5 || cropSelection.h < 5)) {
      cropSelection = null;
    }
    renderPreview();
  });

  reviewContainer.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-row]');
    if (select) {
      const index = Number(select.dataset.row);
      if (parsedRows[index]) {
        parsedRows[index].driverId = select.value || null;
        parsedRows[index].skip = false;
        renderReviewTable();
        persistDraft();
      }
    }
    const checkbox = event.target.closest('input[data-skip]');
    if (checkbox) {
      const index = Number(checkbox.dataset.skip);
      if (parsedRows[index]) {
        parsedRows[index].skip = checkbox.checked;
        renderReviewTable();
        persistDraft();
      }
    }
  });

  saveButton.addEventListener('click', async () => {
    if (!parsedRows.length) return;
    const mode = modeSelect.value;
    if (mode === 'race' && hasResults) {
      showNotification(t('ocrImport.blockedRace'), 'warning');
      return;
    }
    if (mode === 'qualifying' && !hasResults) {
      showNotification(t('ocrImport.blockedQualifying'), 'warning');
      return;
    }
    const unresolved = parsedRows.filter((row) => !row.skip && !row.driverId);
    if (unresolved.length) {
      showNotification(t('ocrImport.unresolvedRows'), 'warning');
      return;
    }
    const selectedRows = parsedRows.filter((row) => !row.skip && row.driverId);
    if (!selectedRows.length) {
      showNotification(t('ocrImport.noValidRows'), 'warning');
      return;
    }
    const duplicates = new Set();
    const seen = new Set();
    selectedRows.forEach((row) => {
      if (seen.has(row.driverId)) {
        duplicates.add(row.driverId);
      }
      seen.add(row.driverId);
    });
    if (duplicates.size > 0) {
      showNotification(t('ocrImport.duplicateDrivers'), 'warning');
      return;
    }
    if (onSave) {
      const success = await onSave({
        mode,
        rows: selectedRows
      });
      if (success !== false) {
        clearDraft(draftKey);
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      }
    }
  });

  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });

  const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
  bsModal.show();

  updateGateWarning();
  loadDraft();

  return modal;
}
