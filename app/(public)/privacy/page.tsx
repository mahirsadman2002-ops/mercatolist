import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MercatoList collects, uses, and protects your personal information on New York City's business-for-sale marketplace.",
  alternates: { canonical: "https://mercatolist.com/privacy" },
};

const LAST_UPDATED = "August 7, 2026";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
        <p>
          This Privacy Policy explains how MercatoList (&ldquo;MercatoList,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and shares
          information when you use mercatolist.com and related services (the
          &ldquo;Service&rdquo;). By using the Service, you agree to the practices described
          here.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          <strong>Information you provide directly:</strong>
        </p>
        <ul>
          <li>
            <strong>Account information</strong> — your name, email address, password (stored
            only in hashed form), and, if you sign in with Google, the basic profile information
            Google shares with us (name, email, profile image).
          </li>
          <li>
            <strong>Profile information</strong> — optional details such as display name, phone
            number, bio, website, avatar, and, for brokers and advisors, brokerage name,
            brokerage phone, and social media links.
          </li>
          <li>
            <strong>Listing information</strong> — business details, financial figures,
            location, and photos you submit when creating a listing.
          </li>
          <li>
            <strong>Communications</strong> — inquiries, messages, reviews, reports, and
            anything you send to us or other users through the Service.
          </li>
          <li>
            <strong>Buyer preferences and saved data</strong> — saved listings, collections,
            saved searches, and buy-box preferences you configure.
          </li>
        </ul>
        <p>
          <strong>Information collected automatically:</strong> basic usage and device
          information (such as pages viewed, listing view counts, approximate location derived
          from your IP address, browser type, and similar log data), collected to operate and
          improve the Service and, where used, through cookies and similar technologies.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide, maintain, and improve the Service and your account;</li>
          <li>
            To display your listings and public profile to other users and to route inquiries
            and messages between users;
          </li>
          <li>
            To send transactional communications — for example, email verification, inquiry and
            message notifications, saved-search alerts, listing status confirmations, and
            account-related notices;
          </li>
          <li>
            To send marketing or promotional communications where permitted (you can opt out at
            any time — see &ldquo;Your Choices&rdquo;);
          </li>
          <li>To detect, prevent, and address fraud, abuse, security, and technical issues;</li>
          <li>To comply with legal obligations and enforce our Terms of Service.</li>
        </ul>

        <h2>3. How We Share Information</h2>
        <p>
          <strong>We do not sell your personal information.</strong> We share information only as
          follows:
        </p>
        <ul>
          <li>
            <strong>Publicly, at your direction</strong> — information in your listings and
            public profile (including your name/brokerage and, if you enable it, your phone
            number) is visible to other users and the public. We deliberately do{" "}
            <strong>not</strong> expose seller/broker email addresses publicly; contact happens
            through our inquiry system, and phone numbers are shown only when you opt in.
          </li>
          <li>
            <strong>With other users</strong> — when you send or receive an inquiry or message,
            the relevant parties see the information needed to communicate.
          </li>
          <li>
            <strong>With service providers</strong> who process data on our behalf under
            contract (see below).
          </li>
          <li>
            <strong>For legal reasons</strong> — to comply with law, respond to lawful requests,
            or protect the rights, safety, and property of MercatoList, our users, or the
            public.
          </li>
          <li>
            <strong>In a business transfer</strong> — in connection with a merger, acquisition,
            or sale of assets, subject to this Policy.
          </li>
        </ul>

        <h2>4. Service Providers We Use</h2>
        <p>
          We rely on trusted third parties to run the Service. Each processes only the data
          needed for its function:
        </p>
        <ul>
          <li>
            <strong>Neon</strong> — database hosting (stores your account and listing data).
          </li>
          <li>
            <strong>Vercel</strong> — application hosting and delivery.
          </li>
          <li>
            <strong>Amazon Web Services (S3)</strong> — storage of uploaded listing and profile
            photos.
          </li>
          <li>
            <strong>Google</strong> — optional sign-in (OAuth) authentication.
          </li>
          <li>
            <strong>Mapbox</strong> — maps and address lookup on listing and browse pages.
          </li>
          <li>
            <strong>Resend</strong> — delivery of transactional and account emails.
          </li>
          <li>
            <strong>Mailchimp</strong> — delivery of newsletters and marketing emails (for users
            who have not opted out).
          </li>
        </ul>

        <h2>5. Cookies</h2>
        <p>
          We use cookies and similar technologies that are necessary to keep you signed in,
          remember preferences, and understand basic usage of the Service. You can control
          cookies through your browser settings; disabling certain cookies may affect
          functionality such as staying logged in.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We keep your information for as long as your account is active or as needed to provide
          the Service, and thereafter as necessary to comply with legal obligations, resolve
          disputes, maintain security, and enforce our agreements. You may request deletion of
          your account and associated personal information (see below).
        </p>

        <h2>7. Data Security</h2>
        <p>
          We take reasonable administrative and technical measures to protect your information —
          including hashing passwords, encrypting data in transit, restricting access, and
          limiting the exposure of sensitive contact details. No method of transmission or
          storage is completely secure, however, and we cannot guarantee absolute security.
        </p>

        <h2>8. Your Choices and Rights</h2>
        <ul>
          <li>
            <strong>Access and update</strong> — you can view and edit your account and profile
            information in your dashboard settings.
          </li>
          <li>
            <strong>Marketing opt-out</strong> — you can unsubscribe from marketing emails using
            the link in any such email; transactional emails necessary to operate your account
            will still be sent.
          </li>
          <li>
            <strong>Deletion</strong> — you can request deletion of your account and personal
            information by contacting us.
          </li>
          <li>
            <strong>Regional rights</strong> — depending on where you live (for example,
            California or other U.S. states with privacy laws), you may have additional rights
            to access, correct, delete, or restrict use of your personal information, and to not
            be discriminated against for exercising them. Contact us to make a request.
          </li>
        </ul>

        <h2>9. Children&rsquo;s Privacy</h2>
        <p>
          The Service is not directed to children under 18, and we do not knowingly collect
          personal information from them. If you believe a child has provided us information,
          contact us and we will delete it.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Policy from time to time. When we do, we will revise the &ldquo;Last
          updated&rdquo; date above and, for material changes, provide notice through the Service
          or by email where appropriate.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions or requests about your privacy? Reach us through our{" "}
          <Link href="/contact">contact page</Link>.
        </p>

        <p className="text-sm text-muted-foreground">
          See also our <Link href="/terms">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
