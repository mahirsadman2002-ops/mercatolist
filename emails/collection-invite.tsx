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

interface CollectionInviteProps {
  inviterName: string;
  collectionName: string;
  role: string;
  joinUrl: string;
}

export default function CollectionInvite({
  inviterName = "Jane Advisor",
  collectionName = "Manhattan Restaurants",
  role = "viewer",
  joinUrl = "https://mercatolist.com/collections/invite/abc123",
}: CollectionInviteProps) {
  const roleDescription =
    role === "editor"
      ? "You'll be able to add listings, leave notes, and manage this collection."
      : "You'll be able to view listings and leave notes on this collection.";

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to collaborate on &quot;{collectionName}&quot;
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MercatoList</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              You&apos;ve been invited to collaborate
            </Heading>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> invited you to collaborate on the
              collection <strong>&quot;{collectionName}&quot;</strong>.
            </Text>

            <Section style={roleCard}>
              <Text style={roleLabel}>Your Role</Text>
              <Text style={roleText}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
              <Text style={roleDescription_}>
                {roleDescription}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={joinUrl}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={replyNote}>
              You can reply directly to this email — your response will be added to the conversation on MercatoList. Or visit the site to respond there.
            </Text>

            <Text style={smallText}>
              If you don&apos;t want to join this collection, you can simply
              ignore this email. The invitation will expire in 7 days.
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

const roleCard: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  borderLeft: "3px solid #0d9488",
};

const roleLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const roleText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#1a1f36",
  margin: "0 0 6px 0",
};

const roleDescription_: React.CSSProperties = {
  fontSize: "13px",
  color: "#4a5568",
  lineHeight: "20px",
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
