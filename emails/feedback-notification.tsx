import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Preview,
} from "@react-email/components";

interface FeedbackNotificationProps {
  type: string;
  message: string;
  email: string;
  pageUrl: string;
  submittedBy: string;
}

export default function FeedbackNotification({
  type = "BUG",
  message = "Something looks off on the listing page.",
  email = "anonymous",
  pageUrl = "https://mercatolist.com/listings",
  submittedBy = "Anonymous visitor",
}: FeedbackNotificationProps) {
  const label = type === "IDEA" ? "Idea / Suggestion" : "Bug Report";

  return (
    <Html>
      <Head />
      <Preview>New {label} submitted on MercatoList</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              New {label}
            </Heading>

            <Section style={card}>
              <Text style={message_style}>{message}</Text>
            </Section>

            <Text style={metaRow}>
              <strong>From:</strong> {submittedBy}
            </Text>
            <Text style={metaRow}>
              <strong>Reply-to:</strong> {email}
            </Text>
            <Text style={metaRow}>
              <strong>Page:</strong> {pageUrl}
            </Text>

            <Text style={smallText}>
              Manage this in the admin dashboard under Feedback.
            </Text>
          </Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList — internal notification.
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
  fontSize: "20px",
  fontWeight: 600,
  color: "#1a1f36",
  marginBottom: "16px",
  marginTop: 0,
};

const card: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 20px",
};

const message_style: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#1a1f36",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const metaRow: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
  margin: "6px 0",
};

const smallText: React.CSSProperties = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "24px 0 0",
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
