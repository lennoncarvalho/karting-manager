import en from "./resources/en.json";
import ptBR from "./resources/pt-BR.json";

const i18n = {
  defaultLocale: "pt-BR",
  fallbackLocale: "en",
  locales: ["en", "pt-BR"],
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBR },
  },
};

export default i18n;
