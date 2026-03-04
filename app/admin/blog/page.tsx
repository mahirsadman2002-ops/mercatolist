import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Blog | Admin | MercatoList",
  description: "Create, edit, and manage blog posts.",
};

export default function AdminBlogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Blog</h1>
      <p className="text-muted-foreground">Blog post management — coming soon</p>
    </div>
  );
}
