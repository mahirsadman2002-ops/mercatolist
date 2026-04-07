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

interface InquiryConfirmationProps {
  listingTitle: string;
  senderName: string;
  message: string;
  senderEmail: string;
  browseUrl: string;
}

export default function InquiryConfirmation({
  listingTitle = "Sample Business Listing",
  senderName = "there",
  message = "I'm interested in learning more about this business.",
  senderEmail = "john@example.com",
  browseUrl = "https://mercatolist.com/listings",
}: InquiryConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your inquiry about &quot;{listingTitle}&quot; has been sent</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>
              Inquiry sent successfully
            </Heading>
            <Text style={paragraph}>
              Hi {senderName}, your inquiry about{" "}
              <strong>&quot;{listingTitle}&quot;</strong> has been sent to the
              listing owner. They&apos;ll respond to you at{" "}
              <strong>{senderEmail}</strong>.
            </Text>

            {/* Message preview */}
            <Section style={messageCard}>
              <Text style={messageLabel}>Your message</Text>
              <Text style={messageText}>&quot;{message}&quot;</Text>
            </Section>

            <Text style={paragraph}>
              In the meantime, you can continue browsing other business
              opportunities on MercatoList.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={browseUrl}>
                Browse More Listings
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

const messageLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#718096",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: "8px",
  marginTop: 0,
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
