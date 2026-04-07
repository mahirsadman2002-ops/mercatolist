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

interface GenericEmailProps {
  senderName: string;
  subject: string;
  message: string;
  replyTo?: string;
}

export default function GenericEmail({
  senderName = "A MercatoList user",
  subject = "Message from MercatoList",
  message = "",
  replyTo,
}: GenericEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              {subject}
            </Heading>
            <Text style={paragraph}>
              <strong>{senderName}</strong> sent you a message via MercatoList:
            </Text>
            <Section style={messageBox}>
              <Text style={messageText}>{message}</Text>
            </Section>
            <Text style={replyNote}>
              You can reply directly to this email — your response will be added to the conversation on MercatoList. Or visit the site to respond there.
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

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4a5568",
  margin: "16px 0",
};

const messageBox: React.CSSProperties = {
  backgroundColor: "#f7fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
};

const messageText: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#2d3748",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
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
  borderTop: "1px solid #e2e8f0",
  margin: 0,
};

const footer: React.CSSProperties = {
  padding: "20px 32px",
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
};
