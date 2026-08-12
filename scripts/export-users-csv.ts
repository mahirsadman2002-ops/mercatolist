// Export all users to a Mailchimp-ready CSV.
import { prisma } from "../lib/prisma";
import { writeFileSync } from "fs";

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

async function main() {
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    select: {
      email: true, name: true, role: true, isManaged: true,
      claimedAt: true, emailVerified: true, createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const rows = [
    "Email Address,First Name,Last Name,Role,Account Source,Email Verified,Signup Date",
  ];
  for (const u of users) {
    const parts = (u.name || "").trim().split(/\s+/);
    const first = parts[0] || "";
    const last = parts.slice(1).join(" ");
    rows.push([
      csvEscape(u.email),
      csvEscape(first),
      csvEscape(last),
      u.role,
      u.isManaged ? (u.claimedAt ? "Imported (claimed)" : "Imported (unclaimed)") : "Self signup",
      u.emailVerified ? "Yes" : "No",
      u.createdAt.toISOString().slice(0, 10),
    ].join(","));
  }
  const out = process.env.HOME + `/Desktop/mercatolist-users-${new Date().toISOString().slice(0, 10)}.csv`;
  writeFileSync(out, rows.join("\n") + "\n");
  console.log(`${users.length} users → ${out}`);
  const managed = users.filter(u => u.isManaged && !u.claimedAt).length;
  const unverified = users.filter(u => !u.isManaged && !u.emailVerified).length;
  console.log(`  imported-unclaimed: ${managed}, self-signup unverified: ${unverified}`);
}
main().finally(() => prisma.$disconnect());
