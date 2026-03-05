import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Button,
  Preview,
  Img,
} from "@react-email/components";

interface StatusConfirmationRequestProps {
  listingTitle: string;
  listingCategory: string;
  listingBorough: string;
  askingPrice: string;
  confirmUrl: string;
  updateUrl: string;
  ownerName: string;
}

export default function StatusConfirmationRequest({
  listingTitle = "Sample Business",
  listingCategory = "Restaurants",
  listingBorough = "Manhattan",
  askingPrice = "$500,000",
  confirmUrl = "https://mercatolist.com/api/listings/123/confirm?token=abc",
  updateUrl = "https://mercatolist.com/my-listings",
  ownerName = "there",
}: StatusConfirmationRequestProps) {
  return (
    <Html>
      <Head />
      <Preview>Is your listing still active? Confirm the status of {listingTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>
              Listing Status Check
            </Heading>
            <Text style={paragraph}>
              Hi {ownerName}, it&apos;s been 7 days since you last confirmed the status
              of your listing. Please take a moment to verify it&apos;s still accurate.
            </Text>

            {/* Listing Card */}
            <Section style={listingCard}>
              <Text style={listingTitle_style}>{listingTitle}</Text>
              <Text style={listingMeta}>
                {listingCategory} &bull; {listingBorough} &bull; {askingPrice}
              </Text>
            </Section>

            <Text style={paragraph}>
              Is this listing still <strong>active</strong> and available? If so,
              click the button below to confirm.
            </Text>

            {/* Primary CTA */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={confirmUrl}>
                Yes, Still Active
              </Button>
            </Section>

            <Text style={dividerText}>Need to make changes?</Text>

            {/* Secondary CTA */}
            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={updateUrl}>
                Update My Listing
              </Button>
            </Section>

            <Text style={smallText}>
              If you don&apos;t confirm within 48 hours, your listing may be flagged
              for review by our admin team.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList. All rights reserved.
            </Text>
            <Text style={footerText}>
              NYC&apos;s premier marketplace for buying and selling businesses.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  borderRadius: "8px",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#1a1f36",
  padding: "24px 32px",
  textAlign: "center" as const,
};

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.3px",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  color: "#1a1f36",
  marginBottom: "16px",
  marginTop: 0,
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4a5568",
  margin: "16px 0",
};

const listingCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const listingTitle_style: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 4px",
};

const listingMeta: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  margin: 0,
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "20px 0",
};

const primaryButton: React.CSSProperties = {
  backgroundColor: "#0d9488",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};

const secondaryButton: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  color: "#1a1f36",
  fontSize: "14px",
  fontWeight: 600,
  padding: "10px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};

const dividerText: React.CSSProperties = {
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center" as const,
  margin: "16px 0 8px",
};

const smallText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#94a3b8",
  margin: "24px 0 0",
  textAlign: "center" as const,
};

const hr: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "0",
};

const footer: React.CSSProperties = {
  padding: "24px 32px",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
