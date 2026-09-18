const placeholderStyle = "avataaars";
const placeholderSize = 200;

function getDriverPlaceholderUrl(
  seed,
  size = placeholderSize,
  style = placeholderStyle,
) {
  const safe = encodeURIComponent(String(seed || "driver").trim() || "driver");
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${safe}&size=${size}`;
}

export function DriverImage({
  src,
  seed,
  alt,
  className = "",
  size = 36,
  style = placeholderStyle,
}) {
  const phUrl = getDriverPlaceholderUrl(seed, placeholderSize, style);
  const imgUrl = src || phUrl;
  const imgSizeClass = {
    32: "w-8 h-8",
    36: "w-9 h-9",
    120: "w-30 h-30",
  }[size] || `w-${Math.round(size / 4)} h-${Math.round(size / 4)}`;

  return (
    <img
      src={imgUrl}
      alt={alt || "Driver"}
      className={`${className} ${imgSizeClass} object-cover rounded`}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = phUrl;
      }}
    />
  );
}
