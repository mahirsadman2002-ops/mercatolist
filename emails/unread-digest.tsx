import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface UnreadDigestProps {
  name: string;
  unreadCount: number;
}

export default function UnreadDigest({ name, unreadCount }: UnreadDigestProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>Hi {name}, you have {unreadCount} unread message(s) on MercatoList.</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
