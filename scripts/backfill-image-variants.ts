/**
 * Backfill resized WebP variants (thumb/card/full) for existing listing photos
 * that predate the resize-at-upload pipeline. Idempotent: only touches Photo
 * rows still missing a cardUrl, and the variant S3 keys are deterministic, so
 * re-running just overwrites in place. Safe to stop and re-run.
 *
 * Self-contained (no `@/` alias) so it runs with plain tsx, mirroring the logic
 * in lib/image-variants.ts + lib/s3.ts. Keep the widths/quality in sync if the
 * production pipeline ever changes.
 *
 * Usage:
 *   npx tsx scripts/backfill-image-variants.ts            # DRY RUN — reports what it would process
 *   npx tsx scripts/backfill-image-variants.ts --confirm  # actually generates + writes
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CONFIRM = process.argv.includes("--confirm");
const BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION!;
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const VARIANTS = [
  { name: "thumb", width: 400 },
  { name: "card", width: 800 },
  { name: "full", width: 1600 },
] as const;
const WEBP_QUALITY = 80;

function keyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const ownHost = `${BUCKET}.s3.${REGION}.amazonaws.com`;
    if (u.hostname !== ownHost && u.hostname !== `s3.${REGION}.amazonaws.com`) return null;
    const key = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch {
    return null;
  }
}

function baseIdFromKey(key: string): string {
  const file = key.split("/").pop() || key;
  return file.replace(/\.[a-z0-9]+$/i, "");
}

function cdnUrl(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

async function generateVariants(originalKey: string) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: originalKey }));
  const original = Buffer.from(await res.Body!.transformToByteArray());
  const baseId = baseIdFromKey(originalKey);
  const out: Record<string, string> = {};
  for (const v of VARIANTS) {
    const buf = await sharp(original)
      .rotate()
      .resize(v.width, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    const key = `listings/variants/${baseId}/${v.name}.webp`;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    out[`${v.name}Url`] = cdnUrl(key);
  }
  return out as { thumbUrl: string; cardUrl: string; fullUrl: string };
}

async function main() {
  console.log(
    CONFIRM
      ? "⚠️  --confirm MODE — variants WILL be generated and written.\n"
      : "🔍 DRY RUN — nothing is written. Re-run with --confirm to execute.\n"
  );

  const photos = await prisma.photo.findMany({
    where: { cardUrl: null },
    select: { id: true, url: true },
    orderBy: { id: "asc" },
  });

  console.log(`Found ${photos.length} photo(s) without variants.\n`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const photo of photos) {
    const key = keyFromUrl(photo.url);
    if (!key || key.startsWith("listings/variants/")) {
      // External (e.g. Unsplash seed) or already a variant — nothing to do.
      skipped++;
      continue;
    }

    if (!CONFIRM) {
      console.log(`would process ${photo.id}  ${key}`);
      done++;
      continue;
    }

    try {
      const variants = await generateVariants(key);
      await prisma.photo.update({ where: { id: photo.id }, data: variants });
      done++;
      if (done % 20 === 0) console.log(`...${done} processed`);
    } catch (e) {
      failed++;
      console.error(`FAILED ${photo.id} (${key}):`, e instanceof Error ? e.message : e);
    }
  }

  console.log(
    `\nDone. processed=${done} skipped(external/variant)=${skipped} failed=${failed}`
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
