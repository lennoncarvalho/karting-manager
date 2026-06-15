const AZURE_VER = "2024-11-30";
// Azure OCR config comes from `react/.env`. When either value is missing,
// `hasConfig()` returns false and OCR transparently falls back to Tesseract.
const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_ENDPOINT;
const AZURE_KEY = import.meta.env.VITE_AZURE_KEY;

function hasConfig() {
  return Boolean(AZURE_ENDPOINT && AZURE_KEY);
}

function azureUrl() {
  const base = AZURE_ENDPOINT.replace(/\/+$/, "");
  return `${base}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${AZURE_VER}`;
}

let tesseractWorker = null;

async function loadTesseract() {
  if (tesseractWorker) return tesseractWorker;
  const mod = await import("tesseract.js");
  tesseractWorker = mod;
  return tesseractWorker;
}

export async function runOcr(imageFile) {
  if (hasConfig()) {
    try {
      const result = await runAzure(imageFile);
      return { ...result, fallbackUsed: false };
    } catch (err) {
      console.error("Azure OCR failed, falling back to Tesseract", err);
      const result = await runTesseract(imageFile);
      return { ...result, fallbackUsed: true };
    }
  }
  return runTesseract(imageFile);
}

async function runAzure(file) {
  const resp = await fetch(azureUrl(), {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_KEY,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(msg || "Azure OCR failed");
  }
  const opLoc = resp.headers.get("operation-location");
  if (!opLoc) throw new Error("Azure OCR missing operation URL");
  let attempts = 0;
  while (attempts < 15) {
    const poll = await fetch(opLoc, {
      headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY },
    });
    if (!poll.ok) {
      const msg = await poll.text();
      throw new Error(msg || "Azure poll failed");
    }
    const result = await poll.json();
    if (result.status === "succeeded") {
      return {
        text: result.analyzeResult?.content || "",
        tables: result.analyzeResult?.tables || [],
      };
    }
    if (result.status === "failed") {
      throw new Error("Azure analysis failed");
    }
    attempts++;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Azure OCR timed out");
}

async function runTesseract(imageFile) {
  const mod = await loadTesseract();
  if (!mod) throw new Error("Tesseract failed to load");
  const Tesseract = mod.default || mod;
  const worker = await Tesseract.createWorker("por");
  await worker.setParameters({
    tessedit_pageseg_mode: "6",
    preserve_interword_spaces: "1",
  });
  const { data } = await worker.recognize(imageFile);
  await worker.terminate();
  return {
    text: data?.text || "",
    tables: [],
  };
}
