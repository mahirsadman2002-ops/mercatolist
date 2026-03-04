import { Button } from "@react-email/components";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "#1a1f36",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "6px",
        fontWeight: "600",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
