import sharp from "sharp";
import { getObjectBuffer, uploadWebpVariant, keyFromCdnUrl } from "@/lib/s3";

// Resize-at-upload pipeline. We generate a small set of fixed-width WebP
// variants from each original and serve those directly from S3 — never through
// Vercel's image optimizer (which was the source of the transformation
// overage). Widths are chosen for where each variant is actually shown:
//   thumb  400px — dashboard/inbox/collection thumbnails, gallery filmstrip
//   card   800px — browse-grid cards (the highest-volume surface)
//   full  1600px — detail hero + lightbox
export const LISTING_VARIANTS = [
  { name: "thumb", width: 400 },
  { name: "card", width: 800 },
  { name: "full", width: 1600 },
] as const;

export const AVATAR_WIDTH = 200;
const WEBP_QUALITY = 80;

export type ListingVariantUrls = {
  thumbUrl: string;
  cardUrl: string;
  fullUrl: string;
};

/** Where a given original's variants live. Deterministic → idempotent. */
function variantKey(baseId: string, name: string): string {
  return `listings/variants/${baseId}/${name}.webp`;
}

/**
 * A stable id for the variant folder, derived from the original key so the same
 * original always maps to the same variant keys (re-running the backfill just
 * overwrites in place). Strips folder + extension: "listings/abc.jpg" → "abc".
 */
function baseIdFromKey(key: string): string {
  const file = key.split("/").pop() || key;
  return file.replace(/\.[a-z0-9]+$/i, "");
}

async function resizeWebp(src: Buffer, width: number): Promise<Buffer> {
  return sharp(src)
    .rotate() // honor EXIF orientation before we drop the metadata
    .resize(width, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/**
 * Build the three listing variants for an original S3 object. Best-effort:
 * returns null on any failure (missing object, non-image bytes, S3 error) so
 * callers fall back to the original URL — variants are an optimization, never a
 * correctness requirement.
 *
 * `keyOrUrl` may be a raw S3 key or a stored public URL; external URLs (not in
 * our bucket) return null and are skipped.
 */
export async function generateListingVariants(
  keyOrUrl: string
): Promise<ListingVariantUrls | null> {
  const key = keyOrUrl.startsWith("http") ? keyFromCdnUrl(keyOrUrl) : keyOrUrl;
  if (!key) return null;
  try {
    const original = await getObjectBuffer(key);
    const baseId = baseIdFromKey(key);
    const [thumbUrl, cardUrl, fullUrl] = await Promise.all(
      LISTING_VARIANTS.map(async (v) => {
        const buf = await resizeWebp(original, v.width);
        return uploadWebpVariant(variantKey(baseId, v.name), buf);
      })
    );
    return { thumbUrl, cardUrl, fullUrl };
  } catch (e) {
    console.error("[image-variants] listing variant generation failed for", key, e);
    return null;
  }
}

/**
 * Build a single small WebP for an avatar. Avatars are only ever displayed at
 * small sizes, so one 200px variant is enough. Returns null on failure.
 */
export async function generateAvatarVariant(
  keyOrUrl: string
): Promise<string | null> {
  const key = keyOrUrl.startsWith("http") ? keyFromCdnUrl(keyOrUrl) : keyOrUrl;
  if (!key) return null;
  try {
    const original = await getObjectBuffer(key);
    const baseId = baseIdFromKey(key);
    const buf = await resizeWebp(original, AVATAR_WIDTH);
    return uploadWebpVariant(`avatars/variants/${baseId}.webp`, buf);
  } catch (e) {
    console.error("[image-variants] avatar variant generation failed for", key, e);
    return null;
  }
}
