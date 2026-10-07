import { useTranslation } from "react-i18next";

const formatterCache = new Map();

export function RaceDateTime({ value, fallback = "-" }) {
  const { i18n } = useTranslation();
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;

  const locale = i18n.language || "pt-BR";
  if (!formatterCache.has(locale)) {
    formatterCache.set(
      locale,
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
    );
  }
  const parts = formatterCache.get(locale).formatToParts(d);
  const map = {};
  parts.forEach((p) => {
    if (p.type !== "literal") map[p.type] = p.value;
  });
  let month = (map.month || "").replace(/\.$/, "");
  if (locale === "pt-BR") month = month.charAt(0).toUpperCase() + month.slice(1);
  return `${map.day} ${month} ${map.hour}:${map.minute}`;
}
