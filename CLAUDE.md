# MercatoList — NYC Business Marketplace

## Project Overview

MercatoList (mercatolist.com) is a modern business-for-sale marketplace focused exclusively on New York City. Think BizBuySell but with a far superior, modern UX inspired by homes.com. It connects buyers, sellers, and brokers to list, browse, and transact on business opportunities across all five NYC boroughs.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Database**: PostgreSQL via Neon (neon.tech) + Prisma ORM
- **Auth**: NextAuth.js (Auth.js v5) with Google OAuth + email/password + email verification
- **Email**: Resend + React Email templates
- **Maps**: Mapbox GL JS (address autofill, interactive maps, privacy circles)
- **Image Storage**: AWS S3 + CloudFront CDN
- **Search**: Meilisearch (self-hosted or Meilisearch Cloud)
- **Hosting**: Vercel
- **Real-time**: Polling (not WebSockets — simpler for launch)

## Design Direction

- **UI Inspiration**: homes.com — clean, spacious, modern real estate marketplace
- **Theme**: NYC-specific identity. Sophisticated, professional, sleek. Think dark navs, clean white content areas, subtle NYC touches (borough iconography, neighborhood character)
- **Typography**: Modern, distinctive font pairing — a bold display font for headings, clean sans-serif for body. NO generic fonts (Inter, Arial, Roboto). Use something with character like Outfit, Satoshi, General Sans, or Cabinet Grotesk paired with a refined body font.
- **Color Palette**: Professional with a signature accent. Consider deep navy (#1a1f36) or charcoal for headers, clean whites/light grays for content, and a distinctive accent color (teal, amber, or warm coral) for CTAs and highlights. NOT purple gradients.
- **Layout**: Generous whitespace, card-based listing grids, full-bleed hero sections, sticky navigation. Mobile-first responsive design.
- **Motion**: Subtle — smooth page transitions, hover states on cards, staggered grid reveals. Nothing flashy.
- **Maps**: Prominent Mapbox integration on browse and detail pages, similar to how homes.com uses maps.

## Database Schema

### User Model
```
User {
  id              String (UUID)
  email           String (unique)
  emailVerified   DateTime?
  hashedPassword  String?
  name            String
  displayName     String?
  bio             String?
  avatarUrl       String?
  phone           String?
  website         String?
  role            Enum: USER, BROKER, ADMIN
  ownedBusiness   String? (what business they own)
  buyBox          Json? (buyer preferences: categories, price range, boroughs)
  
  // Broker-specific
  brokerageName   String?
  brokerageWebsite String?
  brokeragePhone  String?
  instagramUrl    String?
  linkedinUrl     String?
  twitterUrl      String?
  facebookUrl     String?
  tiktokUrl       String?
  
  createdAt       DateTime
  updatedAt       DateTime
  
  // Relations
  listings        BusinessListing[]
  receivedInquiries Inquiry[]
  sentInquiries   Inquiry[]
  savedListings   SavedListing[]
  collections     Collection[]
  reviews         Review[] (received)
  givenReviews    Review[] (authored)
  savedSearches   SavedSearch[]
  messages        Message[]
}
```

### BusinessListing Model
```
BusinessListing {
  id                String (UUID)
  slug              String (unique, auto-generated from title)
  status            Enum: ACTIVE, UNDER_CONTRACT, SOLD, OFF_MARKET
  isGhostListing    Boolean (default false)
  shareToken        String? (unique, for ghost listing access)
  
  // Basic Info
  title             String
  description       String (rich text)
  category          String (from predefined list)
  
  // Financials
  askingPrice       Decimal
  annualRevenue     Decimal?
  cashFlowSDE       Decimal?
  netIncome         Decimal?
  profitMargin      Decimal? (auto-calculated)
  askingMultiple    Decimal? (auto-calculated: askingPrice / cashFlowSDE)
  monthlyRent       Decimal?
  rentEscalation    String? (percentage or flat)
  annualPayroll     Decimal?
  totalExpenses     Decimal?
  inventoryValue    Decimal?
  inventoryIncluded Boolean?
  ffeValue          Decimal?
  ffeIncluded       Boolean?
  sellerFinancing   Boolean (default false)
  sbaFinancingAvailable Boolean (default false)
  
  // Business Details
  yearEstablished   Int?
  numberOfEmployees Int?
  employeesWillingToStay Boolean?
  ownerInvolvement  Enum: OWNER_OPERATED, ABSENTEE
  ownerHoursPerWeek Int?
  squareFootage     Int?
  leaseTerms        String? (years remaining or expiration)
  leaseRenewalOption Boolean?
  reasonForSelling  String?
  licensesPermits   String?
  trainingSupport   String?
  
  // Location
  address           String
  hideAddress       Boolean (default false)
  neighborhood      String
  borough           Enum: MANHATTAN, BROOKLYN, QUEENS, BRONX, STATEN_ISLAND
  city              String (default "New York")
  state             String (default "NY")
  zipCode           String
  latitude          Decimal
  longitude         Decimal
  
  // Media
  photos            Photo[] (relation, ordered)
  
  // Privacy & Display
  showPhoneNumber   Boolean (default true)
  
  // Metrics
  viewCount         Int (default 0)
  saveCount         Int (default 0)
  shareCount        Int (default 0)
  daysOnMarket      Int (auto-calculated from createdAt)
  
  // Listing Management
  lastStatusConfirmation DateTime?
  statusConfirmationDue  DateTime? (7 days after last confirmation)
  
  // Sold listing data (admin can add)
  soldPrice         Decimal?
  soldDate          DateTime?
  
  // Relations
  listedBy          User (relation)
  listedById        String
  coBrokers         User[] (many-to-many, max 3)
  inquiries         Inquiry[]
  
  createdAt         DateTime
  updatedAt         DateTime
}
```

### Photo Model
```
Photo {
  id          String (UUID)
  url         String (S3 URL)
  order       Int
  listingId   String
  listing     BusinessListing (relation)
}
```

### Inquiry Model
```
Inquiry {
  id          String (UUID)
  type        Enum: ANONYMOUS_FORM, MESSAGE_THREAD
  
  // For anonymous inquiries
  senderName  String?
  senderEmail String?
  senderPhone String?
  message     String
  
  // Relations
  listing     BusinessListing (relation)
  listingId   String
  sender      User? (relation, null for anonymous)
  senderId    String?
  receiver    User (relation)
  receiverId  String
  isRead      Boolean (default false)
  
  // Thread messages (for MESSAGE_THREAD type)
  messages    Message[]
  
  createdAt   DateTime
}
```

### Message Model
```
Message {
  id          String (UUID)
  content     String
  inquiry     Inquiry (relation)
  inquiryId   String
  sender      User (relation)
  senderId    String
  isRead      Boolean (default false)
  createdAt   DateTime
}
```

### SavedListing Model
```
SavedListing {
  id          String (UUID)
  user        User (relation)
  userId      String
  listing     BusinessListing (relation)
  listingId   String
  createdAt   DateTime
  @@unique([userId, listingId])
}
```

### Collection Model
```
Collection {
  id          String (UUID)
  name        String
  description String?
  user        User (relation)
  userId      String
  
  // Broker-specific: assign to a client
  clientName  String?
  clientEmail String?
  clientPhone String?
  clientBuyBox Json?
  
  listings    BusinessListing[] (many-to-many)
  createdAt   DateTime
  updatedAt   DateTime
}
```

### SavedSearch Model
```
SavedSearch {
  id            String (UUID)
  user          User (relation)
  userId        String
  name          String?
  
  // Search criteria (stored as JSON)
  criteria      Json (category, borough, neighborhood, priceRange, revenueRange, etc.)
  
  // Notification settings
  checkFrequency  Enum: DAILY, WEEKLY (how often to check for matches)
  emailFrequency  Enum: IMMEDIATELY, DAILY_DIGEST, WEEKLY_DIGEST
  isActive        Boolean (default true)
  
  lastCheckedAt   DateTime?
  createdAt       DateTime
  updatedAt       DateTime
}
```

### Review Model
```
Review {
  id          String (UUID)
  rating      Int (1-5)
  text        String
  reviewer    User (relation)
  reviewerId  String
  broker      User (relation)
  brokerId    String
  isReported  Boolean (default false)
  reportReason String?
  createdAt   DateTime
}
```

### Report Model
```
Report {
  id          String (UUID)
  type        Enum: LISTING, REVIEW, DEAL, USER
  reason      Enum: INACCURATE, SUSPICIOUS, DUPLICATE, SPAM, OTHER
  details     String?
  
  reporterId  String
  reporter    User (relation)
  
  // Polymorphic target
  listingId   String?
  reviewId    String?
  userId      String?
  
  status      Enum: PENDING, REVIEWED, DISMISSED, ACTION_TAKEN
  adminNotes  String?
  
  createdAt   DateTime
  resolvedAt  DateTime?
}
```

### ListingStatusLog Model (for tracking confirmations)
```
ListingStatusLog {
  id          String (UUID)
  listing     BusinessListing (relation)
  listingId   String
  confirmedBy User (relation)
  confirmedById String
  previousStatus String
  confirmedStatus String
  createdAt   DateTime
}
```

## Application Structure

```
mercatolist/
├── app/
│   ├── layout.tsx                    # Root layout, fonts, providers, metadata
│   ├── page.tsx                      # Homepage
│   ├── sitemap.ts                    # Dynamic sitemap
│   ├── robots.ts                     # Robots.txt
│   │
│   ├── (public)/
│   │   ├── listings/
│   │   │   ├── page.tsx              # Browse/search listings (grid + map + combined views)
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx          # Listing detail (SSR, JSON-LD, OG tags)
│   │   │   ├── ghost/[token]/
│   │   │   │   └── page.tsx          # Ghost listing access via share token
│   │   │
│   │   ├── boroughs/
│   │   │   ├── manhattan/page.tsx    # SEO: Businesses for Sale in Manhattan
│   │   │   ├── brooklyn/page.tsx
│   │   │   ├── queens/page.tsx
│   │   │   ├── bronx/page.tsx
│   │   │   └── staten-island/page.tsx
│   │   │
│   │   ├── neighborhoods/
│   │   │   └── [neighborhood]/page.tsx  # SEO: Businesses for Sale in [Neighborhood]
│   │   │
│   │   ├── categories/
│   │   │   └── [category]/page.tsx      # SEO: [Category] for Sale in NYC
│   │   │
│   │   ├── [borough]/[category]/page.tsx        # SEO: [Category] for Sale in [Borough]
│   │   ├── [neighborhood]/[category]/page.tsx   # SEO: [Category] for Sale in [Neighborhood]
│   │   │
│   │   ├── brokers/
│   │   │   ├── page.tsx              # Browse/search brokers directory
│   │   │   └── [id]/page.tsx         # Broker public profile
│   │   │
│   │   ├── profile/[id]/page.tsx     # User/seller public profile
│   │   │
│   │   ├── blog/
│   │   │   ├── page.tsx              # Blog index
│   │   │   └── [slug]/page.tsx       # Blog post
│   │   │
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx            # Sign in (email/password + Google OAuth)
│   │   ├── register/
│   │   │   ├── page.tsx              # Step 1: credentials
│   │   │   ├── account-type/page.tsx # Step 2: choose Buyer/Seller or Broker
│   │   │   └── broker-details/page.tsx # Step 3: broker-specific fields (if applicable)
│   │   ├── register/broker/page.tsx  # Direct broker registration (from nav link, skips account type selection)
│   │   ├── verify-email/page.tsx
│   │   └── complete-profile/page.tsx # For OAuth users to finish setup
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard layout with sidebar nav
│   │   ├── my-listings/
│   │   │   ├── page.tsx              # View & manage all listings with analytics
│   │   │   ├── new/page.tsx          # Multi-step listing creation form
│   │   │   └── [id]/edit/page.tsx    # Edit existing listing
│   │   ├── inquiries/page.tsx        # Unified inbox: Received + Sent tabs, message threads
│   │   ├── saved/page.tsx            # Saved/favorited listings
│   │   ├── collections/
│   │   │   ├── page.tsx              # All collections
│   │   │   └── [id]/page.tsx         # Single collection view
│   │   ├── saved-searches/page.tsx   # Manage auto-searches and alerts
│   │   ├── profile/page.tsx          # Edit profile settings
│   │   ├── public-profile/page.tsx   # Edit public-facing profile
│   │   │
│   │   └── clients/page.tsx          # Broker only: manage buyer clients
│   │
│   ├── (admin)/
│   │   ├── layout.tsx                # Admin layout with admin sidebar
│   │   ├── page.tsx                  # Admin dashboard overview / analytics
│   │   ├── listings/page.tsx         # Manage all listings, add sold data
│   │   ├── users/page.tsx            # Manage users, ban, edit roles
│   │   ├── reports/page.tsx          # View & action all reports (listings, reviews, deals, users)
│   │   ├── confirmations/page.tsx    # Listing status confirmation tracker
│   │   ├── analytics/page.tsx        # Detailed site analytics
│   │   └── blog/
│   │       ├── page.tsx              # Manage blog posts
│   │       └── new/page.tsx          # Create/edit blog post
│   │
│   └── api/
│       ├── auth/[...nextauth]/       # NextAuth routes
│       ├── listings/                 # CRUD, search, filter
│       ├── inquiries/                # Send, receive, mark read
│       ├── messages/                 # Thread messages
│       ├── collections/              # CRUD, add/remove listings, email to client
│       ├── saved-searches/           # CRUD, match checking
│       ├── reviews/                  # CRUD, report
│       ├── reports/                  # Submit, admin actions
│       ├── upload/                   # S3 presigned URL generation
│       ├── email/                    # Send transactional emails
│       ├── geocode/                  # Mapbox geocoding proxy
│       ├── admin/                    # Admin-only endpoints
│       ├── blog/                     # Blog CRUD
│       └── cron/                     # Scheduled tasks
│           ├── listing-status-check/ # 7-day confirmation emails
│           ├── saved-search-match/   # Check for new matching listings
│           ├── saved-listing-alerts/ # 24hr status change checks
│           ├── collection-alerts/    # Collection listing status changes
│           ├── unread-digest/        # Daily unread message digest
│           └── marketing-nudge/     # Periodic saved listing marketing emails
│
├── components/
│   ├── ui/                           # shadcn/ui base components
│   ├── layout/
│   │   ├── Header.tsx                # Sticky header, adaptive nav by user type/auth state
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx             # Hamburger menu
│   │   ├── DashboardSidebar.tsx
│   │   └── AdminSidebar.tsx
│   ├── listings/
│   │   ├── ListingCard.tsx           # Card with save/collection buttons
│   │   ├── ListingGrid.tsx
│   │   ├── ListingDetail.tsx
│   │   ├── PhotoGallery.tsx          # Thumbnails + fullscreen + map as last slide
│   │   ├── FinancialInfo.tsx         # With info tooltips on every field
│   │   ├── BusinessDetails.tsx
│   │   ├── ListingContactSidebar.tsx # Broker info + dual contact buttons
│   │   ├── ListingMap.tsx            # Mapbox with privacy circle option
│   │   └── ListingStatusBadge.tsx
│   ├── search/
│   │   ├── SearchBar.tsx             # Keyword + category dropdown
│   │   ├── FilterSidebar.tsx         # All browse filters
│   │   ├── MapView.tsx               # Mapbox browse map
│   │   ├── ViewToggle.tsx            # Grid / Map / Grid+Map toggle
│   │   └── SaveSearchPrompt.tsx      # Dismissable popup after first search
│   ├── forms/
│   │   ├── ListingForm/              # Multi-step form components
│   │   ├── InquiryForm.tsx           # Anonymous inquiry form
│   │   ├── MessageThread.tsx         # Two-way conversation UI
│   │   ├── ReviewForm.tsx
│   │   └── ReportForm.tsx
│   ├── collections/
│   │   ├── CollectionCard.tsx
│   │   ├── AddToCollectionDropdown.tsx
│   │   └── CollectionManager.tsx
│   ├── profiles/
│   │   ├── PublicProfile.tsx
│   │   ├── BrokerProfile.tsx         # With reviews, listings, deal history
│   │   ├── ReviewCard.tsx
│   │   └── ShareReviewLink.tsx       # Broker can send review request to clients
│   └── admin/
│       ├── AnalyticsDashboard.tsx
│       ├── ReportsList.tsx
│       ├── ConfirmationTracker.tsx
│       └── UserManager.tsx
│
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── auth.ts                       # NextAuth config
│   ├── s3.ts                         # S3 upload helpers
│   ├── email.ts                      # Resend client
│   ├── mapbox.ts                     # Mapbox client helpers
│   ├── search.ts                     # Meilisearch client
│   ├── utils.ts                      # slugify, formatCurrency, formatNumber, etc.
│   ├── constants.ts                  # Categories, boroughs, neighborhoods lists
│   └── validations.ts                # Zod schemas for all forms
│
├── emails/                           # React Email templates (matching site UI)
│   ├── components/                   # Shared email components (header, footer, button)
│   ├── welcome.tsx
│   ├── verify-email.tsx
│   ├── inquiry-received.tsx          # To listing owner
│   ├── inquiry-confirmation.tsx      # To inquirer
│   ├── new-message.tsx               # Message notification
│   ├── listing-status-change.tsx     # Alert for saved listings & collections
│   ├── saved-search-match.tsx        # New listings matching criteria
│   ├── collection-update.tsx         # For broker clients
│   ├── status-confirmation-request.tsx # 7-day listing check
│   ├── unread-digest.tsx             # Daily unread summary
│   ├── marketing-nudge.tsx           # Periodic saved listing reminder
│   ├── review-request.tsx            # Broker sends to client
│   ├── report-notification.tsx       # To admin
│   └── broker-welcome.tsx            # Broker-specific welcome
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                       # Sample NYC business listings for development
│   └── migrations/
│
├── public/
│   ├── og-default.jpg
│   └── icons/
│
├── CLAUDE.md                         # This file
├── .env.local                        # Environment variables (never commit)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Business Categories

Restaurants, Bars & Nightclubs, Cafes & Coffee Shops, Bakeries, Delis & Grocery Stores, Food Trucks & Carts, Retail Stores, Clothing & Fashion, Electronics, Convenience Stores, Pharmacies, Laundromats & Dry Cleaners, Salons & Barbershops, Spas & Wellness, Nail Salons, Gyms & Fitness Studios, Daycare & Childcare, Auto Repair & Body Shops, Gas Stations, Car Washes, Printing & Copy Shops, Cleaning Services, Construction & Contracting, Real Estate Agencies, Insurance Agencies, Accounting & Tax Services, Law Practices, Medical & Dental Practices, Home Health Agencies, Trucking & Logistics, Wholesale & Distribution, Manufacturing, E-commerce Businesses, Tech & Software, Marketing & Advertising Agencies, Tutoring & Education Centers, Pet Services, Travel Agencies, Event Planning, Florists, Liquor Stores, Smoke Shops & Vape Shops, Franchise Businesses, Other

## NYC Neighborhoods (for SEO pages and filters)

### Manhattan
Upper East Side, Upper West Side, Midtown, Midtown East, Midtown West, Chelsea, Greenwich Village, East Village, West Village, SoHo, Tribeca, Lower East Side, Chinatown, Little Italy, Financial District, NoHo, NoLiTa, Hell's Kitchen, Murray Hill, Gramercy, Flatiron, Kips Bay, Harlem, East Harlem, Washington Heights, Inwood, Morningside Heights

### Brooklyn
Williamsburg, Bushwick, Park Slope, Brooklyn Heights, DUMBO, Bed-Stuy, Crown Heights, Sunset Park, Bay Ridge, Flatbush, Bensonhurst, Greenpoint, Cobble Hill, Carroll Gardens, Red Hook, Borough Park, Brighton Beach, Coney Island, Prospect Heights, Fort Greene, Clinton Hill, Dyker Heights, Midwood, Sheepshead Bay, Canarsie

### Queens
Astoria, Long Island City, Flushing, Jackson Heights, Forest Hills, Rego Park, Jamaica, Elmhurst, Corona, Woodside, Sunnyside, Bayside, Fresh Meadows, Ridgewood, Howard Beach, Ozone Park, Richmond Hill, Kew Gardens, Maspeth, Middle Village, Whitestone, College Point, Far Rockaway

### Bronx
South Bronx, Mott Haven, Fordham, Riverdale, Pelham Bay, Throgs Neck, Morris Park, Belmont, Kingsbridge, Parkchester, Hunts Point, Tremont, University Heights, Norwood, Wakefield, Co-op City, Castle Hill, Soundview, Westchester Square

### Staten Island
St. George, Stapleton, Tompkinsville, New Dorp, Tottenville, Great Kills, Eltingville, Annadale, Huguenot, Charleston, Travis, Mariners Harbor, Port Richmond, West Brighton

## SEO Strategy

1. **Every listing page** gets: dynamic title tag, meta description, Open Graph tags (title, description, image), JSON-LD structured data (LocalBusiness schema), canonical URL
2. **Borough landing pages**: "Businesses for Sale in [Borough]" — pre-rendered with listing counts, featured listings, neighborhood links
3. **Neighborhood landing pages**: "Businesses for Sale in [Neighborhood]" — same pattern but neighborhood-specific
4. **Category landing pages**: "[Category] for Sale in NYC"
5. **Category + Borough combos**: "[Category] for Sale in [Borough]"
6. **Category + Neighborhood combos**: "[Category] for Sale in [Neighborhood]"
7. **Blog**: Long-tail SEO content targeting buyer/seller educational queries
8. **Auto-generated XML sitemap** that updates when listings are added/removed
9. **Internal linking**: Every page links to related boroughs, neighborhoods, categories
10. **Image optimization**: Next.js Image component with lazy loading, WebP conversion, responsive sizes

## Email System

All emails match the site's visual branding (colors, fonts, logo). Built with React Email for JSX-based templates. Sent via Resend API. Templates listed in the emails/ directory above.

## Scheduled Tasks (Cron Jobs via Vercel Cron)

1. **Every 24 hours**: Check saved listings for status changes → email users
2. **Every 24 hours**: Check collection listings for status changes → email broker + clients
3. **Every 7 days**: Email listing owners to confirm listing status → track responses in admin
4. **Per saved search frequency**: Check for new matching listings → email user (and broker client if applicable)
5. **Daily**: Send unread message digest to users with unread messages
6. **Weekly**: Marketing nudge emails for saved listings with no recent status updates

## Admin Dashboard Analytics

### Site Health
- Total active listings, new listings this week/month with trend charts
- Total registered users broken down by type (buyer/seller, broker, admin)
- New signups this week/month with growth trends
- Listings by status (active, under contract, sold, off market)

### Engagement Metrics
- Total listing views (today, this week, this month, all time)
- Total inquiries sent and messages exchanged
- Most viewed listings, most saved, most inquired
- Top search terms users are entering (track and store search queries)
- Conversion rate: views → inquiries

### Marketplace Health
- Average asking price, average revenue, average days on market
- Listings by borough breakdown (pie/bar chart)
- Listings by category breakdown
- Sell-through rate (percentage of listings that end up sold)
- Price-to-revenue multiples by category
- Listings with zero inquiries after 30 days (quality flag)

### User Activity
- Most active brokers (by listings count, inquiries received, deals closed)
- Listing status confirmation tracker (who confirmed, who hasn't, overdue)
- Pending reports (listings, reviews, deals, users)
- Unresponsive sellers (received inquiries, never replied within 48hrs)

## Key Conventions

- All monetary values displayed as USD with commas (e.g., $1,250,000)
- Dates displayed as "Month Day, Year" (e.g., January 15, 2026)
- Slugs auto-generated from listing titles (e.g., "joes-pizza-astoria")
- All forms validated with Zod schemas (client and server side)
- All API routes return consistent JSON: { success: boolean, data?: any, error?: string }
- Error boundaries on all pages
- Loading skeletons on all data-fetching components
- Toast notifications for user actions (save, unsave, send inquiry, etc.)
- Mobile-first responsive design — all pages must work on phones
- Accessibility: proper ARIA labels, keyboard navigation, focus management
