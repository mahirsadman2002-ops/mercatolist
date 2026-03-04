import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-bold">MercatoList</h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              NYC&apos;s premier marketplace for buying and selling businesses
              across all five boroughs.
            </p>
          </div>

          {/* Browse */}
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              Browse
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/listings"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  All Businesses
                </Link>
              </li>
              <li>
                <Link
                  href="/boroughs/manhattan"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Manhattan
                </Link>
              </li>
              <li>
                <Link
                  href="/boroughs/brooklyn"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Brooklyn
                </Link>
              </li>
              <li>
                <Link
                  href="/boroughs/queens"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Queens
                </Link>
              </li>
              <li>
                <Link
                  href="/boroughs/bronx"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Bronx
                </Link>
              </li>
              <li>
                <Link
                  href="/boroughs/staten-island"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Staten Island
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/brokers"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Find a Broker
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/my-listings/new"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  List Your Business
                </Link>
              </li>
              <li>
                <Link
                  href="/register/broker"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Register as Broker
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center">
          <p className="text-sm text-primary-foreground/50">
            &copy; {new Date().getFullYear()} MercatoList. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
