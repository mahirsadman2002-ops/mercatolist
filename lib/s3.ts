import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Exact-MIME allowlist → fixed extension. Never derive the key extension from
// user input (blocks image/svg+xml stored-XSS and path tricks).
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ALLOWED_UPLOAD_TYPES = Object.keys(ALLOWED_MIME);
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FOLDERS = new Set(["listings", "avatars"]);

export async function generatePresignedUploadUrl(
  fileType: string,
  folder: string = "listings",
  contentLength?: number
) {
  const fileExtension = ALLOWED_MIME[fileType];
  if (!fileExtension) {
    throw new Error("Unsupported file type");
  }

  // Whitelist the folder so callers can't write outside known prefixes.
  const safeFolder = ALLOWED_FOLDERS.has(folder) ? folder : "listings";
  const key = `${safeFolder}/${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    ContentType: fileType,
    // Binding ContentLength into the signature forces S3 to reject any upload
    // whose size differs — so the client can't smuggle a huge object past the
    // server-side size check.
    ...(contentLength ? { ContentLength: contentLength } : {}),
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 600 });

  return { url, key };
}

export function getCdnUrl(key: string): string {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
