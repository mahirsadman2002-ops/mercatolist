import { MetadataRoute } from "next";

// Disallowed paths are the same across all crawlers: user dashboard,
// admin tooling, and the API surface. The public marketplace + SEO
// pages + blog are open to everyone (incl. AI agents).
const DISALLOWED = ["/dashboard/", "/admin/", "/api/"];

// AI / LLM crawlers we explicitly want to encourage. Listing them here
// (rather than relying on the wildcard) is a clearer signal of intent and
// lets us tweak access per-agent later without disturbing search engines.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI training crawler
  "OAI-SearchBot", // OpenAI SearchGPT
  "ChatGPT-User", // ChatGPT live browsing
  "ClaudeBot", // Anthropic training crawler
  "Claude-SearchBot", // Claude search results
  "Claude-User", // Claude live browsing
  "anthropic-ai", // Legacy Anthropic UA
  "PerplexityBot", // Perplexity index crawler
  "Perplexity-User", // Perplexity live fetch
  "Google-Extended", // Google Gemini training opt-in
  "GoogleOther", // Google research crawlers
  "Applebot-Extended", // Apple Intelligence
  "Meta-ExternalAgent", // Meta AI / LLaMA crawl
  "Bytespider", // ByteDance / Doubao
  "DuckAssistBot", // DuckDuckGo AI assist
  "CCBot", // Common Crawl (feeds most open LLMs)
  "cohere-ai", // Cohere
  "Diffbot", // Diffbot knowledge graph
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOWED,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
