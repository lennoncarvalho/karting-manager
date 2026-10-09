const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export class UnsupportedImageError extends Error {}

async function decodeImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const { isHeic, heicTo } = await import("heic-to");
    if (!(await isHeic(file))) {
      throw new UnsupportedImageError("Unsupported image format");
    }
    const jpeg = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.9,
    });
    return createImageBitmap(jpeg, { imageOrientation: "from-image" });
  }
}

export async function resizeImage(
  file,
  { maxSize = 256, quality = 0.82 } = {},
) {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new UnsupportedImageError("Image is too large (max 25 MB)");
  }

  const bitmap = await decodeImage(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("JPEG encoding failed")),
      "image/jpeg",
      quality,
    );
  });
}