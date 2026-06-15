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
  return (
    <img
      src={imgUrl}
      alt={alt || "Driver"}
      className={className}
      style={{ width: size, height: size, objectFit: "cover" }}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = phUrl;
      }}
    />
  );
}
