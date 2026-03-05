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

interface SavedListingInfo {
  title: string;
  slug: string;
  askingPrice: string;
  category: string;
  neighborhood: string;
  borough: string;
  photoUrl?: string | null;
  viewCount: number;
  saveCount: number;
  daysOnMarket: number;
}

interface MarketingNudgeProps {
  name: string;
  savedCount: number;
  listings: SavedListingInfo[];
  dashboardUrl: string;
}

export default function MarketingNudge({
  name = "there",
  savedCount = 5,
  listings = [],
  dashboardUrl = "https://mercatolist.com/saved",
}: MarketingNudgeProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Still interested? Check back on your ${savedCount} saved listing${savedCount !== 1 ? "s" : ""}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Still interested?
            </Heading>
            <Text style={paragraph}>
              Hi {name}, you have{" "}
              <strong>
                {savedCount} saved listing{savedCount !== 1 ? "s" : ""}
              </strong>{" "}
              on MercatoList. Here&apos;s a quick update on some of them:
            </Text>

            {listings.slice(0, 4).map((listing, i) => {
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
                          width="80"
                          height="60"
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
                      <Text style={listingStats}>
                        {listing.viewCount} views &bull; {listing.saveCount}{" "}
                        saves &bull; {listing.daysOnMarket} days on market
                      </Text>
                    </Column>
                  </Row>
                </Section>
              );
            })}

            {savedCount > 4 && (
              <Text style={moreText}>
                ...and {savedCount - 4} more saved listing
                {savedCount - 4 !== 1 ? "s" : ""}
              </Text>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                View All Saved Listings
              </Button>
            </Section>

            <Text style={tipText}>
              <strong>Tip:</strong> Reach out to listing owners early — NYC
              businesses often receive multiple offers. Send an inquiry directly
              from the listing page.
            </Text>

            <Text style={smallText}>
              You&apos;re receiving this because you have saved listings on
              MercatoList. To stop these emails, unsave listings or update your
              notification preferences.
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
  borderBottom: "1px solid #f0f0f0",
  padding: "12px 0",
};

const listingImageCol: React.CSSProperties = {
  width: "80px",
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
  fontSize: "14px",
  fontWeight: 700,
  color: "#1a1f36",
  margin: "0 0 4px 0",
};

const listingStats: React.CSSProperties = {
  fontSize: "11px",
  color: "#a0aec0",
  margin: 0,
};

const moreText: React.CSSProperties = {
  fontSize: "13px",
  color: "#718096",
  textAlign: "center" as const,
  margin: "12px 0",
  fontStyle: "italic" as const,
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

const tipText: React.CSSProperties = {
  fontSize: "13px",
  color: "#4a5568",
  backgroundColor: "#fffbeb",
  padding: "12px 16px",
  borderRadius: "6px",
  lineHeight: "20px",
  margin: "16px 0",
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
