import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';

import { environment } from '../../environments/environment';

const AZURE_DOC_API_VERSION = '2024-11-30';

export interface OcrResult {
  text: string;
  tables: unknown[];
  provider: 'azure-document-intelligence' | 'tesseract';
  fallbackUsed: boolean;
  error?: unknown;
}

/**
 * OCR provider — Azure Document Intelligence primary + Tesseract.js
 * (`por`) fallback. Ported from `frontend/src/services/ocr.js`.
 */
@Injectable({ providedIn: 'root' })
export class OcrService {
  hasAzureConfig(): boolean {
    return this.isTruthy(environment.azureVisionEndpoint) && this.isTruthy(environment.azureVisionKey);
  }

  async run(imageFile: Blob): Promise<OcrResult> {
    if (this.hasAzureConfig()) {
      try {
        const result = await this.runAzure(imageFile);
        return { ...result, provider: 'azure-document-intelligence', fallbackUsed: false };
      } catch (error) {
        Sentry.captureException(error);
        const result = await this.runTesseract(imageFile);
        return { ...result, provider: 'tesseract', fallbackUsed: true, error };
      }
    }
    const result = await this.runTesseract(imageFile);
    return { ...result, provider: 'tesseract', fallbackUsed: false };
  }

  private isTruthy(v: string | undefined | null): boolean {
    if (!v) return false;
    const n = String(v).trim().toLowerCase();
    return n !== '' && n !== 'null' && n !== 'undefined' && n !== 'none';
  }

  private buildAzureUrl(): string {
    const base = environment.azureVisionEndpoint.replace(/\/+$/, '');
    return `${base}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${AZURE_DOC_API_VERSION}`;
  }

  private async runAzure(imageFile: Blob): Promise<Pick<OcrResult, 'text' | 'tables'>> {
    const response = await fetch(this.buildAzureUrl(), {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': environment.azureVisionKey,
        'Content-Type': imageFile.type || 'application/octet-stream',
      },
      body: imageFile,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Azure Document Intelligence request failed.');
    }
    const operationLocation = response.headers.get('operation-location');
    if (!operationLocation) throw new Error('Azure Document Intelligence missing operation URL.');

    for (let attempts = 0; attempts < 15; attempts += 1) {
      const poll = await fetch(operationLocation, {
        headers: { 'Ocp-Apim-Subscription-Key': environment.azureVisionKey },
      });
      if (!poll.ok) {
        const message = await poll.text();
        throw new Error(message || 'Azure Document Intelligence polling failed.');
      }
      const payload = await poll.json();
      if (payload.status === 'succeeded') {
        return {
          text: payload.analyzeResult?.content ?? '',
          tables: payload.analyzeResult?.tables ?? [],
        };
      }
      if (payload.status === 'failed') throw new Error('Azure Document Intelligence analysis failed.');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error('Azure Document Intelligence timed out.');
  }

  private async runTesseract(imageFile: Blob): Promise<Pick<OcrResult, 'text' | 'tables'>> {
    const tesseract = await import('tesseract.js');
    const createWorker = tesseract.createWorker;
    const worker = await createWorker('por');
    if (worker.setParameters) {
      await worker.setParameters({
        tessedit_pageseg_mode: '6' as unknown as never,
        preserve_interword_spaces: '1',
      });
    }
    const { data } = await worker.recognize(imageFile);
    await worker.terminate();
    return { text: data?.text ?? '', tables: [] };
  }
}
