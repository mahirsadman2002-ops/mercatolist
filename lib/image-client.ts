"use client";

/**
 * Client-side image preparation for uploads.
 *
 * The S3 pipeline only accepts JPEG/PNG/WebP/GIF (see lib/s3.ts), but users
 * hand us whatever their phone produces — most commonly HEIC from iPhones,
 * which many browsers report with an EMPTY mime type, so even a naive
 * `type.startsWith("image/")` check rejects it. This module makes uploads
 * seamless:
 *
 *  - HEIC/HEIF  -> converted to JPEG in the browser (heic2any, lazy-loaded
 *                  WASM — only fetched when a HEIC is actually encountered)
 *  - other formats the browser can decode (AVIF, BMP, ...) -> re-encoded to
 *    JPEG via canvas
 *  - oversized files -> progressively downscaled/recompressed to fit the
 *    byte limit instead of being rejected
 *  - already-acceptable files -> passed through untouched (fast path)
 */

const UPLOADABLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Extensions we recognize as images when the browser gives us no mime type
// (Windows and some Android browsers report "" for HEIC and other formats).
const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "heic", "heif",
  "avif", "bmp", "tif", "tiff",
]);

// Long-edge cap for recompression. 2560px is plenty for full-screen gallery
// display and keeps even DSLR photos comfortably under the byte limit.
const MAX_DIMENSION = 2560;

export class ImagePrepError extends Error {}

function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

/** Best-effort check that a file is an image at all (mime OR extension). */
export function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(fileExtension(file.name));
}

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif" || t === "image/heic-sequence" || t === "image/heif-sequence") {
    return true;
  }
  const ext = fileExtension(file.name);
  return (t === "" || t === "application/octet-stream") && (ext === "heic" || ext === "heif");
}

/** Decode any browser-decodable image blob. Throws if the codec is unsupported. */
async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(blob);
  } catch {
    // Older Safari lacks createImageBitmap(Blob) — fall back to <img>.
    const url = URL.createObjectURL(blob);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new ImagePrepError("Couldn't decode image"));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new ImagePrepError("Couldn't encode image"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Draw the image at the given scale and encode as JPEG. */
async function reencodeToJpeg(
  source: ImageBitmap | HTMLImageElement,
  scale: number,
  quality: number,
): Promise<Blob> {
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImagePrepError("Canvas unavailable");
  // White backdrop so transparent PNG regions don't turn black in JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return canvasToJpegBlob(canvas, quality);
}

/**
 * Re-encode a decodable image to JPEG under maxBytes, stepping down quality
 * first and dimensions second. Throws ImagePrepError only if even the
 * smallest attempt can't fit (practically unreachable for real photos).
 */
async function compressToFit(blob: Blob, maxBytes: number): Promise<Blob> {
  const source = await decodeImage(blob);
  try {
    const longEdge = Math.max(source.width, source.height);
    let scale = longEdge > MAX_DIMENSION ? MAX_DIMENSION / longEdge : 1;

    for (let attempt = 0; attempt < 6; attempt++) {
      // 0.85 → 0.7 on the first two passes, then shrink dimensions too.
      const quality = attempt === 0 ? 0.85 : 0.7;
      if (attempt >= 2) scale *= 0.75;
      const out = await reencodeToJpeg(source, scale, quality);
      if (out.size <= maxBytes) return out;
    }
    throw new ImagePrepError("Image is too large even after compression");
  } finally {
    if ("close" in source) source.close();
  }
}

type Heic2Any = (opts: {
  blob: Blob;
  toType?: string;
  quality?: number;
}) => Promise<Blob | Blob[]>;

// heic2any is a UMD build; depending on the bundler's ESM interop the callable
// can land on `.default`, `.default.default`, or the namespace itself. Resolve
// defensively so we never call a non-function (which would fail every HEIC).
function resolveHeic2Any(mod: unknown): Heic2Any {
  const candidates = [
    mod,
    (mod as { default?: unknown })?.default,
    (mod as { default?: { default?: unknown } })?.default?.default,
  ];
  const fn = candidates.find((c) => typeof c === "function");
  if (!fn) throw new ImagePrepError("HEIC converter failed to load");
  return fn as Heic2Any;
}

/** Convert a HEIC/HEIF file to a JPEG blob. */
async function heicToJpeg(file: File): Promise<Blob> {
  // First try the browser's own decoder — Safari (and iOS) decode HEIC
  // natively, which is faster and more reliable than the WASM path.
  try {
    return await compressToFit(file, Number.MAX_SAFE_INTEGER);
  } catch {
    // Chrome/Firefox can't decode HEIC natively — fall back to heic2any WASM.
  }

  try {
    const heic2any = resolveHeic2Any(await import("heic2any"));
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
    const blob = Array.isArray(out) ? out[0] : out;
    if (!blob || blob.size === 0) {
      throw new ImagePrepError("HEIC converter produced an empty image");
    }
    return blob;
  } catch (err) {
    // Surface the real reason to the console for diagnosis; keep the toast
    // user-friendly but include the underlying message when we have one.
    console.error("[image] HEIC conversion failed:", err);
    if (err instanceof ImagePrepError) throw err;
    const detail = err instanceof Error && err.message ? ` (${err.message})` : "";
    throw new ImagePrepError(
      `Couldn't convert ${file.name}${detail} — try exporting it as JPEG and re-uploading`,
    );
  }
}

/**
 * Make any user-supplied image uploadable: convert unsupported formats to
 * JPEG and compress anything over maxBytes. Returns a File whose type is
 * always in the S3 allowlist and whose size is always <= maxBytes.
 * Throws ImagePrepError with a user-friendly message otherwise.
 */
export async function prepareImageForUpload(
  file: File,
  maxBytes: number,
): Promise<File> {
  if (!looksLikeImage(file)) {
    throw new ImagePrepError(`${file.name} isn't an image`);
  }

  const renamed = (blob: Blob) =>
    new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });

  // Fast path: already an accepted type and within the size limit.
  if (UPLOADABLE_TYPES.has(file.type) && file.size <= maxBytes) {
    return file;
  }

  let working: Blob = file;
  if (isHeic(file)) {
    working = await heicToJpeg(file);
    if (working.size <= maxBytes) return renamed(working);
  }

  // Oversized GIFs lose animation here — a fair trade for "it just works".
  try {
    return renamed(await compressToFit(working, maxBytes));
  } catch (err) {
    if (err instanceof ImagePrepError) throw err;
    throw new ImagePrepError(
      `Couldn't process ${file.name} — your browser can't read this format. Try exporting it as JPEG or PNG.`,
    );
  }
}
