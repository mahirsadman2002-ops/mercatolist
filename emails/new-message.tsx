import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";
import { EmailButton } from "./components/EmailButton";

interface NewMessageProps {
  senderName: string;
  listingTitle: string;
  messagePreview: string;
  threadUrl: string;
}

export default function NewMessage({ senderName, listingTitle, messagePreview, threadUrl }: NewMessageProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>New message from {senderName} about {listingTitle}</Text>
          <Text>&quot;{messagePreview}&quot;</Text>
          <EmailButton href={threadUrl}>View Conversation</EmailButton>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
