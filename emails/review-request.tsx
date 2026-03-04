import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";
import { EmailButton } from "./components/EmailButton";

interface ReviewRequestProps {
  brokerName: string;
  reviewUrl: string;
}

export default function ReviewRequest({ brokerName, reviewUrl }: ReviewRequestProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>{brokerName} has requested your review on MercatoList.</Text>
          <EmailButton href={reviewUrl}>Leave a Review</EmailButton>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
