import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface MarketingNudgeProps {
  name: string;
  savedCount: number;
}

export default function MarketingNudge({ name, savedCount }: MarketingNudgeProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>Hi {name}, check back on your {savedCount} saved listing(s)!</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
