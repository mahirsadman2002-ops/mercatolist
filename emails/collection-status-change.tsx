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

interface CollectionStatusChangeProps {
  collectionName: string;
  listingTitle: string;
  oldStatus: string;
  newStatus: string;
  oldPrice?: string;
  newPrice?: string;
  viewUrl: string;
}

function formatStatus(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "UNDER_CONTRACT":
      return "Under Contract";
    case "SOLD":
      return "Sold";
    case "OFF_MARKET":
      return "Off Market";
    default:
      return status;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "#16a34a";
    case "UNDER_CONTRACT":
      return "#d97706";
    case "SOLD":
      return "#dc2626";
    case "OFF_MARKET":
      return "#6b7280";
    default:
      return "#4a5568";
  }
}

export default function CollectionStatusChange({
  collectionName = "Manhattan Restaurants",
  listingTitle = "Joe's Pizza - Astoria",
  oldStatus = "ACTIVE",
  newStatus = "UNDER_CONTRACT",
  oldPrice,
  newPrice,
  viewUrl = "https://mercatolist.com/collections/abc123",
}: CollectionStatusChangeProps) {
  const formatPrice = (price: string) =>
    Number(price).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    });

  const priceChanged = oldPrice && newPrice && oldPrice !== newPrice;

  return (
    <Html>
      <Head />
      <Preview>
        &quot;{listingTitle}&quot; has been updated in &quot;{collectionName}&quot;
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Listing updated in your collection
            </Heading>
            <Text style={paragraph}>
              A listing in <strong>&quot;{collectionName}&quot;</strong> has been
              updated:
            </Text>

            <Section style={changeCard}>
              <Text style={changeTitle}>{listingTitle}</Text>

              <Text style={changeStatus}>
                Status:{" "}
                <span style={{ color: statusColor(oldStatus) }}>
                  {formatStatus(oldStatus)}
                </span>
                {" \u2192 "}
                <span
                  style={{
                    color: statusColor(newStatus),
                    fontWeight: 700,
                  }}
                >
                  {formatStatus(newStatus)}
                </span>
              </Text>

              {priceChanged && (
                <Text style={changePrice}>
                  Price: {formatPrice(oldPrice)} {" \u2192 "}{" "}
                  <strong>{formatPrice(newPrice)}</strong>
                </Text>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={viewUrl}>
                View Collection
              </Button>
            </Section>

            <Text style={smallText}>
              You&apos;re receiving this because this listing is in one of your
              collections. Stay on top of changes that matter to you.
            </Text>
          </Section>

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

const changeCard: React.CSSProperties = {
  backgroundColor: "#f7fafc",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  border: "1px solid #e2e8f0",
};

const changeTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 8px 0",
};

const changeStatus: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
  margin: "0 0 4px 0",
};

const changePrice: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
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

const smallText: React.CSSProperties = {
  fontSize: "13px",
  color: "#718096",
  marginTop: "16px",
  lineHeight: "20px",
};

const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const footer: React.CSSProperties = { padding: "24px 32px" };

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
