import { Heading, Img, Section } from "@react-email/components";

export function EmailHeader() {
  return (
    <Section style={{ textAlign: "center", padding: "24px 0" }}>
      <Heading style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1f36" }}>
        MercatoList
      </Heading>
    </Section>
  );
}
