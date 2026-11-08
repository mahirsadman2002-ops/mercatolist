/**
 * One-off recovery: pull a hard-deleted listing (and its broker contact) out of
 * a Neon point-in-time branch, then clean the branch up. Reads NEON_API_KEY
 * from .env.local — never prints it.
 *
 * Usage:
 *   npx tsx scripts/recover-deleted-listing.ts 2026-07-25T12:00:00Z
 * (arg = restore point when the deleted listing was still live; default below)
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Pool } from "@neondatabase/serverless";

const API = "https://console.neon.tech/api/v2";
const KEY = process.env.NEON_API_KEY;
const ENDPOINT_HINT = "ep-tiny-fire-aiwp74aa"; // our production endpoint id
const RESTORE_TS = process.argv[2] || "2026-07-25T12:00:00Z";

async function neon(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let body: any;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) {
    throw new Error(`Neon API ${res.status} ${path}: ${JSON.stringify(body).slice(0, 400)}`);
  }
  return body;
}

async function main() {
  if (!KEY) {
    console.error("NEON_API_KEY is not set in .env.local — add it and re-run.");
    process.exit(1);
  }

  // 1. Find the project that owns our endpoint.
  const { projects } = await neon("/projects");
  console.log(`Found ${projects.length} project(s).`);
  let projectId = "";
  for (const pr of projects) {
    const { endpoints } = await neon(`/projects/${pr.id}/endpoints`);
    if (endpoints.some((e: any) => e.id === ENDPOINT_HINT || (e.host || "").includes(ENDPOINT_HINT))) {
      projectId = pr.id;
      console.log(`Matched project: ${pr.name} (${pr.id})`);
      console.log(`History retention: ${pr.history_retention_seconds}s (~${Math.round((pr.history_retention_seconds || 0) / 86400)} days)`);
      break;
    }
  }
  if (!projectId) {
    // Fall back to the only project if there's exactly one.
    if (projects.length === 1) { projectId = projects[0].id; console.log("Using the only project."); }
    else throw new Error("Couldn't match the endpoint to a project. Projects: " + projects.map((p: any) => p.name).join(", "));
  }

  // Default/primary branch (the current data lives here; we branch history from it).
  const { branches } = await neon(`/projects/${projectId}/branches`);
  const parent = branches.find((b: any) => b.default || b.primary) || branches[0];
  console.log(`Parent branch: ${parent.name} (${parent.id})`);

  // 2. Create a temporary branch from the restore timestamp.
  console.log(`Creating recovery branch at ${RESTORE_TS} ...`);
  let created: any;
  try {
    created = await neon(`/projects/${projectId}/branches`, {
      method: "POST",
      body: JSON.stringify({
        branch: { name: `recover-65-${Date.now()}`, parent_id: parent.id, parent_timestamp: RESTORE_TS },
        endpoints: [{ type: "read_write" }],
      }),
    });
  } catch (e) {
    console.error("\nBranch creation failed — this usually means the restore timestamp is OUTSIDE your history retention window (the data is no longer recoverable), or the timestamp is malformed.\n");
    throw e;
  }
  const branchId = created.branch.id;
  console.log(`Recovery branch: ${branchId}`);

  try {
    // 3. Connection string for the recovery branch.
    const dbName = "neondb";
    const roleName = created.branch?.owner_name ||
      (await neon(`/projects/${projectId}/branches/${branchId}/roles`)).roles?.[0]?.name ||
      "neondb_owner";
    const conn = await neon(
      `/projects/${projectId}/connection_uri?branch_id=${branchId}&database_name=${dbName}&role_name=${encodeURIComponent(roleName)}&pooled=true`
    );
    const uri = conn.uri;

    // 4. Query the recovered snapshot for the deleted liquor store.
    const pool = new Pool({ connectionString: uri });
    const { rows } = await pool.query(
      `SELECT l."listingNumber", l."title", l."slug", l."status", l."category",
              l."neighborhood", l."borough", l."address", l."zipCode",
              l."askingPrice", l."annualRevenue", l."cashFlowSDE", l."description",
              l."createdAt",
              u."name" AS broker_name, u."email" AS broker_email, u."phone" AS broker_phone,
              u."brokerageName", u."brokeragePhone", u."role" AS broker_role
       FROM "BusinessListing" l
       LEFT JOIN "User" u ON u."id" = l."listedById"
       WHERE l."listingNumber" = 65
          OR l."category" ILIKE '%liquor%'
          OR l."neighborhood" ILIKE '%richmond%'
          OR l."askingPrice" = 95000
       ORDER BY l."listingNumber"`
    );
    await pool.end();

    console.log(`\n===== RECOVERED ${rows.length} matching listing(s) =====`);
    for (const r of rows) {
      console.log(JSON.stringify(r, null, 2));
      console.log("-----");
    }
  } finally {
    // 5. Always clean up the temporary branch.
    console.log(`\nDeleting recovery branch ${branchId} ...`);
    await neon(`/projects/${projectId}/branches/${branchId}`, { method: "DELETE" }).catch((e) =>
      console.error("Cleanup failed (delete the branch manually in the Neon console):", e.message)
    );
    console.log("Done.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
