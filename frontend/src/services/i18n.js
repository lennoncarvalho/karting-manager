const STORAGE_KEY = 'language';
const SUPPORTED_LANGUAGES = ['en', 'pt-BR'];
const DEFAULT_LANGUAGE = 'pt-BR';
const listeners = new Set();

function normalizeLanguage(code) {
  if (!code) {
    return null;
  }
  if (SUPPORTED_LANGUAGES.includes(code)) {
    return code;
  }
  if (code.startsWith('pt')) {
    return 'pt-BR';
  }
  if (code.startsWith('en')) {
    return 'en';
  }
  return null;
}

function getStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    return null;
  }
}

function setDocumentLanguage(language) {
  if (typeof document === 'undefined' || !document.documentElement) {
    return;
  }
  document.documentElement.lang = language;
}

export async function initI18n() {
  if (!window.i18next) {
    console.warn('i18next not available');
    return;
  }
  const storedLanguage = getStoredLanguage();
  const initialLanguage = storedLanguage || DEFAULT_LANGUAGE;

  if (window.i18nextHttpBackend) {
    window.i18next.use(window.i18nextHttpBackend);
  }

  await window.i18next.init({
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    backend: {
      loadPath: 'src/translations/{{lng}}.json'
    },
    interpolation: { escapeValue: false }
  });

  setDocumentLanguage(window.i18next.language);
  const title = window.i18next.t('app.title');
  if (title) {
    document.title = title;
  }
}

export function t(key, options = {}) {
  if (window.i18next && typeof window.i18next.t === 'function') {
    return window.i18next.t(key, options);
  }
  return key;
}

export function getCurrentLanguage() {
  if (window.i18next) {
    return window.i18next.language || DEFAULT_LANGUAGE;
  }
  return DEFAULT_LANGUAGE;
}

export async function changeLanguage(language) {
  if (!window.i18next) {
    return;
  }
  const normalized = normalizeLanguage(language) || DEFAULT_LANGUAGE;
  if (window.i18next.language === normalized) {
    return;
  }
  await window.i18next.changeLanguage(normalized);
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch (error) {
    // Ignore storage errors.
  }
  setDocumentLanguage(normalized);
  const title = window.i18next.t('app.title');
  if (title) {
    document.title = title;
  }
  listeners.forEach((listener) => listener(normalized));
}

export function onLanguageChanged(callback) {
  if (typeof callback !== 'function') {
    return () => {};
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}
