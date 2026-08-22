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
  Link,
} from "@react-email/components";

interface BlogPublishedProps {
  postTitle: string;
  postUrl: string;
  slideUrls: string[];
  caption: string;
}

// Sent to the site owner when a scheduled blog post auto-publishes.
// Contains everything needed to post the IG/TikTok carousel by hand:
// slide images (long-press to save on a phone) and a ready caption.
export default function BlogPublished({
  postTitle = "Your post",
  postUrl = "https://mercatolist.com/blog",
  slideUrls = [],
  caption = "",
}: BlogPublishedProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Published: ${postTitle} — carousel inside`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🚀 Just published</Heading>
          <Text style={text}>
            <strong>{postTitle}</strong> is now live.
          </Text>
          <Button style={button} href={postUrl}>
            View the post
          </Button>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Your carousel ({slideUrls.length} slides)
          </Heading>
          <Text style={muted}>
            Long-press each image to save it, then post the set to Instagram /
            TikTok. Caption is below — copy, paste, done.
          </Text>

          {slideUrls.map((url, i) => (
            <Section key={url} style={{ marginBottom: "12px" }}>
              <Link href={url}>
                <Img
                  src={url}
                  width="270"
                  height="338"
                  alt={`Slide ${i + 1}`}
                  style={slideImg}
                />
              </Link>
              <Text style={slideLabel}>
                Slide {i + 1} — <Link href={url}>open full size</Link>
              </Text>
            </Section>
          ))}

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Caption
          </Heading>
          <Section style={captionBox}>
            <Text style={captionText}>{caption}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f5f5f4", fontFamily: "-apple-system, 'Segoe UI', sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  margin: "24px auto",
  padding: "32px",
  borderRadius: "8px",
  maxWidth: "520px",
};
const h1 = { fontSize: "22px", color: "#16232b", margin: "0 0 12px" };
const h2 = { fontSize: "16px", color: "#16232b", margin: "0 0 8px" };
const text = { fontSize: "14px", color: "#42524e", lineHeight: "1.5" };
const muted = { fontSize: "13px", color: "#6b7d78", lineHeight: "1.5" };
const button = {
  backgroundColor: "#0d9488",
  color: "#ffffff",
  padding: "10px 20px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
  margin: "8px 0 4px",
};
const hr = { borderColor: "#e5e7e6", margin: "24px 0" };
const slideImg = { borderRadius: "6px", border: "1px solid #e5e7e6" };
const slideLabel = { fontSize: "12px", color: "#6b7d78", margin: "4px 0 0" };
const captionBox = {
  backgroundColor: "#f5f5f4",
  borderRadius: "6px",
  padding: "12px 16px",
};
const captionText = {
  fontSize: "13px",
  color: "#16232b",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap" as const,
};
