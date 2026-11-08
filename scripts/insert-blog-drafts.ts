// Bulk-insert article drafts produced by the writing pipeline.
// Usage: npx tsx --env-file=.env.local scripts/insert-blog-drafts.ts <dir> <scheduleJson>
//   <dir>          directory of *.json draft files (see article brief for shape)
//   <scheduleJson> JSON map of slug → ISO datetime to propose as scheduledFor
// Inserts as DRAFT (never auto-publishes) with scheduledFor pre-filled so the
// admin can review each post and click "Schedule". Idempotent: skips slugs
// that already exist.
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/prisma";

async function main() {
  const dir = process.argv[2];
  const schedule: Record<string, string> = process.argv[3]
    ? JSON.parse(readFileSync(process.argv[3], "utf8"))
    : {};
  if (!dir) throw new Error("usage: insert-blog-drafts.ts <dir> [scheduleJson]");

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("No admin user found");

  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (!d.slug || !d.title || !d.content) {
      console.log(`SKIP ${f}: missing required fields`);
      continue;
    }
    const exists = await prisma.blogPost.findUnique({ where: { slug: d.slug } });
    if (exists) {
      console.log(`SKIP ${d.slug}: already exists (${exists.status})`);
      continue;
    }
    await prisma.blogPost.create({
      data: {
        title: d.title,
        slug: d.slug,
        content: d.content,
        excerpt: d.excerpt ?? null,
        metaTitle: d.metaTitle ?? null,
        metaDescription: d.metaDescription ?? null,
        category: d.category ?? null,
        tags: Array.isArray(d.tags) ? d.tags : [],
        status: "DRAFT",
        scheduledFor: schedule[d.slug] ? new Date(schedule[d.slug]) : null,
        carouselPoints: Array.isArray(d.carouselPoints) ? d.carouselPoints : undefined,
        authorId: admin.id,
      },
    });
    console.log(
      `INSERTED ${d.slug} (${d.content.split(/\s+/).length}w, proposed ${schedule[d.slug] ?? "no date"})`
    );
  }
}
main().finally(() => prisma.$disconnect());
