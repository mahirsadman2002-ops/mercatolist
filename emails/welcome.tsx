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

interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({
  name = "there",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to MercatoList - NYC&apos;s Business Marketplace</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>
              Welcome to MercatoList!
            </Heading>
            <Text style={paragraph}>
              Hi {name}, your account is verified and ready to go. Here&apos;s
              what you can do:
            </Text>
            <Section style={listSection}>
              <Text style={listItem}>
                <strong>Browse listings</strong> — Discover businesses for sale
                across all five NYC boroughs
              </Text>
              <Text style={listItem}>
                <strong>Save favorites</strong> — Keep track of businesses
                you&apos;re interested in
              </Text>
              <Text style={listItem}>
                <strong>Contact sellers</strong> — Send inquiries directly to
                business owners and advisors
              </Text>
              <Text style={listItem}>
                <strong>Set up alerts</strong> — Get notified when new listings
                match your criteria
              </Text>
            </Section>
            <Section style={buttonContainer}>
              <Button style={button} href="https://mercatolist.com/listings">
                Browse Businesses
              </Button>
            </Section>
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

const listSection: React.CSSProperties = {
  margin: "16px 0",
};

const listItem: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4a5568",
  margin: "8px 0",
  paddingLeft: "8px",
  borderLeft: "3px solid #0d9488",
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
