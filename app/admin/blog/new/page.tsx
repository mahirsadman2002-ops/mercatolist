import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Blog Post | Admin | MercatoList",
  description: "Create a new blog post.",
};

export default function NewBlogPostPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">New Blog Post</h1>
      <p className="text-muted-foreground">Blog post editor — coming soon</p>
    </div>
  );
}
