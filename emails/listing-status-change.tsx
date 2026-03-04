import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface ListingStatusChangeProps {
  listingTitle: string;
  oldStatus: string;
  newStatus: string;
}

export default function ListingStatusChange({ listingTitle, oldStatus, newStatus }: ListingStatusChangeProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>A listing you saved has changed status.</Text>
          <Text>{listingTitle}: {oldStatus} → {newStatus}</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
