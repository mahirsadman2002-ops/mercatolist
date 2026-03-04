import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface SavedSearchMatchProps {
  searchName: string;
  matchCount: number;
}

export default function SavedSearchMatch({ searchName, matchCount }: SavedSearchMatchProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>{matchCount} new listing(s) match your saved search: {searchName}</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
