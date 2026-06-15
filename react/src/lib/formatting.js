import i18next from "i18next";

const dateTimeFormatterCache = new Map();

function hasTimezoneSuffix(value) {
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
}

function hasTime(value) {
  return /[T ]\d{2}:\d{2}/.test(value);
}

function parseDateValue(value, options = {}) {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (options.dateOnlyAsLocal && dateOnlyPattern.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    if ([year, month, day].some(Number.isNaN)) return null;
    return new Date(year, month - 1, day);
  }
  let normalized = trimmed;
  if (
    options.assumeUtcWhenNoTz &&
    hasTime(trimmed) &&
    !hasTimezoneSuffix(trimmed)
  ) {
    normalized = trimmed.includes("T")
      ? `${trimmed}Z`
      : trimmed.replace(" ", "T") + "Z";
  }
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDisplayDate(date) {
  const d = parseDateValue(date, { dateOnlyAsLocal: true });
  return formatWithParts(d, false);
}

export function formatDateTime(datetime) {
  const d = parseDateValue(datetime, { assumeUtcWhenNoTz: true });
  return formatWithParts(d, true);
}


export function formatDateTimeForInput(datetime) {
  const d = parseDateValue(datetime, { assumeUtcWhenNoTz: true });
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}


function formatWithParts(date, includeTime) {
  if (!date) return "";
  return formatWithPartsCore(date, includeTime, i18next.t.bind(i18next));
}

function formatWithPartsCore(date, includeTime, t) {
  if (!date) return "";
  const locale = t("app.title") ? i18next.language || "pt-BR" : "pt-BR";
  const key = `${locale}-${includeTime ? "datetime" : "date"}`;
  if (!dateTimeFormatterCache.has(key)) {
    const opts = { day: "2-digit", month: "short", year: "numeric" };
    if (includeTime) {
      opts.hour = "2-digit";
      opts.minute = "2-digit";
      opts.hourCycle = "h23";
    }
    dateTimeFormatterCache.set(key, new Intl.DateTimeFormat(locale, opts));
  }
  const formatter = dateTimeFormatterCache.get(key);
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach((p) => {
    if (p.type !== "literal") map[p.type] = p.value;
  });
  const day = map.day || "";
  let month = map.month || "";
  const year = map.year || "";
  if (!day || !month || !year) return formatter.format(date).replace(",", "");
  if (locale === "pt-BR" && month) {
    month = month.replace(".", "");
    month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  }
  if (!includeTime) return `${day} ${month} ${year}`;
  const hour = map.hour || "00";
  const minute = map.minute || "00";
  const suffix = locale === "pt-BR" ? "h" : "";
  return `${day} ${month} ${year} ${hour}:${minute}${suffix}`;
}
