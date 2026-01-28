/**
 * Image helper utilities
 */

const PLACEHOLDER_STYLE = 'avataaars';
const PLACEHOLDER_SIZE = 200;

function escapeHtmlAttribute(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getDriverPlaceholderUrl(seed, size = PLACEHOLDER_SIZE, style = PLACEHOLDER_STYLE) {
  const normalizedSeed = String(seed || 'driver').trim() || 'driver';
  const safeSeed = encodeURIComponent(normalizedSeed);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${safeSeed}&size=${size}`;
}

export function getDriverImageHtml({
  src,
  seed,
  alt,
  className = '',
  size = 36,
  style = PLACEHOLDER_STYLE
} = {}) {
  const placeholderUrl = getDriverPlaceholderUrl(seed, PLACEHOLDER_SIZE, style);
  const imageUrl = src || placeholderUrl;
  const safeAlt = escapeHtmlAttribute(alt || 'Driver');
  const safeClassName = escapeHtmlAttribute(className);
  return `<img src="${imageUrl}" alt="${safeAlt}" class="${safeClassName}" ` +
    `style="width:${size}px;height:${size}px;object-fit:cover;" loading="lazy" decoding="async" ` +
    `onerror="this.onerror=null;this.src='${placeholderUrl}';">`;
}
