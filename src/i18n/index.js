import i18n from "./config";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const STORAGE_KEY = "language";

function normalizeLanguage(code) {
  if (!code) return null;
  if (i18n.locales.includes(code)) return code;
  if (code.startsWith("pt")) return "pt-BR";
  if (code.startsWith("en")) return "en";
  return null;
}

function getStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function initI18n() {
  const storedLang = getStoredLanguage() || i18n.defaultLocale;
  await i18next.use(initReactI18next).init({
    lng: storedLang,
    fallbackLng: i18n.fallbackLocale,
    supportedLngs: i18n.locales,
    resources: i18n.resources,
    interpolation: { escapeValue: false },
  });
  if (typeof document !== "undefined") {
    document.documentElement.lang = i18next.language;
  }
}

export { getStoredLanguage, normalizeLanguage };
