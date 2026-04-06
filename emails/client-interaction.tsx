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

interface ClientInteractionProps {
  clientName: string;
  listingTitle: string;
  interested: boolean;
  collectionName: string;
  viewUrl: string;
}

export default function ClientInteraction({
  clientName = "John Smith",
  listingTitle = "Joe's Pizza - Astoria",
  interested = true,
  collectionName = "Manhattan Restaurants",
  viewUrl = "https://mercatolist.com/collections/abc123",
}: ClientInteractionProps) {
  const action = interested ? "Interested" : "Not Interested";
  const actionColor = interested ? "#16a34a" : "#dc2626";

  return (
    <Html>
      <Head />
      <Preview>
        {clientName} marked &quot;{listingTitle}&quot; as {action}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Client feedback received
            </Heading>
            <Text style={paragraph}>
              <strong>{clientName}</strong> reviewed a listing in{" "}
              <strong>&quot;{collectionName}&quot;</strong>:
            </Text>

            <Section style={feedbackCard}>
              <Text style={feedbackTitle}>{listingTitle}</Text>
              <Text style={feedbackStatus}>
                Marked as{" "}
                <span style={{ color: actionColor, fontWeight: 700 }}>
                  {action}
                </span>
              </Text>
            </Section>

            {interested ? (
              <Text style={paragraph}>
                Your client is interested in this listing. Consider reaching out
                to schedule a viewing or share additional details.
              </Text>
            ) : (
              <Text style={paragraph}>
                Your client is not interested in this listing. You may want to
                follow up to understand their preferences better and find a
                better match.
              </Text>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href={viewUrl}>
                View Collection
              </Button>
            </Section>
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

const feedbackCard: React.CSSProperties = {
  backgroundColor: "#f7fafc",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  border: "1px solid #e2e8f0",
};

const feedbackTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 6px 0",
};

const feedbackStatus: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
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
