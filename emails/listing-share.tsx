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
  Img,
} from "@react-email/components";

interface ListingShareEmailProps {
  senderName: string;
  recipientName?: string;
  listingTitle: string;
  listingPrice: string;
  listingCategory: string;
  listingNeighborhood: string;
  listingBorough: string;
  listingPhotoUrl?: string;
  listingUrl: string;
  personalMessage?: string;
}

export default function ListingShareEmail({
  senderName = "A MercatoList User",
  recipientName,
  listingTitle = "Joe's Pizza - Astoria",
  listingPrice = "350000",
  listingCategory = "Restaurants",
  listingNeighborhood = "Astoria",
  listingBorough = "QUEENS",
  listingPhotoUrl,
  listingUrl = "https://mercatolist.com/listings/joes-pizza-astoria",
  personalMessage,
}: ListingShareEmailProps) {
  const formattedPrice = Number(listingPrice).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });
  const boroughLabel =
    listingBorough.charAt(0) +
    listingBorough.slice(1).toLowerCase().replace("_", " ");

  return (
    <Html>
      <Head />
      <Preview>
        {senderName} shared a listing with you: {listingTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={heading}>
              {senderName} shared a listing with you
            </Heading>
            <Text style={paragraph}>
              Hi {recipientName || "there"}, <strong>{senderName}</strong>{" "}
              thought you might be interested in this business listing on
              MercatoList.
            </Text>

            {personalMessage && (
              <Section style={messageCard}>
                <Text style={messageLabel}>
                  Message from {senderName}:
                </Text>
                <Text style={messageText}>
                  &quot;{personalMessage}&quot;
                </Text>
              </Section>
            )}

            <Section style={listingCard}>
              {listingPhotoUrl && (
                <Img
                  src={listingPhotoUrl}
                  alt={listingTitle}
                  width="536"
                  height="200"
                  style={listingImage}
                />
              )}
              <Section style={listingBody}>
                <Text style={listingTitleStyle}>{listingTitle}</Text>
                <Text style={listingMeta}>
                  {listingCategory} &bull; {listingNeighborhood},{" "}
                  {boroughLabel}
                </Text>
                <Text style={listingPriceStyle}>{formattedPrice}</Text>
              </Section>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={listingUrl}>
                View Listing on MercatoList
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} MercatoList. All rights
              reserved.
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
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

const content: React.CSSProperties = { padding: "32px" };

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

const messageCard: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
  borderLeft: "3px solid #0d9488",
};

const messageLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 6px 0",
};

const messageText: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
  fontStyle: "italic" as const,
  lineHeight: "22px",
  margin: 0,
};

const listingCard: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  overflow: "hidden",
  margin: "20px 0",
};

const listingImage: React.CSSProperties = {
  objectFit: "cover" as const,
  width: "100%",
  display: "block",
};

const listingBody: React.CSSProperties = { padding: "16px" };

const listingTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 4px 0",
};

const listingMeta: React.CSSProperties = {
  fontSize: "13px",
  color: "#718096",
  margin: "0 0 8px 0",
};

const listingPriceStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#1a1f36",
  margin: 0,
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button: React.CSSProperties = {
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

const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const footer: React.CSSProperties = { padding: "24px 32px" };

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
