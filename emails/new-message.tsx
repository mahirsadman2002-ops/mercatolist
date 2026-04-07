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

interface NewMessageProps {
  senderName: string;
  listingTitle: string;
  messagePreview: string;
  threadUrl: string;
}

export default function NewMessage({
  senderName = "John Doe",
  listingTitle = "Sample Business Listing",
  messagePreview = "Hi, I'm interested in learning more about this business.",
  threadUrl = "https://mercatolist.com/inquiries",
}: NewMessageProps) {
  return (
    <Html>
      <Head />
      <Preview>New message from {senderName} about {listingTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>
              New message received
            </Heading>
            <Text style={paragraph}>
              <strong>{senderName}</strong> sent you a message about{" "}
              <strong>&quot;{listingTitle}&quot;</strong>:
            </Text>

            {/* Message preview card */}
            <Section style={messageCard}>
              <Text style={messageText}>&quot;{messagePreview}&quot;</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={threadUrl}>
                View Conversation
              </Button>
            </Section>

            <Text style={replyNote}>
              You can reply directly to this email — your response will be added to the conversation on MercatoList. Or visit the site to respond there.
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

const messageCard: React.CSSProperties = {
  backgroundColor: "#f7fafc",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: "1px solid #e2e8f0",
};

const messageText: React.CSSProperties = {
  fontSize: "15px",
  color: "#4a5568",
  fontStyle: "italic" as const,
  lineHeight: "24px",
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
