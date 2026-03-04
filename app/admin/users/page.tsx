import type { Metadata } from "next";

// Components needed: UserManager
// import { UserManager } from "@/components/admin/UserManager";

export const metadata: Metadata = {
  title: "Manage Users | Admin | MercatoList",
  description: "Admin user management — view, edit roles, and manage user accounts.",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Users</h1>
      <p className="text-muted-foreground">User management — coming soon</p>
    </div>
  );
}
