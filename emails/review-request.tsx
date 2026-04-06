import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Heading,
  Button,
  Preview,
} from "@react-email/components";

interface ReviewRequestEmailProps {
  brokerName: string;
  brokerageName?: string;
  reviewUrl: string;
}

export default function ReviewRequestEmail({
  brokerName = "Your Advisor",
  brokerageName,
  reviewUrl = "https://mercatolist.com/advisors/example/review?token=example",
}: ReviewRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {brokerName} would like your review on MercatoList
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
              Share your experience
            </Heading>
            <Text style={paragraph}>
              <strong>{brokerName}</strong>
              {brokerageName ? ` of ${brokerageName}` : ""} has requested
              your review on MercatoList. Your feedback helps other buyers
              and sellers find the right advisor.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={reviewUrl}>
                Leave a Review
              </Button>
            </Section>
            <Text style={paragraph}>
              This link will expire in <strong>30 days</strong>. Your review
              will be publicly visible on the advisor&apos;s profile.
            </Text>
            <Text style={smallText}>
              If the button doesn&apos;t work, copy and paste this link into
              your browser:
            </Text>
            <Text style={linkText}>
              <Link href={reviewUrl} style={link}>
                {reviewUrl}
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList. All rights
              reserved.
            </Text>
            <Text style={footerText}>
              NYC&apos;s premier marketplace for buying and selling
              businesses.
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

const smallText: React.CSSProperties = {
  fontSize: "13px",
  color: "#718096",
  marginTop: "24px",
};

const linkText: React.CSSProperties = {
  fontSize: "13px",
  wordBreak: "break-all" as const,
};

const link: React.CSSProperties = {
  color: "#0d9488",
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
