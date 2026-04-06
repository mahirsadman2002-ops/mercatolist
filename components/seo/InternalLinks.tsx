import Link from "next/link";
import { BOROUGHS, BUSINESS_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

const TOP_CATEGORIES = [
  "Restaurants",
  "Bars & Nightclubs",
  "Cafes & Coffee Shops",
  "Retail Stores",
  "Laundromats & Dry Cleaners",
  "Salons & Barbershops",
  "Delis & Grocery Stores",
  "Convenience Stores",
  "Gyms & Fitness Studios",
  "Liquor Stores",
];

interface InternalLinksProps {
  currentBorough?: string;
  currentCategory?: string;
  currentNeighborhood?: string;
}

export function InternalLinks({
  currentBorough,
  currentCategory,
  currentNeighborhood,
}: InternalLinksProps) {
  return (
    <section className="border-t pt-12 mt-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Browse by Borough */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Browse by Borough
          </h3>
          <ul className="space-y-1.5">
            {BOROUGHS.map((b) => {
              const slug = b.label.toLowerCase().replace(/\s+/g, "-");
              if (slug === currentBorough) return null;
              return (
                <li key={b.value}>
                  <Link
                    href={`/boroughs/${slug}`}
                    className="text-sm text-foreground/80 hover:text-primary transition-colors"
                  >
                    Businesses in {b.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Popular Categories */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Popular Categories
          </h3>
          <ul className="space-y-1.5">
            {TOP_CATEGORIES.map((cat) => {
              const slug = slugify(cat);
              if (slug === currentCategory) return null;
              return (
                <li key={cat}>
                  <Link
                    href={`/categories/${slug}`}
                    className="text-sm text-foreground/80 hover:text-primary transition-colors"
                  >
                    {cat} for Sale
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Resources
          </h3>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/listings"
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                Browse All Listings
              </Link>
            </li>
            <li>
              <Link
                href="/advisors"
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                Find an Advisor
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                Read Our Blog
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                About MercatoList
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
