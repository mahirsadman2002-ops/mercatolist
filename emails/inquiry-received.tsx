import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface InquiryReceivedProps {
  listingTitle: string;
  senderName: string;
  message: string;
}

export default function InquiryReceived({ listingTitle, senderName, message }: InquiryReceivedProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>New inquiry on your listing: {listingTitle}</Text>
          <Text>From: {senderName}</Text>
          <Text>{message}</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
