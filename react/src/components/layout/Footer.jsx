import { useTranslation } from "react-i18next";

export function Footer() {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentLang = i18n.language;

  return (
    <footer
      className="mt-5 p-4"
      style={{ backgroundColor: "var(--season-accent)" }}
      role="contentinfo"
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12 col-md-6 text-center text-md-start mb-2 mb-md-0">
            <div className="small">
              <div className="mb-1">
                <a
                  href="https://www.linkedin.com/in/lennoncarvalho/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white text-decoration-none"
                  aria-label={t("footer.linkedInAria")}
                >
                  {t("footer.createdBy")}
                </a>
                <span className="mx-2">{"|"}</span>
                <a
                  href="https://github.com/lennoncarvalho/karting-manager/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white text-decoration-none"
                  aria-label={t("footer.licenseAria")}
                >
                  {t("footer.license")}
                </a>
              </div>
              <div>{t("footer.copyright", { year: currentYear })}</div>
            </div>
          </div>

          <div className="col-12 col-md-6 text-center text-md-end">
            <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-3">
              <a
                href="https://github.com/lennoncarvalho/karting-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-decoration-none"
                aria-label={t("footer.githubAria")}
              >
                <i className="bi bi-github" style={{ fontSize: "1.5rem" }}></i>
              </a>
              <div
                className="d-flex align-items-center gap-2"
                role="group"
                aria-label={t("footer.selectLanguage")}
              >
                <span className="small me-1">{t("footer.selectLanguage")}</span>
                <button
                  type="button"
                  className={`btn btn-link text-white p-1 fs-5 ${currentLang === "pt-BR" ? "opacity-100" : "opacity-50"}`}
                  onClick={() => i18n.changeLanguage("pt-BR")}
                  aria-label={t("footer.languagePortuguese")}
                  aria-pressed={currentLang === "pt-BR"}
                >
                  🇧🇷
                </button>
                <button
                  type="button"
                  className={`btn btn-link text-white p-1 fs-5 ${currentLang === "en" ? "opacity-100" : "opacity-50"}`}
                  onClick={() => i18n.changeLanguage("en")}
                  aria-label={t("footer.languageEnglish")}
                  aria-pressed={currentLang === "en"}
                >
                  🇺🇸
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
