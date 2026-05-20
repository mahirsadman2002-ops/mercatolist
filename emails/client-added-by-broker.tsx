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

interface ClientAddedByBrokerProps {
  recipientName: string;
  brokerName: string;
  brokerageName?: string | null;
  dashboardUrl: string;
}

export default function ClientAddedByBroker({
  recipientName = "Alex",
  brokerName = "Jane Advisor",
  brokerageName,
  dashboardUrl = "https://mercatolist.com/saved",
}: ClientAddedByBrokerProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {brokerName} added you as a client on MercatoList
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              {brokerName} added you as a client
            </Heading>
            <Text style={paragraph}>
              Hi {recipientName}, <strong>{brokerName}</strong>
              {brokerageName ? ` at ${brokerageName}` : ""} just added you as
              a client on MercatoList.
            </Text>
            <Text style={paragraph}>
              What this means for you:
            </Text>

            <Section style={bulletSection}>
              <Text style={bullet}>
                <strong>•</strong> They can send you specific business listings
                that match what you&apos;re looking for.
              </Text>
              <Text style={bullet}>
                <strong>•</strong> They can share collections with you — curated
                lists of businesses to review and discuss together.
              </Text>
              <Text style={bullet}>
                <strong>•</strong> You&apos;ll get notifications when they send
                you listings or leave notes on a collection.
              </Text>
              <Text style={bullet}>
                <strong>•</strong> Your account stays yours. They don&apos;t see
                your saved listings, searches, or anything outside the work
                you&apos;re doing together.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                Open MercatoList
              </Button>
            </Section>

            <Text style={replyNote}>
              This is a no-reply email. To respond to {brokerName}, sign in
              and message them directly.
            </Text>
          </Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList. All rights reserved.
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

const bulletSection: React.CSSProperties = {
  margin: "12px 0",
};

const bullet: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4a5568",
  margin: "8px 0",
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

const replyNote: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#718096",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
  fontStyle: "italic" as const,
};

const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const footer: React.CSSProperties = { padding: "24px 32px" };

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
