import { useTranslation } from "react-i18next";

/**
 * Renders a race datetime as `DD MMM HHhMMm` (e.g. `16 Jun 13h15m`),
 * using the month abbreviation in the currently selected i18n language
 * (e.g. "mai" for pt-BR, "May" for en).
 */
export function RaceDateTime({ value, fallback = "-" }) {
  const { i18n } = useTranslation();
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;

  const locale = i18n.language || "pt-BR";
  const day = String(d.getDate()).padStart(2, "0");
  let month = d
    .toLocaleString(locale, { month: "short" })
    .replace(/\.$/, "");
  // Capitalize first letter (pt-BR returns lowercase "mai", "jun", ...).
  if (month) month = month.charAt(0).toUpperCase() + month.slice(1);
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${hour}h${min}m`;
}
