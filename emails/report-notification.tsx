import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Button,
  Preview,
} from "@react-email/components";

interface ReportNotificationProps {
  reportType: string;
  reportReason: string;
  reportDetails: string;
  reporterName: string;
  reporterEmail: string;
  targetTitle: string;
  adminUrl: string;
}

export default function ReportNotification({
  reportType = "LISTING",
  reportReason = "INACCURATE",
  reportDetails = "This listing has incorrect financial information.",
  reporterName = "John Doe",
  reporterEmail = "john@example.com",
  targetTitle = "Sample Business Listing",
  adminUrl = "https://mercatolist.com/admin/reports",
}: ReportNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New {reportType.toLowerCase()} report: {reportReason.toLowerCase()}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>
              New Report Filed
            </Heading>
            <Text style={paragraph}>
              A new report has been submitted that requires your attention.
            </Text>

            {/* Report Details Card */}
            <Section style={detailCard}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <tbody>
                  <tr>
                    <td style={labelCell}>Type</td>
                    <td style={valueCell}>
                      <span style={typeBadge}>{reportType}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={labelCell}>Reason</td>
                    <td style={valueCell}>{reportReason.replace("_", " ")}</td>
                  </tr>
                  <tr>
                    <td style={labelCell}>Target</td>
                    <td style={valueCell}>{targetTitle}</td>
                  </tr>
                  <tr>
                    <td style={labelCell}>Reporter</td>
                    <td style={valueCell}>{reporterName} ({reporterEmail})</td>
                  </tr>
                  {reportDetails && (
                    <tr>
                      <td style={labelCell}>Details</td>
                      <td style={valueCell}>{reportDetails}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={adminUrl}>
                Review in Admin Dashboard
              </Button>
            </Section>

            <Text style={smallText}>
              This is an automated notification. Please review and take appropriate action.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList. All rights reserved.
            </Text>
            <Text style={footerText}>
              NYC&apos;s premier marketplace for buying and selling businesses.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  borderRadius: "8px",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#1a1f36",
  padding: "24px 32px",
  textAlign: "center" as const,
};

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.3px",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  color: "#1a1f36",
  marginBottom: "16px",
  marginTop: 0,
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4a5568",
  margin: "16px 0",
};

const detailCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const labelCell: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#64748b",
  padding: "6px 12px 6px 0",
  verticalAlign: "top",
  width: "80px",
};

const valueCell: React.CSSProperties = {
  fontSize: "14px",
  color: "#1a1f36",
  padding: "6px 0",
  verticalAlign: "top",
};

const typeBadge: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  fontSize: "11px",
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: "4px",
  textTransform: "uppercase" as const,
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const primaryButton: React.CSSProperties = {
  backgroundColor: "#0d9488",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};

const smallText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#94a3b8",
  margin: "16px 0 0",
  textAlign: "center" as const,
};

const hr: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "0",
};

const footer: React.CSSProperties = {
  padding: "24px 32px",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
