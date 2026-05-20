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

interface CollectionAccessRequestedProps {
  requesterName: string;
  requesterEmail: string;
  collectionName: string;
  reviewUrl: string;
}

export default function CollectionAccessRequested({
  requesterName = "Alex Buyer",
  requesterEmail = "alex@example.com",
  collectionName = "Manhattan Restaurants",
  reviewUrl = "https://mercatolist.com/collections/abc123",
}: CollectionAccessRequestedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {requesterName} requested access to &quot;{collectionName}&quot;
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              New collection access request
            </Heading>
            <Text style={paragraph}>
              <strong>{requesterName}</strong> ({requesterEmail}) just requested
              access to your collection{" "}
              <strong>&quot;{collectionName}&quot;</strong>.
            </Text>

            <Section style={callout}>
              <Text style={calloutText}>
                Open the collection to approve or deny the request. You can
                also confirm with {requesterName} directly before approving.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={reviewUrl}>
                Review Request
              </Button>
            </Section>

            <Text style={replyNote}>
              This is a no-reply email. Manage requests from MercatoList.
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

const callout: React.CSSProperties = {
  backgroundColor: "#fef9c3",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  borderLeft: "3px solid #ca8a04",
};

const calloutText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#713f12",
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
