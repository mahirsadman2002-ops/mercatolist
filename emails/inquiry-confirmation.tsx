import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface InquiryConfirmationProps {
  listingTitle: string;
}

export default function InquiryConfirmation({ listingTitle }: InquiryConfirmationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>Your inquiry about &quot;{listingTitle}&quot; has been sent.</Text>
          <Text>The listing owner will be in touch soon.</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
