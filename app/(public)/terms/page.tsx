import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing use of MercatoList, New York City's business-for-sale marketplace.",
  alternates: { canonical: "https://mercatolist.com/terms" },
};

const LAST_UPDATED = "August 7, 2026";

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
        <p>
          Welcome to MercatoList. These Terms of Service (&ldquo;Terms&rdquo;) govern your
          access to and use of the MercatoList website at mercatolist.com and any related
          services (collectively, the &ldquo;Service&rdquo;), operated by MercatoList
          (&ldquo;MercatoList,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By
          accessing or using the Service, creating an account, or submitting a listing or
          inquiry, you agree to be bound by these Terms. If you do not agree, do not use the
          Service.
        </p>

        <h2>1. What MercatoList Is — and Is Not</h2>
        <p>
          MercatoList is an online marketplace and listing platform that connects people
          interested in buying and selling businesses in the New York City area. We provide
          the venue; we are <strong>not</strong> a party to any transaction between users.
        </p>
        <p>
          <strong>
            MercatoList is not a business broker, real estate broker, dealer, financial
            advisor, investment advisor, accountant, appraiser, or law firm.
          </strong>{" "}
          We do not represent buyers or sellers, do not negotiate or facilitate transactions,
          do not hold funds in escrow, and do not receive commissions on sales. Nothing on the
          Service constitutes financial, investment, legal, tax, or accounting advice. You
          should retain your own qualified professionals before entering into any transaction.
        </p>

        <h2>2. No Verification of Listings or Users</h2>
        <p>
          Listings — including asking prices, revenue, cash flow, seller&rsquo;s discretionary
          earnings (SDE), lease terms, financial figures, photos, and all other content — are
          created and provided by users, not by MercatoList. We do{" "}
          <strong>not</strong> independently verify, audit, endorse, or guarantee the accuracy,
          completeness, legality, or reliability of any listing, financial figure, or user
          representation.
        </p>
        <p>
          You are solely responsible for conducting your own due diligence — including
          independently verifying all financial information, licenses, permits, leases, and
          legal matters — before relying on any listing or entering into any transaction. Any
          reliance you place on information found through the Service is strictly at your own
          risk.
        </p>

        <h2>3. Eligibility and Accounts</h2>
        <p>
          You must be at least 18 years old and able to form a binding contract to use the
          Service. You are responsible for maintaining the confidentiality of your account
          credentials and for all activity under your account. You agree to provide accurate
          information and to keep it current. Notify us immediately of any unauthorized use of
          your account.
        </p>

        <h2>4. Listing Rules and User Content</h2>
        <p>By submitting a listing, review, message, or any other content, you represent that:</p>
        <ul>
          <li>You have the right and authority to list the business or post the content;</li>
          <li>
            The information is accurate and not misleading, and you will keep active listings
            up to date and mark them sold or off-market when appropriate;
          </li>
          <li>
            The content does not infringe any third party&rsquo;s intellectual property,
            privacy, or other rights, and does not violate any law;
          </li>
          <li>
            You will not post spam, fraudulent, duplicate, discriminatory, or unlawful content,
            and will not misrepresent your identity or affiliation.
          </li>
        </ul>
        <p>
          You retain ownership of content you submit, but you grant MercatoList a worldwide,
          non-exclusive, royalty-free license to host, display, reproduce, and distribute that
          content for the purpose of operating, promoting, and improving the Service. This
          license continues for content you have made public even after your account is closed,
          to the extent needed for backups, records, and legitimate business purposes.
        </p>

        <h2>5. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Scrape, harvest, or collect other users&rsquo; personal information or contact
            details, whether by automated means or otherwise;
          </li>
          <li>
            Use the Service to send unsolicited communications, or to circumvent our inquiry
            and messaging systems for the purpose of spamming users;
          </li>
          <li>Interfere with, disrupt, or attempt to gain unauthorized access to the Service;</li>
          <li>Post malware, or attempt to probe, scan, or test the vulnerability of any system;</li>
          <li>Use the Service for any unlawful, fraudulent, or deceptive purpose.</li>
        </ul>

        <h2>6. Fees</h2>
        <p>
          Access to core marketplace features is currently offered free of charge. We may
          introduce paid features in the future; any fees will be disclosed before you incur
          them.
        </p>

        <h2>7. Third-Party Links and Services</h2>
        <p>
          The Service may contain links to third-party websites or rely on third-party services
          (for example, mapping, email, image hosting, and authentication providers). We are not
          responsible for the content, policies, or practices of any third party.
        </p>

        <h2>8. Intellectual Property</h2>
        <p>
          The Service — including its design, text, graphics, logos, and software (excluding
          user-submitted content) — is owned by MercatoList and protected by intellectual
          property laws. You may not copy, modify, distribute, or create derivative works from
          the Service without our prior written permission.
        </p>

        <h2>9. Account Termination and Content Removal</h2>
        <p>
          We may, at our sole discretion and without notice, suspend or terminate your account,
          remove or edit any listing or content, or restrict access to the Service — including
          for violations of these Terms, suspected fraud, or to protect the Service or its
          users. You may close your account at any time by contacting us.
        </p>

        <h2>10. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT
          WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
          MERCATOLIST DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
          SECURE, OR THAT ANY LISTING OR INFORMATION IS ACCURATE OR COMPLETE.
        </p>

        <h2>11. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, MERCATOLIST AND ITS OFFICERS, EMPLOYEES, AND
          AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITY,
          ARISING OUT OF OR RELATED TO YOUR USE OF (OR INABILITY TO USE) THE SERVICE OR ANY
          TRANSACTION BETWEEN USERS, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER
          LEGAL THEORY. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE WILL NOT
          EXCEED ONE HUNDRED U.S. DOLLARS ($100).
        </p>

        <h2>12. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless MercatoList from any claims, damages,
          liabilities, and expenses (including reasonable attorneys&rsquo; fees) arising out of
          your use of the Service, your content, your violation of these Terms, or your
          violation of any law or third-party right.
        </p>

        <h2>13. Governing Law and Disputes</h2>
        <p>
          These Terms are governed by the laws of the State of New York, without regard to its
          conflict-of-laws rules. You agree that any dispute arising out of or relating to these
          Terms or the Service will be subject to the exclusive jurisdiction of the state and
          federal courts located in New York County, New York.
        </p>

        <h2>14. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
          updated&rdquo; date above. Material changes will be communicated through the Service or
          by email where appropriate. Your continued use of the Service after changes take effect
          constitutes acceptance of the revised Terms.
        </p>

        <h2>15. Contact</h2>
        <p>
          Questions about these Terms? Reach us through our{" "}
          <Link href="/contact">contact page</Link>.
        </p>

        <p className="text-sm text-muted-foreground">
          See also our <Link href="/privacy">Privacy Policy</Link>, which explains how we handle
          your information.
        </p>
      </div>
    </div>
  );
}
