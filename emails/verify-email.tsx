import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";
import { EmailButton } from "./components/EmailButton";

interface VerifyEmailProps {
  name: string;
  verificationUrl: string;
}

export default function VerifyEmail({ name, verificationUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>Hi {name}, please verify your email address.</Text>
          <EmailButton href={verificationUrl}>Verify Email</EmailButton>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
