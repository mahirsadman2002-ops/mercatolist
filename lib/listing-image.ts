// Picks the right pre-resized WebP variant for a render context, always falling
// back to the original `url` when a variant is absent (external photos, or rows
// not yet backfilled). Keeps all the "which size goes where" logic in one place.

export type PhotoLike = {
  url: string;
  thumbUrl?: string | null;
  cardUrl?: string | null;
  fullUrl?: string | null;
};

export type PhotoSize = "thumb" | "card" | "full";

export function pickPhotoUrl(photo: PhotoLike, size: PhotoSize): string {
  switch (size) {
    case "thumb":
      return photo.thumbUrl || photo.cardUrl || photo.url;
    case "card":
      return photo.cardUrl || photo.fullUrl || photo.url;
    case "full":
      return photo.fullUrl || photo.cardUrl || photo.url;
    default:
      return photo.url;
  }
}
