import { Html, Head, Body, Container, Text } from "@react-email/components";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface ReportNotificationProps {
  reportType: string;
  reportReason: string;
}

export default function ReportNotification({ reportType, reportReason }: ReportNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", padding: "24px" }}>
          <EmailHeader />
          <Text>New {reportType} report submitted: {reportReason}</Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
