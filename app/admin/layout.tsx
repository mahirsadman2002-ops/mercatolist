import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

// Server-side gate for every /admin page. The middleware only checks that a
// session cookie exists and the shell is a client component, so without this
// the server-rendered children (e.g. the import token on /admin/import) were
// sent to anyone. The role is read from the database, never from the token.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || user.role !== "ADMIN") notFound();

  return <AdminShell>{children}</AdminShell>;
}
