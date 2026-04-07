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

interface CollectionNoteProps {
  authorName: string;
  collectionName: string;
  listingTitle?: string;
  notePreview: string;
  viewUrl: string;
}

export default function CollectionNote({
  authorName = "Jane Advisor",
  collectionName = "Manhattan Restaurants",
  listingTitle,
  notePreview = "This one looks like a great fit for your budget. The location is perfect and the financials are strong.",
  viewUrl = "https://mercatolist.com/collections/abc123",
}: CollectionNoteProps) {
  const noteContext = listingTitle
    ? `on "${listingTitle}" in`
    : "in";

  return (
    <Html>
      <Head />
      <Preview>
        {authorName} left a note {noteContext} &quot;{collectionName}&quot;
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              New note in your collection
            </Heading>
            <Text style={paragraph}>
              <strong>{authorName}</strong> left a note {noteContext}{" "}
              <strong>&quot;{collectionName}&quot;</strong>:
            </Text>

            <Section style={noteCard}>
              <Text style={noteLabel}>
                {listingTitle ? `Note on ${listingTitle}` : "Collection Note"}
              </Text>
              <Text style={noteText}>
                &quot;{notePreview}&quot;
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={viewUrl}>
                View Collection
              </Button>
            </Section>

            <Text style={replyNote}>
              You can reply directly to this email — your response will be added to the conversation on MercatoList. Or visit the site to respond there.
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

const noteCard: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  borderLeft: "3px solid #0d9488",
};

const noteLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 6px 0",
};

const noteText: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a5568",
  fontStyle: "italic" as const,
  lineHeight: "22px",
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

const replyNote: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#718096",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
  fontStyle: "italic" as const,
};

const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const footer: React.CSSProperties = { padding: "24px 32px" };

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#a0aec0",
  margin: "4px 0",
  textAlign: "center" as const,
};
