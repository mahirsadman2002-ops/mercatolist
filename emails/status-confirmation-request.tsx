import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";
import { EmailButton } from "./components/EmailButton";

interface StatusConfirmationRequestProps {
  listingTitle: string;
  confirmUrl: string;
}

export default function StatusConfirmationRequest({ listingTitle, confirmUrl }: StatusConfirmationRequestProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>Please confirm the status of your listing: {listingTitle}</Text>
          <EmailButton href={confirmUrl}>Confirm Status</EmailButton>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
