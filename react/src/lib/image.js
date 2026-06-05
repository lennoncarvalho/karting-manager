const placeholderStyle = "avataaars";
const placeholderSize = 200;

function escapeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getDriverPlaceholderUrl(
  seed,
  size = placeholderSize,
  style = placeholderStyle,
) {
  const safe = encodeURIComponent(String(seed || "driver").trim() || "driver");
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${safe}&size=${size}`;
}

export function getDriverImageHtml({
  src,
  seed,
  alt,
  className = "",
  size = 36,
  style = placeholderStyle,
}) {
  const phUrl = getDriverPlaceholderUrl(seed, placeholderSize, style);
  const imgUrl = src || phUrl;
  const safeAlt = escapeAttr(alt || "Driver");
  const safeClass = escapeAttr(className);
  return `<img src="${imgUrl}" alt="${safeAlt}" class="${safeClass}" style="width:${size}px;height:${size}px;object-fit:cover;" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${phUrl}';">`;
}
