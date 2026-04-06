import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── Blog Post Content ────────────────────────────────────────────────

const POST_1_CONTENT = `
Buying a business in New York City is one of the most exciting — and high-stakes — financial decisions you can make. The city's density, diversity, and nonstop demand create opportunities you won't find anywhere else. But the same qualities that make NYC attractive also make the process more complex than buying a business in a suburban market.

This guide walks you through every step, from deciding what to buy to signing on the dotted line.

## Why Buy a Business in NYC?

New York City has over 8.3 million residents and roughly 60 million tourists per year. That means foot traffic, repeat customers, and a built-in customer base for almost any type of business. Here are the key advantages:

- **Population density** — More customers per square mile than virtually anywhere in the U.S.
- **Diverse economy** — From restaurants in Astoria to laundromats in Bed-Stuy to tech firms in Flatiron, NYC supports every category
- **High barriers to entry** — Commercial leases and licensing requirements keep casual competitors out, which protects established businesses
- **Resilient demand** — Even after downturns, NYC bounces back faster than most markets. Essential services like delis, laundromats, and salons remain steady through economic cycles

## Where to Find Businesses for Sale

Start your search across multiple channels:

- **Online marketplaces** — MercatoList is built specifically for NYC businesses. You can also check BizBuySell and BizQuest, though they cover the whole country and lack NYC-specific filtering
- **Business brokers/advisors** — A good NYC business advisor will have off-market deals and can match you with opportunities before they go public. Look for advisors who specialize in your target borough or industry
- **Direct outreach** — Walk neighborhoods you're interested in. Talk to owners. Many small business sales in NYC happen through word of mouth, especially in tight-knit communities like Sunset Park, Jackson Heights, or Arthur Avenue in the Bronx
- **Industry networks** — Trade associations, chamber of commerce events, and LinkedIn groups focused on NYC small business

## The Due Diligence Checklist

Due diligence is where deals are made or broken. Never skip this phase, no matter how good the opportunity looks on paper.

### Financial Due Diligence

- **Tax returns** — Request at least 3 years of federal and state tax returns. Compare them to the profit and loss statements the seller provides
- **Bank statements** — Ask for 12-24 months of business bank statements. Look for consistency between reported revenue and actual deposits
- **SDE calculation** — Seller's Discretionary Earnings is the key metric. Make sure you understand what add-backs the seller is claiming and whether they're legitimate
- **Accounts receivable and payable** — Know what's owed to the business and what the business owes
- **Sales tax filings** — In NYC, sales tax records filed with New York State are a reliable way to verify reported revenue

### Legal Due Diligence

- **Lease review** — This is critical in NYC. Understand the remaining term, renewal options, rent escalations, and whether the lease is assignable. A great business with a bad lease is a bad deal
- **Licenses and permits** — NYC requires specific licenses for restaurants (DOH), liquor (SLA), childcare (DOH), auto repair, and many other categories. Verify all licenses are current and transferable
- **Pending litigation** — Check for any lawsuits, DOB violations, or health department actions
- **Entity structure** — Understand whether you're buying assets or the entity itself. Asset purchases are more common and generally safer for buyers

### Operational Due Diligence

- **Employee interviews** — Will key employees stay after the sale? In NYC's tight labor market, losing your head chef or lead mechanic can tank a business
- **Customer concentration** — If one client accounts for more than 20% of revenue, that's a risk
- **Supplier relationships** — Are there exclusive contracts or favorable terms that might change with new ownership?
- **Inventory and equipment** — Get a detailed list and inspect everything in person

## Financing Your Purchase

Most buyers don't pay all cash. Here are the main financing options for NYC business acquisitions:

- **SBA 7(a) loans** — The most popular option. The SBA guarantees up to 85% of the loan, which makes lenders more willing to finance business acquisitions. Typical terms: 10-year repayment, rates around Prime + 2-3%. You'll need a minimum 10-20% down payment, good personal credit (680+), and relevant experience helps
- **Seller financing** — Many NYC business sellers will finance 10-30% of the purchase price. This is a good sign because it means the seller has confidence the business will continue performing. Typical terms: 3-5 year repayment at 5-8% interest
- **Conventional bank loans** — Harder to get for business acquisitions, but possible if you have an existing banking relationship and strong financials
- **Combination** — The most common structure is SBA loan + seller financing + buyer's down payment

## Key Metrics to Understand

Before you make an offer, make sure you're comfortable with these numbers:

- **Asking Price** — What the seller wants. This is the starting point for negotiations, not the final price
- **SDE (Seller's Discretionary Earnings)** — The total financial benefit to a single owner-operator. This is the most important number for businesses under $5M
- **Asking Multiple** — Asking Price divided by SDE. In NYC, typical multiples range from 1.5x to 4x depending on the industry, location, and growth trajectory
- **Cash Flow** — What the business actually puts in your pocket after all expenses, debt service, and a reasonable salary
- **Monthly Rent** — In NYC, rent is often the single largest expense. A general rule: rent should not exceed 8-10% of gross revenue for most businesses

## Working with a Business Advisor

A good business advisor earns their commission. Here's what to look for:

- **NYC specialization** — An advisor who knows the difference between a liquor license in Manhattan vs. Brooklyn, or understands the commercial lease landscape in Queens, is worth far more than a generalist
- **Category expertise** — If you're buying a restaurant, work with an advisor who has closed restaurant deals
- **Transparent process** — They should explain their commission structure upfront (typically 8-12% paid by the seller) and keep you informed at every stage
- **Network** — The best advisors have relationships with SBA lenders, business attorneys, and CPAs who specialize in acquisitions

## The Closing Process Step by Step

1. **Letter of Intent (LOI)** — A non-binding agreement that outlines the basic terms: price, structure, timeline, and contingencies
2. **Due diligence period** — Typically 30-60 days. This is when you dig into the financials, legal, and operations
3. **Purchase agreement** — Your attorney drafts or reviews the formal agreement. Key sections include representations and warranties, indemnification, non-compete clause, and transition terms
4. **Financing approval** — If using an SBA loan, this process can take 45-90 days. Start early
5. **Lease assignment or new lease** — Work with the landlord to either assign the existing lease or negotiate a new one. In NYC, this step can be a dealbreaker — start this conversation early
6. **License transfers** — File for transfer of all necessary licenses and permits. Some (like liquor licenses) can take months
7. **Closing** — Sign the documents, transfer funds through escrow, and take the keys. Most closings happen at the buyer's attorney's office
8. **Transition period** — The seller typically stays for 2-4 weeks to introduce you to employees, customers, and suppliers

## Common Mistakes to Avoid

- **Falling in love with the idea** — Don't let emotion override the numbers. If the financials don't work, walk away
- **Ignoring the lease** — In NYC, the lease is arguably more important than the business itself. A business with 2 years left on a lease and no renewal option is a ticking clock
- **Skipping professional help** — Hiring a business attorney and CPA who specialize in NYC acquisitions will cost you $5,000-15,000 but can save you hundreds of thousands
- **Underestimating working capital** — You need cash reserves beyond the purchase price. Plan for at least 3-6 months of operating expenses
- **Not talking to the neighbors** — Visit the location at different times of day. Talk to neighboring business owners. They'll tell you things the seller won't
- **Rushing the process** — A good acquisition takes 3-6 months from first look to closing. If someone is pressuring you to move faster, ask yourself why
`;

const POST_2_CONTENT = `
If you're looking at businesses for sale in NYC, you'll see terms like SDE, cash flow, and asking multiple on almost every listing. Understanding these metrics is the difference between spotting a great deal and overpaying for a mediocre one.

This guide breaks down the numbers that matter most when evaluating a business acquisition.

## What Is SDE (Seller's Discretionary Earnings)?

**Seller's Discretionary Earnings (SDE)** is the total financial benefit available to a single owner-operator of a business. It's the standard profitability metric for small businesses — generally those with less than $5 million in annual revenue.

SDE starts with net income and adds back certain expenses that are specific to the current owner or non-essential to operations. The formula:

**SDE = Net Income + Owner's Salary + Owner's Benefits + Interest + Depreciation + Amortization + One-Time/Non-Recurring Expenses + Owner's Personal Expenses Run Through the Business**

### Common Add-Backs

- **Owner's salary and benefits** — Whatever the owner pays themselves, including health insurance, retirement contributions, and car allowances
- **One-time expenses** — A kitchen renovation, a lawsuit settlement, or a one-time marketing campaign that won't recur
- **Depreciation and amortization** — Non-cash accounting expenses
- **Interest on business debt** — Because the buyer will have their own financing structure
- **Personal expenses** — Some owners run personal cell phone bills, meals, travel, or family member salaries through the business. These are legitimate add-backs only if they're truly personal and not required for operations

### Watch Out For Inflated Add-Backs

This is where many sellers stretch the truth. A seller might claim their spouse's $60,000 salary is an add-back, but if that spouse is the office manager and you'd need to hire a replacement, that's not a legitimate add-back. Always ask: **"If I remove this expense, would I need to replace it with something else?"**

## SDE vs. Net Income vs. EBITDA

These three metrics measure profitability differently, and they're used in different contexts:

| Metric | Best For | Key Difference |
|--------|----------|----------------|
| **Net Income** | Tax reporting | Includes all expenses including owner's salary |
| **SDE** | Small businesses (<$5M revenue) | Adds back owner's compensation and discretionary expenses |
| **EBITDA** | Larger businesses (>$5M revenue) | Adds back interest, depreciation, and amortization but NOT owner's salary |

For most businesses you'll find on MercatoList — restaurants, laundromats, salons, delis, retail shops — **SDE is the right metric**. EBITDA is more common for mid-market and larger deals where the business has professional management in place and the owner isn't involved in daily operations.

## How Asking Multiples Work

The **asking multiple** (also called the SDE multiple or valuation multiple) is how most small businesses are priced:

**Asking Price = SDE x Multiple**

Or in reverse:

**Multiple = Asking Price / SDE**

A business with $200,000 in SDE listed at $600,000 has a **3.0x multiple**.

### What Determines the Multiple?

Higher multiples generally mean lower risk and higher quality. Factors that push multiples up:

- **Consistent revenue growth** over 3+ years
- **Strong lease** with long remaining term and favorable rent in a prime NYC location
- **Diversified customer base** — no single customer dominates revenue
- **Systems and processes** that don't depend on the owner
- **Absentee or semi-absentee** ownership model
- **Transferable licenses** — especially valuable in NYC for liquor licenses, which can be worth $50,000-300,000+ on their own

Factors that push multiples down:

- **Declining revenue** or inconsistent earnings
- **Owner-dependent** — if the owner IS the business, you're buying a job
- **Short lease remaining** without renewal options
- **Deferred maintenance** or outdated equipment
- **Regulatory risk** — pending violations, license issues

### Typical Multiples by Industry in NYC

These ranges are approximate and based on recent market data for NYC businesses:

- **Laundromats**: 3.0x - 5.0x (higher because of predictable cash flow and absentee potential)
- **Restaurants**: 1.5x - 3.0x (lower because of high failure rate and owner dependency)
- **Delis/Bodegas**: 1.5x - 2.5x (essential services, but often very owner-dependent)
- **Salons/Barbershops**: 1.5x - 3.0x (depends on whether clients follow the stylists or stay with the location)
- **Gyms/Fitness Studios**: 2.0x - 3.5x (membership model is attractive)
- **E-commerce**: 2.5x - 4.0x (depends on brand strength and customer acquisition costs)
- **Professional Services**: 1.5x - 3.0x (highly dependent on key personnel)
- **Franchise Businesses**: 2.0x - 3.5x (proven model reduces risk)

Note: NYC businesses often command a premium over national averages because of the location value, population density, and higher barriers to entry.

## Red Flags in the Financials

After reviewing hundreds of business listings, these are the patterns that should make you pause:

- **Big gap between reported revenue and tax returns** — If the P&L shows $800K in revenue but tax returns show $500K, someone is lying to either you or the IRS. Either way, it's a problem
- **Sudden revenue spike** in the year of sale — The seller may be inflating numbers to justify a higher price
- **Too many cash add-backs** — "We do a lot of cash business" is a common claim in NYC, especially for restaurants and delis. If the seller can't substantiate it, don't pay for it
- **Owner's salary is suspiciously low** — If the owner claims to take only $30,000/year from a business doing $1M in revenue, the real expenses are hiding somewhere
- **Rent is over 10% of revenue** — For most businesses, rent above 10% of gross revenue is a warning sign, especially with NYC's annual rent escalations
- **No clear reason for selling** — Retirement and relocation are good reasons. "Ready for a new challenge" after 2 years often means the business is struggling

## How to Verify Seller Claims

Trust, but verify. Here's how:

1. **Request 3 years of tax returns** — Both business and personal (for sole proprietorships and single-member LLCs)
2. **Get bank statements** — Compare monthly deposits to reported monthly revenue
3. **Check sales tax filings** — In New York, these are filed quarterly and are hard to fake
4. **Review POS system reports** — Modern POS systems like Square, Toast, or Clover have built-in reporting that's harder to manipulate than spreadsheets
5. **Talk to suppliers** — They can confirm order volumes, which correlates with revenue
6. **Visit at peak hours** — Count customers yourself. Sit outside the business and observe foot traffic and transaction volume

## When to Hire a CPA

The short answer: **always**. For any acquisition over $100,000, a CPA who specializes in business acquisitions is essential. They will:

- Perform a Quality of Earnings (QofE) analysis — the gold standard for verifying financials
- Identify legitimate vs. inflated add-backs
- Assess tax implications of the purchase structure (asset vs. stock sale)
- Help you understand the true economic benefit of the business
- Spot accounting irregularities you might miss

In NYC, expect to pay $3,000-10,000 for a thorough financial review, depending on the complexity of the business. That's a tiny fraction of the purchase price and could save you from a six-figure mistake.

A solid understanding of SDE, multiples, and financial due diligence will put you ahead of most first-time buyers. The numbers tell the story — make sure you know how to read them.
`;

const POST_3_CONTENT = `
New York City's unique combination of population density, diverse demographics, and high demand for services creates opportunities for business buyers that simply don't exist in other markets. But not all businesses are created equal — some categories consistently outperform others for buyers looking at acquisitions.

Here are the ten best types of businesses to buy in New York City, based on profitability, resilience, and long-term growth potential.

## 1. Laundromats

**Why it works in NYC:** Most New Yorkers don't have in-unit laundry. That's not changing anytime soon — the city's housing stock is old, dense, and not built for washers and dryers. Laundromats serve a genuine, recurring need with minimal competition from online alternatives.

**Typical price range:** $200,000 - $1,500,000+

**Pros:**
- Recession-proof — people always need clean clothes
- Low labor requirements — many operate with just 1-2 attendants
- Strong absentee ownership potential
- Predictable, steady cash flow
- High SDE multiples (3.0x - 5.0x) reflect the stability

**Cons:**
- Equipment replacement is expensive ($150K+ for a full retool)
- Water and utility costs in NYC are significant
- Lease negotiations are critical — you need a long-term lease to justify equipment investment
- Location is everything — a laundromat three blocks from a competitor might do half the business

## 2. Restaurants and Pizzerias

**Why it works in NYC:** New Yorkers eat out more than almost any other city in the country. The food culture is unmatched, and neighborhood loyalty runs deep. A well-run pizzeria in Brooklyn or a Dominican restaurant in Washington Heights can generate steady revenue for decades.

**Typical price range:** $150,000 - $800,000

**Pros:**
- High demand in every borough and neighborhood
- Strong repeat customer base
- Cash flow can be excellent with tight cost management
- Iconic NYC food businesses can build real brand equity

**Cons:**
- High failure rate for inexperienced operators
- Labor-intensive with thin margins (food costs, labor, rent)
- NYC Department of Health inspections are rigorous
- Liquor license adds significant value but also complexity and cost

## 3. Delis and Bodegas

**Why it works in NYC:** The bodega is a New York City institution. These corner stores serve as the neighborhood's pantry, coffee shop, and quick-service restaurant all in one. They're open long hours, serve a loyal customer base, and are woven into the daily fabric of city life.

**Typical price range:** $100,000 - $500,000

**Pros:**
- Essential service — high foot traffic regardless of economic conditions
- Multiple revenue streams: grocery, prepared food, lottery, ATM fees, delivery
- Deep community ties create customer loyalty
- Low barrier to entry compared to restaurants

**Cons:**
- Very long hours — many operate 16-18 hours per day
- Tight margins on grocery items
- Competition from delivery apps and chain convenience stores
- Often heavily owner-dependent

## 4. Salons and Barbershops

**Why it works in NYC:** Personal grooming is non-negotiable in a city where appearance matters for professional and social life. Barbershops in neighborhoods like Harlem, Bed-Stuy, and the Bronx are cultural institutions. High-end salons in Manhattan and Brooklyn command premium pricing.

**Typical price range:** $80,000 - $400,000

**Pros:**
- Recurring revenue — most clients come every 2-6 weeks
- Relatively low startup cost compared to other businesses
- Strong community presence builds referral business
- Tips supplement employee compensation, keeping payroll manageable

**Cons:**
- Stylists/barbers may leave and take clients with them
- Rent in prime NYC locations can eat into margins
- Requires licensed staff, which can be competitive to recruit
- The business value is often tied to the owner's personal relationships

## 5. Gyms and Fitness Studios

**Why it works in NYC:** Health-conscious New Yorkers spend heavily on fitness. The membership model creates predictable recurring revenue, and NYC's small apartments mean people need to go somewhere to work out. Boutique fitness studios (cycling, yoga, HIIT) have particularly strong demand.

**Typical price range:** $150,000 - $1,000,000

**Pros:**
- Membership/subscription model = predictable monthly revenue
- High margins on personal training and specialty classes
- Strong brand loyalty in the boutique fitness space
- Growing demand post-pandemic for in-person fitness experiences

**Cons:**
- Equipment is expensive and requires ongoing maintenance
- Lease costs for the square footage needed can be substantial
- Seasonal fluctuations (January surge, summer dip)
- Competition from ClassPass, Equinox, and home fitness options

## 6. Daycare and Childcare Centers

**Why it works in NYC:** Childcare in New York City is in massive demand and chronically undersupplied. Waitlists of 6-12 months are common in popular neighborhoods. The city's universal pre-K program has also created new revenue streams for licensed providers.

**Typical price range:** $200,000 - $800,000

**Pros:**
- Growing demand driven by NYC's family population and dual-income households
- High retention — once parents enroll, they rarely switch
- Government subsidies and universal pre-K contracts provide stable revenue
- Strong community impact and reputation

**Cons:**
- Heavily regulated by NYC DOH with strict staffing ratios
- Requires significant insurance coverage
- Staff recruitment and retention is challenging given NYC's cost of living
- Physical space requirements (outdoor area, square footage per child) limit locations

## 7. Auto Repair Shops

**Why it works in NYC:** While many Manhattanites don't own cars, the outer boroughs are a different story. Queens, Brooklyn, the Bronx, and Staten Island have millions of car owners who need regular maintenance, inspections, and repairs. NYC's DMV inspection requirement creates guaranteed annual revenue.

**Typical price range:** $150,000 - $600,000

**Pros:**
- Essential service — cars need maintenance regardless of the economy
- NYS inspection requirement drives guaranteed traffic
- Skilled mechanic labor creates a moat — not easy to replicate
- Repeat customers build over time as they trust your work

**Cons:**
- Requires certified mechanics (ASE certification preferred)
- Environmental regulations for waste disposal are strict in NYC
- Equipment and lift installation requires specific zoning
- Commercial rents for garage-sized spaces have been rising in the outer boroughs

## 8. Cleaning Services

**Why it works in NYC:** Between residential cleaning, office cleaning, and post-construction cleanup, the demand for cleaning services in NYC is enormous. The city's density of apartments and commercial spaces creates a massive addressable market.

**Typical price range:** $50,000 - $300,000

**Pros:**
- Very low overhead — minimal equipment and no storefront needed
- Scalable with employees and subcontractors
- Recurring revenue from regular residential and commercial contracts
- High demand across all boroughs

**Cons:**
- Low barriers to entry mean lots of competition
- Employee turnover is high in the cleaning industry
- Margins can be thin without commercial contracts
- Insurance and bonding costs are non-trivial

## 9. E-Commerce Businesses

**Why it works in NYC:** While e-commerce isn't location-dependent for customers, being based in NYC gives you access to talent, trend awareness, and proximity to suppliers (especially in fashion, beauty, and food). Many successful NYC e-commerce brands leverage the city's cultural influence.

**Typical price range:** $100,000 - $1,000,000+

**Pros:**
- Location-independent revenue — your customers are everywhere
- Scalable without proportional cost increases
- Lower overhead than brick-and-mortar
- Data-driven — performance is highly measurable

**Cons:**
- Customer acquisition costs are rising across all digital channels
- Inventory management and fulfillment logistics can be complex
- Highly competitive — barriers to entry are low
- Brand value can be fragile and dependent on marketing spend

## 10. Franchise Businesses

**Why it works in NYC:** Franchises offer a proven playbook in a market where the cost of failure is high. NYC is home to thousands of franchise locations across fast food, fitness, tax preparation, tutoring, and more. The brand recognition and operational systems reduce the learning curve for first-time buyers.

**Typical price range:** $100,000 - $800,000+ (plus franchise fees)

**Pros:**
- Proven business model with established brand recognition
- Training and operational support from the franchisor
- Easier to secure SBA financing (lenders love franchises)
- Built-in marketing and supply chain

**Cons:**
- Ongoing royalty fees (typically 4-8% of gross revenue)
- Less flexibility — you must follow the franchisor's system
- Territory restrictions may limit growth
- Some franchise brands are oversaturated in NYC

## How to Choose the Right Business

The best business for you depends on three things:

1. **Your skills and experience** — A restaurant buyer with no food service experience is taking on unnecessary risk. Buy in an industry where your background gives you an edge
2. **Your financial capacity** — Consider not just the purchase price but the working capital needed. A laundromat might cost $500K but require another $100K in reserves. A cleaning service might cost $100K total
3. **Your lifestyle goals** — Do you want to be hands-on every day, or do you want a semi-absentee business? Laundromats and e-commerce businesses can be run with limited daily involvement. Restaurants and delis require your presence

Whatever you choose, the fundamentals stay the same: verify the financials, understand the lease, know the neighborhood, and don't overpay. New York City rewards smart buyers who do their homework.
`;

// ─── Seed Function ────────────────────────────────────────────────────

async function main() {
  console.log("Seeding blog posts...");

  // Find or create an admin/team author
  let author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!author) {
    console.log("No admin user found. Creating team author...");
    author = await prisma.user.create({
      data: {
        email: "editorial@mercatolist.com",
        name: "MercatoList Editorial",
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });
    console.log(`Created author: ${author.name} (${author.email})`);
  } else {
    console.log(`Using existing admin author: ${author.name} (${author.email})`);
  }

  // Post 1
  const post1 = await prisma.blogPost.upsert({
    where: { slug: "how-to-buy-a-business-in-nyc-complete-guide" },
    update: {
      title: "How to Buy a Business in NYC: A Complete Guide for First-Time Buyers",
      content: POST_1_CONTENT.trim(),
      excerpt:
        "Everything you need to know about buying a business in New York City — from finding the right opportunity to closing the deal.",
      category: "Buying Guide",
      tags: [
        "buying a business",
        "nyc",
        "due diligence",
        "sba loans",
        "first-time buyer",
      ],
      status: "PUBLISHED",
      publishedAt: new Date(),
      metaTitle:
        "How to Buy a Business in NYC: Complete Guide | MercatoList",
      metaDescription:
        "Step-by-step guide to buying a business in New York City. Covers finding deals, due diligence, financing with SBA loans, key metrics, and the closing process.",
      authorId: author.id,
    },
    create: {
      title: "How to Buy a Business in NYC: A Complete Guide for First-Time Buyers",
      slug: "how-to-buy-a-business-in-nyc-complete-guide",
      content: POST_1_CONTENT.trim(),
      excerpt:
        "Everything you need to know about buying a business in New York City — from finding the right opportunity to closing the deal.",
      category: "Buying Guide",
      tags: [
        "buying a business",
        "nyc",
        "due diligence",
        "sba loans",
        "first-time buyer",
      ],
      status: "PUBLISHED",
      publishedAt: new Date(),
      metaTitle:
        "How to Buy a Business in NYC: Complete Guide | MercatoList",
      metaDescription:
        "Step-by-step guide to buying a business in New York City. Covers finding deals, due diligence, financing with SBA loans, key metrics, and the closing process.",
      authorId: author.id,
    },
  });
  console.log(`Upserted post: "${post1.title}" (${post1.slug})`);

  // Post 2
  const post2 = await prisma.blogPost.upsert({
    where: { slug: "understanding-sde-cash-flow-business-valuations" },
    update: {
      title: "Understanding SDE, Cash Flow, and Business Valuations",
      content: POST_2_CONTENT.trim(),
      excerpt:
        "Learn how Seller's Discretionary Earnings (SDE) works and why it's the most important metric when evaluating a business for sale.",
      category: "Education",
      tags: [
        "sde",
        "cash flow",
        "business valuation",
        "multiples",
        "financials",
      ],
      status: "PUBLISHED",
      publishedAt: new Date(),
      metaTitle:
        "Understanding SDE, Cash Flow & Business Valuations | MercatoList",
      metaDescription:
        "Learn how SDE (Seller's Discretionary Earnings) works, how asking multiples are calculated, and what red flags to watch for in business financials.",
      authorId: author.id,
    },
    create: {
      title: "Understanding SDE, Cash Flow, and Business Valuations",
      slug: "understanding-sde-cash-flow-business-valuations",
      content: POST_2_CONTENT.trim(),
      excerpt:
        "Learn how Seller's Discretionary Earnings (SDE) works and why it's the most important metric when evaluating a business for sale.",
      category: "Education",
      tags: [
        "sde",
        "cash flow",
        "business valuation",
        "multiples",
        "financials",
      ],
      status: "PUBLISHED",
      publishedAt: new Date(),
      metaTitle:
        "Understanding SDE, Cash Flow & Business Valuations | MercatoList",
      metaDescription:
        "Learn how SDE (Seller's Discretionary Earnings) works, how asking multiples are calculated, and what red flags to watch for in business financials.",
      authorId: author.id,
    },
  });
  console.log(`Upserted post: "${post2.title}" (${post2.slug})`);

  // Post 3
  const post3 = await prisma.blogPost.upsert({
    where: { slug: "best-types-of-businesses-to-buy-in-nyc" },
    update: {
      title: "The 10 Best Types of Businesses to Buy in New York City",
      content: POST_3_CONTENT.trim(),
      excerpt:
        "From laundromats to restaurants, discover which business types offer the best opportunities for buyers in NYC.",
      category: "Market Insights",
      tags: [
        "business types",
        "nyc",
        "laundromats",
        "restaurants",
        "investment",
      ],
      status: "PUBLISHED",
      publishedAt: new Date(),
      metaTitle:
        "10 Best Types of Businesses to Buy in NYC | MercatoList",
      metaDescription:
        "Discover the best business types to buy in New York City — from laundromats and delis to e-commerce and franchises. Includes price ranges, pros, and cons.",
      authorId: author.id,
    },
    create: {
      title: "The 10 Best Types of Businesses to Buy in New York City",
      slug: "best-types-of-businesses-to-buy-in-nyc",
      content: POST_3_CONTENT.trim(),
      excerpt:
        "From laundromats to restaurants, discover which business types offer the best opportunities for buyers in NYC.",
      category: "Market Insights",
      tags: [
        "business types",
        "nyc",
        "laundromats",
        "restaurants",
        "investment",
      ],
      status: "PUBLISHED",
      publishedAt: new Date(),
      metaTitle:
        "10 Best Types of Businesses to Buy in NYC | MercatoList",
      metaDescription:
        "Discover the best business types to buy in New York City — from laundromats and delis to e-commerce and franchises. Includes price ranges, pros, and cons.",
      authorId: author.id,
    },
  });
  console.log(`Upserted post: "${post3.title}" (${post3.slug})`);

  console.log("\nBlog seeding complete! 3 posts created/updated.");
}

main()
  .catch((e) => {
    console.error("Error seeding blog posts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
