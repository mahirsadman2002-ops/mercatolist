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

interface GoogleSigninReminderProps {
  name?: string;
  loginUrl: string;
}

export default function GoogleSigninReminder({
  name = "there",
  loginUrl = "https://mercatolist.com/login",
}: GoogleSigninReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Use “Continue with Google” to sign in to MercatoList</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={heading}>
              No password needed
            </Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              You asked to reset your password, but your MercatoList account
              signs in with <strong>Google</strong> — so there&apos;s no password
              to reset. Just use the <strong>“Continue with Google”</strong>
              button on the sign-in page.
            </Text>
            <Section style={{ textAlign: "center", margin: "28px 0" }}>
              <Button style={button} href={loginUrl}>
                Sign in with Google
              </Button>
            </Section>
            <Text style={muted}>
              If you didn&apos;t request this, you can safely ignore this email.
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
