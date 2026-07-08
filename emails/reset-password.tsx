import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  name?: string;
  resetUrl: string;
}

export default function ResetPasswordEmail({
  name = "there",
  resetUrl = "https://mercatolist.com/reset-password",
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your MercatoList password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={heading}>
              Reset your password
            </Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              We got a request to reset your MercatoList password. Click the
              button below to choose a new one. This link expires in 1 hour.
            </Text>
            <Section style={{ textAlign: "center", margin: "28px 0" }}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>
            <Text style={muted}>
              If you didn&apos;t request this, you can safely ignore this email —
              your password won&apos;t change.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" };
const container = { maxWidth: "480px", margin: "0 auto", padding: "24px 0" };
const header = { padding: "0 0 16px", textAlign: "center" as const };
const logo = { fontSize: "22px", fontWeight: 700, color: "#1a1f36", margin: 0 };
const content = { background: "#ffffff", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const heading = { fontSize: "20px", color: "#1a1f36", margin: "0 0 12px" };
const text = { fontSize: "15px", lineHeight: "1.6", color: "#3c4257", margin: "0 0 12px" };
const muted = { fontSize: "13px", lineHeight: "1.6", color: "#8792a2", margin: "12px 0 0" };
const button = { backgroundColor: "#0d9488", color: "#ffffff", padding: "12px 28px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "15px" };
