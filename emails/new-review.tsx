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
} from "@react-email/components";

interface NewReviewEmailProps {
  advisorName: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  profileUrl: string;
}

function renderStars(rating: number): string {
  const filled = Math.min(Math.max(Math.round(rating), 0), 5);
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

export default function NewReviewEmail({
  advisorName = "there",
  reviewerName = "A Client",
  rating = 5,
  reviewText = "Great advisor, very professional and knowledgeable about the NYC market.",
  profileUrl = "https://mercatolist.com/advisors/example",
}: NewReviewEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`You received a new ${rating}-star review from ${reviewerName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>
              You received a new review!
            </Heading>
            <Text style={paragraph}>
              Hi {advisorName}, <strong>{reviewerName}</strong> left you a
              review on your MercatoList profile.
            </Text>

            <Section style={reviewCard}>
              <Text style={starsStyle}>{renderStars(rating)}</Text>
              <Text style={reviewerLabel}>
                Review by {reviewerName}
              </Text>
              <Text style={reviewTextStyle}>
                &quot;{reviewText}&quot;
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={profileUrl}>
                View on Your Profile
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList. All rights
              reserved.
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
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

const content: React.CSSProperties = { padding: "32px" };

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

const reviewCard: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  borderLeft: "3px solid #0d9488",
};

const starsStyle: React.CSSProperties = {
  fontSize: "24px",
  color: "#d69e2e",
  margin: "0 0 8px 0",
  letterSpacing: "2px",
};

const reviewerLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 10px 0",
};

const reviewTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
  fontStyle: "italic" as const,
  lineHeight: "22px",
  margin: 0,
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button: React.CSSProperties = {
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

const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const footer: React.CSSProperties = { padding: "24px 32px" };

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
