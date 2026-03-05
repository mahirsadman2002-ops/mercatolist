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
  Column,
  Row,
} from "@react-email/components";

interface CollectionListing {
  id: string;
  slug: string;
  title: string;
  category: string;
  askingPrice: string;
  neighborhood: string;
  borough: string;
  photoUrl?: string | null;
}

interface CollectionEmailProps {
  collectionName: string;
  collectionDescription?: string | null;
  clientName?: string | null;
  personalMessage?: string | null;
  listings: CollectionListing[];
  sender: {
    name: string;
    email: string;
    phone?: string | null;
    brokerageName?: string | null;
  };
}

export function CollectionEmail({
  collectionName = "Manhattan Restaurants",
  collectionDescription,
  clientName,
  personalMessage,
  listings = [],
  sender = {
    name: "Jane Broker",
    email: "jane@example.com",
    phone: "(212) 555-0100",
    brokerageName: "NYC Business Brokers",
  },
}: CollectionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {sender.name} shared listings with you: {collectionName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              {collectionName}
            </Heading>

            <Text style={paragraph}>
              Hi {clientName || "there"},{" "}
              <strong>{sender.name}</strong>
              {sender.brokerageName && ` from ${sender.brokerageName}`} has
              curated a collection of listings for you.
            </Text>

            {collectionDescription && (
              <Text style={descriptionText}>{collectionDescription}</Text>
            )}

            {personalMessage && (
              <Section style={messageCard}>
                <Text style={messageLabel}>Personal note from {sender.name}:</Text>
                <Text style={messageText}>
                  &quot;{personalMessage}&quot;
                </Text>
              </Section>
            )}

            <Text style={sectionHeading}>
              {listings.length} Listing{listings.length !== 1 ? "s" : ""}
            </Text>

            {listings.map((listing, i) => {
              const price = Number(listing.askingPrice).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              });
              const url = `https://mercatolist.com/listings/${listing.slug}`;
              const boroughLabel =
                listing.borough.charAt(0) +
                listing.borough.slice(1).toLowerCase().replace("_", " ");

              return (
                <Section key={String(i)} style={listingCard}>
                  <Row>
                    {listing.photoUrl && (
                      <Column style={listingImageCol}>
                        <Img
                          src={listing.photoUrl}
                          alt={listing.title}
                          width="90"
                          height="68"
                          style={listingThumb}
                        />
                      </Column>
                    )}
                    <Column style={listingInfoCol}>
                      <Text style={listingTitle_}>
                        <a href={url} style={listingLink}>
                          {listing.title}
                        </a>
                      </Text>
                      <Text style={listingMeta}>
                        {listing.category} &bull; {listing.neighborhood},{" "}
                        {boroughLabel}
                      </Text>
                      <Text style={listingPrice}>{price}</Text>
                    </Column>
                  </Row>
                </Section>
              );
            })}

            {/* Broker contact info */}
            <Hr style={divider} />
            <Section style={brokerSection}>
              <Text style={brokerHeading}>Your Broker</Text>
              <Text style={brokerName}>{sender.name}</Text>
              {sender.brokerageName && (
                <Text style={brokerDetail}>{sender.brokerageName}</Text>
              )}
              <Text style={brokerDetail}>{sender.email}</Text>
              {sender.phone && (
                <Text style={brokerDetail}>{sender.phone}</Text>
              )}
            </Section>
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

export default CollectionEmail;

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

const descriptionText: React.CSSProperties = {
  fontSize: "14px",
  color: "#718096",
  margin: "0 0 16px 0",
  lineHeight: "22px",
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

const sectionHeading: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#718096",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "24px 0 12px 0",
};

const listingCard: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: "12px 0",
};

const listingImageCol: React.CSSProperties = {
  width: "90px",
  verticalAlign: "top",
  paddingRight: "12px",
};

const listingThumb: React.CSSProperties = {
  borderRadius: "6px",
  objectFit: "cover" as const,
};

const listingInfoCol: React.CSSProperties = {
  verticalAlign: "top",
};

const listingTitle_: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 2px 0",
};

const listingLink: React.CSSProperties = {
  color: "#1a1f36",
  textDecoration: "none",
};

const listingMeta: React.CSSProperties = {
  fontSize: "12px",
  color: "#718096",
  margin: "0 0 4px 0",
};

const listingPrice: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1a1f36",
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const brokerSection: React.CSSProperties = { margin: "0" };

const brokerHeading: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#718096",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const brokerName: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 2px 0",
};

const brokerDetail: React.CSSProperties = {
  fontSize: "13px",
  color: "#718096",
  margin: "0 0 2px 0",
};

const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const footer: React.CSSProperties = { padding: "24px 32px" };

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
