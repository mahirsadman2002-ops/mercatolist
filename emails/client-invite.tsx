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

interface ClientInviteProps {
  advisorName: string;
  advisorCompany?: string;
  personalMessage?: string;
  joinUrl: string;
}

export default function ClientInvite({
  advisorName = "Jane Advisor",
  advisorCompany,
  personalMessage,
  joinUrl = "https://mercatolist.com/register?ref=advisor-abc123",
}: ClientInviteProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {advisorName} invited you to join MercatoList
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              You&apos;re invited to MercatoList
            </Heading>
            <Text style={paragraph}>
              <strong>{advisorName}</strong>
              {advisorCompany && ` from ${advisorCompany}`} has invited you to
              join MercatoList, NYC&apos;s premier marketplace for buying and
              selling businesses.
            </Text>

            {personalMessage && (
              <Section style={messageCard}>
                <Text style={messageLabel}>
                  Message from {advisorName}:
                </Text>
                <Text style={messageText}>
                  &quot;{personalMessage}&quot;
                </Text>
              </Section>
            )}

            <Section style={listSection}>
              <Text style={listItem}>
                <strong>Browse curated listings</strong> — Your advisor can share
                hand-picked businesses that match your criteria
              </Text>
              <Text style={listItem}>
                <strong>Save and organize</strong> — Keep track of businesses
                you&apos;re interested in with collections
              </Text>
              <Text style={listItem}>
                <strong>Stay informed</strong> — Get alerts when listings change
                status or new opportunities appear
              </Text>
              <Text style={listItem}>
                <strong>Collaborate</strong> — Work directly with your advisor
                through the platform
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={joinUrl}>
                Join MercatoList
              </Button>
            </Section>

            <Text style={smallText}>
              Creating an account is free and takes less than a minute. Your
              advisor will be linked to your account automatically.
            </Text>
          </Section>

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

const messageCard: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
  borderLeft: "3px solid #0d9488",
};

const messageLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 6px 0",
};

const messageText: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
  fontStyle: "italic" as const,
  lineHeight: "22px",
  margin: 0,
};

const listSection: React.CSSProperties = {
  margin: "20px 0",
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

const smallText: React.CSSProperties = {
  fontSize: "13px",
  color: "#718096",
  marginTop: "16px",
  lineHeight: "20px",
};

const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const footer: React.CSSProperties = { padding: "24px 32px" };

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
