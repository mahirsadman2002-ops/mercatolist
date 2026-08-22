"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Globe, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const handleSave = async (status: "DRAFT" | "SCHEDULED" | "PUBLISHED") => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (status === "SCHEDULED" && !scheduledFor) {
      toast.error("Pick a date and time to schedule");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || null,
          featuredImage: featuredImage || null,
          category: category || null,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          status,
          scheduledFor: status === "SCHEDULED" && scheduledFor
            ? new Date(scheduledFor).toISOString()
            : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          status === "PUBLISHED"
            ? "Post published!"
            : status === "SCHEDULED"
              ? "Post scheduled — carousel email will arrive when it goes live"
              : "Draft saved!"
        );
        router.push("/admin/blog");
      } else {
        toast.error(data.error || "Failed to save post");
      }
    } catch {
      toast.error("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/blog"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold">New Blog Post</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave("DRAFT")} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-52"
            aria-label="Schedule date and time"
          />
          <Button variant="outline" onClick={() => handleSave("SCHEDULED")} disabled={saving}>
            <CalendarClock className="h-4 w-4 mr-2" /> Schedule
          </Button>
          <Button onClick={() => handleSave("PUBLISHED")} disabled={saving}>
            <Globe className="h-4 w-4 mr-2" /> Publish
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title..."
                className="text-lg"
              />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Guides" />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="nyc, business, tips" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post in Markdown..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="prose prose-sm max-w-none min-h-[400px] p-4 border rounded-md">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">Nothing to preview yet...</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Featured Image URL</Label>
              <Input value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Meta Title <span className="text-xs text-muted-foreground">({metaTitle.length}/60)</span></Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO title..." maxLength={60} />
            </div>
            <div>
              <Label>Meta Description <span className="text-xs text-muted-foreground">({metaDescription.length}/160)</span></Label>
              <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="SEO description..." rows={2} maxLength={160} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
