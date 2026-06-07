/**
 * Reads an image File from disk, downscales it to fit within `maxDim` (longest
 * edge) and returns a compressed data URL. Downscaling keeps the result small
 * enough to live in localStorage alongside the other preferences.
 */
export async function readImageFile(
  file: File,
  maxDim: number,
  quality = 0.85,
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, width, height);

  // PNG keeps transparency for avatars; JPEG is far smaller for photos.
  const isPng = file.type === "image/png";
  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", quality);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to decode image"));
    image.src = src;
  });
}
