import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface BrokerWelcomeProps {
  name: string;
  brokerageName: string;
}

export default function BrokerWelcome({ name, brokerageName }: BrokerWelcomeProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>Welcome to MercatoList, {name} from {brokerageName}!</Text>
          <Text>Start listing businesses and connecting with buyers across NYC.</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
