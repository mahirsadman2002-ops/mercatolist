import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface CollectionUpdateProps {
  collectionName: string;
  clientName: string;
}

export default function CollectionUpdate({ collectionName, clientName }: CollectionUpdateProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>Hi {clientName}, your collection &quot;{collectionName}&quot; has been updated.</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
