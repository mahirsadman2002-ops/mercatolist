import { Section, Text, Link } from "@react-email/components";

export function EmailFooter() {
  return (
    <Section style={{ textAlign: "center", padding: "24px 0", borderTop: "1px solid #e5e7eb" }}>
      <Text style={{ color: "#6b7280", fontSize: "12px" }}>
        MercatoList — NYC&apos;s Premier Business Marketplace
      </Text>
      <Link href="https://mercatolist.com" style={{ color: "#6b7280", fontSize: "12px" }}>
        mercatolist.com
      </Link>
    </Section>
  );
}
