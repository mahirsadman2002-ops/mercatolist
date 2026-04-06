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

interface CollectionListingAddedProps {
  adderName: string;
  collectionName: string;
  listingTitle: string;
  listingPrice: string;
  viewUrl: string;
}

export default function CollectionListingAdded({
  adderName = "Jane Advisor",
  collectionName = "Manhattan Restaurants",
  listingTitle = "Joe's Pizza - Astoria",
  listingPrice = "450000",
  viewUrl = "https://mercatolist.com/collections/abc123",
}: CollectionListingAddedProps) {
  const formattedPrice = Number(listingPrice).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });

  return (
    <Html>
      <Head />
      <Preview>
        {adderName} added &quot;{listingTitle}&quot; to &quot;{collectionName}&quot;
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              New listing added to your collection
            </Heading>
            <Text style={paragraph}>
              <strong>{adderName}</strong> added a new listing to{" "}
              <strong>&quot;{collectionName}&quot;</strong>:
            </Text>

            <Section style={listingCard}>
              <Text style={listingTitle_}>{listingTitle}</Text>
              <Text style={listingPrice_}>{formattedPrice}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={viewUrl}>
                View Collection
              </Button>
            </Section>

            <Text style={smallText}>
              You&apos;re receiving this because you&apos;re a collaborator on
              this collection.
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

const listingCard: React.CSSProperties = {
  backgroundColor: "#f7fafc",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  border: "1px solid #e2e8f0",
};

const listingTitle_: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 6px 0",
};

const listingPrice_: React.CSSProperties = {
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
