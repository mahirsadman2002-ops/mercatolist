import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings | MercatoList",
  description: "Manage your MercatoList account and profile settings.",
};

export default function ProfileSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>
      <p className="text-muted-foreground">Profile settings form — coming soon</p>
    </div>
  );
}
