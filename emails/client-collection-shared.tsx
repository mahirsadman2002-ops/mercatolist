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

interface ClientCollectionSharedProps {
  advisorName: string;
  advisorCompany?: string;
  collectionName: string;
  listingCount: number;
  viewUrl: string;
  personalMessage?: string;
}

export default function ClientCollectionShared({
  advisorName = "Jane Advisor",
  advisorCompany,
  collectionName = "Top Picks for You",
  listingCount = 5,
  viewUrl = "https://mercatolist.com/collections/abc123",
  personalMessage,
}: ClientCollectionSharedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {advisorName} shared a collection of {String(listingCount)} listing
        {listingCount !== 1 ? "s" : ""} with you
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              A curated collection for you
            </Heading>
            <Text style={paragraph}>
              <strong>{advisorName}</strong>
              {advisorCompany && ` from ${advisorCompany}`} shared a collection
              of business listings with you:
            </Text>

            <Section style={collectionCard}>
              <Text style={collectionName_}>
                &quot;{collectionName}&quot;
              </Text>
              <Text style={collectionMeta}>
                {listingCount} listing{listingCount !== 1 ? "s" : ""} curated
                for you
              </Text>
            </Section>

            {personalMessage && (
              <Section style={messageCard}>
                <Text style={messageLabel}>
                  Note from {advisorName}:
                </Text>
                <Text style={messageText}>
                  &quot;{personalMessage}&quot;
                </Text>
              </Section>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href={viewUrl}>
                View Collection
              </Button>
            </Section>

            <Text style={smallText}>
              Your advisor hand-picked these listings based on your preferences.
              Browse through and let them know which ones interest you.
            </Text>

            <Text style={replyNote}>
              This is a no-reply email. To respond, visit MercatoList and continue the conversation there.
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

const collectionCard: React.CSSProperties = {
  backgroundColor: "#f7fafc",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  border: "1px solid #e2e8f0",
  textAlign: "center" as const,
};

const collectionName_: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 4px 0",
};

const collectionMeta: React.CSSProperties = {
  fontSize: "14px",
  color: "#718096",
  margin: 0,
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
