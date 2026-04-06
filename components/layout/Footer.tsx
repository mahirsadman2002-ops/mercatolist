import Link from "next/link";
import { Twitter, Linkedin, Instagram, Facebook } from "lucide-react";

const browseLinks = [
  { label: "All Businesses", href: "/listings" },
  { label: "Manhattan", href: "/boroughs/manhattan" },
  { label: "Brooklyn", href: "/boroughs/brooklyn" },
  { label: "Queens", href: "/boroughs/queens" },
  { label: "Bronx", href: "/boroughs/bronx" },
  { label: "Staten Island", href: "/boroughs/staten-island" },
];

const categoryLinks = [
  { label: "Restaurants", href: "/categories/restaurants" },
  { label: "Retail Stores", href: "/categories/retail-stores" },
  { label: "Cafes & Coffee Shops", href: "/categories/cafes-coffee-shops" },
  { label: "Bars & Nightclubs", href: "/categories/bars-nightclubs" },
  { label: "Salons & Barbershops", href: "/categories/salons-barbershops" },
  { label: "View All", href: "/listings" },
];

const resourceLinks = [
  { label: "Find an Advisor", href: "/advisors" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const sellerBrokerLinks = [
  { label: "List Your Business", href: "/my-listings/new" },
  { label: "Register as Advisor", href: "/register/advisor" },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
];

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-14 lg:py-16">
        {/* Top section: brand + link columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand column - takes 2 cols on lg */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <h3 className="font-heading text-2xl font-bold tracking-tight">
                MercatoList
              </h3>
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              NYC&apos;s premier marketplace for buying and selling businesses
              across all five boroughs.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/20 hover:text-primary-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Browse */}
          <FooterLinkColumn title="Browse" links={browseLinks} />

          {/* Categories */}
          <FooterLinkColumn title="Categories" links={categoryLinks} />

          {/* Resources */}
          <FooterLinkColumn title="Resources" links={resourceLinks} />

          {/* For Sellers & Brokers */}
          <FooterLinkColumn
            title="For Sellers & Advisors"
            links={sellerBrokerLinks}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-primary-foreground/50">
              &copy; {new Date().getFullYear()} MercatoList. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/about"
                className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/about"
                className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
