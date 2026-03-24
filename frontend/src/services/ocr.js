/**
 * OCR provider utilities (Azure Document Intelligence + Tesseract.js fallback).
 */

import { AZURE_VISION_ENDPOINT, AZURE_VISION_KEY } from '../config.js';

const AZURE_DOC_API_VERSION = '2024-11-30';

function isTruthyConfig(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized !== 'null' && normalized !== 'undefined' && normalized !== 'none';
}

function hasAzureConfig() {
  return isTruthyConfig(AZURE_VISION_ENDPOINT) && isTruthyConfig(AZURE_VISION_KEY);
}

function buildAzureUrl() {
  const base = AZURE_VISION_ENDPOINT.replace(/\/+$/, '');
  return `${base}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${AZURE_DOC_API_VERSION}`;
}

function extractAzureText(payload) {
  if (!payload || !payload.analyzeResult) return '';
  return payload.analyzeResult.content || '';
}

async function runAzureOcr(imageFile) {
  const response = await fetch(buildAzureUrl(), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
      'Content-Type': imageFile.type || 'application/octet-stream'
    },
    body: imageFile
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Azure Document Intelligence request failed.');
  }
  const operationLocation = response.headers.get('operation-location');
  if (!operationLocation) {
    throw new Error('Azure Document Intelligence missing operation URL.');
  }
  let attempts = 0;
  while (attempts < 15) {
    const poll = await fetch(operationLocation, {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY
      }
    });
    if (!poll.ok) {
      const message = await poll.text();
      throw new Error(message || 'Azure Document Intelligence polling failed.');
    }
    const payload = await poll.json();
    if (payload.status === 'succeeded') {
      return {
        text: extractAzureText(payload),
        tables: payload.analyzeResult ? payload.analyzeResult.tables || [] : []
      };
    }
    if (payload.status === 'failed') {
      throw new Error('Azure Document Intelligence analysis failed.');
    }
    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Azure Document Intelligence timed out.');
}

let tesseractPromise = null;

async function loadTesseract() {
  if (!tesseractPromise) {
    tesseractPromise = import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js');
  }
  return tesseractPromise;
}

async function runTesseractOcr(imageFile) {
  const module = await loadTesseract();
  const tesseract = module && module.default ? module.default : module;
  const createWorker = tesseract && tesseract.createWorker ? tesseract.createWorker : null;
  if (!createWorker) {
    throw new Error('Tesseract failed to load. Missing createWorker.');
  }
  let worker;
  if (createWorker.length > 0) {
    worker = await createWorker('por');
  } else {
    worker = await createWorker();
    if (worker.loadLanguage) {
      await worker.loadLanguage('por');
    }
    if (worker.initialize) {
      await worker.initialize('por');
    }
  }
  if (worker.setParameters) {
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1'
    });
  }
  const { data } = await worker.recognize(imageFile);
  await worker.terminate();
  return { text: data && data.text ? data.text : '', tables: [] };
}

export async function runOcr(imageFile) {
  if (hasAzureConfig()) {
    try {
      const result = await runAzureOcr(imageFile);
      return { ...result, provider: 'azure-document-intelligence', fallbackUsed: false };
    } catch (error) {
      const result = await runTesseractOcr(imageFile);
      return { ...result, provider: 'tesseract', fallbackUsed: true, error };
    }
  }
  const result = await runTesseractOcr(imageFile);
  return { ...result, provider: 'tesseract', fallbackUsed: false };
}

export { hasAzureConfig };
