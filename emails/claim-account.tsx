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

interface ClaimAccountProps {
  name: string;
  claimUrl: string;
  reason: "created" | "listing" | "reminder" | "inquiry";
  listingTitle?: string;
}

export default function ClaimAccount({
  name = "there",
  claimUrl = "https://mercatolist.com/claim",
  reason = "created",
  listingTitle,
}: ClaimAccountProps) {
  const lead =
    reason === "inquiry"
      ? "You have a new buyer inquiry waiting on MercatoList. Claim your account to read it and reply."
      : reason === "listing"
        ? `We've added${listingTitle ? ` "${listingTitle}"` : " a new listing"} to your MercatoList account.`
        : reason === "reminder"
          ? "You still have a listing on MercatoList waiting for you. Claim your account to manage it and respond to buyers."
          : "A MercatoList account has been set up for you so your business can be listed on NYC's business marketplace.";

  return (
    <Html>
      <Head />
      <Preview>Claim your MercatoList account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={heading}>
              Claim your account
            </Heading>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>{lead}</Text>
            <Text style={paragraph}>
              Set a password to take control of your account — from there you can edit your
              listing{reason === "inquiry" ? ", reply to buyers," : ","} and manage everything yourself.
            </Text>
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={claimUrl}>
                Claim My Account
              </Button>
            </Section>
            <Text style={smallText}>
              If you didn&apos;t expect this, you can ignore this email and nothing will happen.
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList — NYC&apos;s business marketplace.
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
const logo: React.CSSProperties = { color: "#ffffff", fontSize: "22px", fontWeight: 700, margin: 0 };
const content: React.CSSProperties = { padding: "32px" };
const heading: React.CSSProperties = { fontSize: "20px", fontWeight: 600, color: "#1a1f36", margin: "0 0 16px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "24px", color: "#4a5568", margin: "12px 0" };
const buttonContainer: React.CSSProperties = { textAlign: "center" as const, margin: "24px 0" };
const primaryButton: React.CSSProperties = {
  backgroundColor: "#0d9488",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 32px",
  textDecoration: "none",
  display: "inline-block",
};
const smallText: React.CSSProperties = { fontSize: "12px", color: "#94a3b8", margin: "20px 0 0" };
const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: 0 };
const footer: React.CSSProperties = { padding: "24px 32px" };
const footerText: React.CSSProperties = { fontSize: "12px", color: "#a0aec0", margin: "4px 0", textAlign: "center" as const };
