import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Visible FAQ accordion + matching FAQPage JSON-LD, in one component so the
 * structured data can never drift from what's on the page (Google requires
 * FAQ markup to reflect visible content). Server-renderable — <details> gives
 * us the accordion with zero client JS.
 */
export function FaqSection({ title, items }: { title?: string; items: FaqItem[] }) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section className="mb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, String.fromCharCode(92) + "u003c"),
        }}
        suppressHydrationWarning
      />
      <h2 className="mb-6 font-heading text-2xl font-bold sm:text-3xl">
        {title ?? "Frequently asked questions"}
      </h2>
      <div className="divide-y rounded-xl border">
        {items.map((f) => (
          <details key={f.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {f.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
