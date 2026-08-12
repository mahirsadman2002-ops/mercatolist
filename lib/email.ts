import { Resend } from "resend";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

// Best-effort send record for the admin Emails page. Logging must never make a
// send fail (or a failure louder), so errors here are swallowed.
async function logEmail(entry: {
  to: string | string[];
  subject: string;
  template: string | null;
  status: "SENT" | "FAILED";
  error?: string;
  resendId?: string;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        to: Array.isArray(entry.to) ? entry.to.join(", ") : entry.to,
        subject: entry.subject,
        template: entry.template,
        status: entry.status,
        error: entry.error?.slice(0, 500),
        resendId: entry.resendId,
      },
    });
  } catch (e) {
    console.error("Failed to write email log:", e);
  }
}

export async function sendEmail({ to, subject, react, from }: SendEmailOptions) {
  // The React Email component's name doubles as the template label
  // (e.g. SavedSearchMatch) — no per-caller changes needed.
  const template =
    typeof react.type === "function" ? react.type.name || null : null;

  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);

  const { data, error } = await resend.emails.send({
    from: from ?? "MercatoList <noreply@mercatolist.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Failed to send email:", error);
    await logEmail({ to, subject, template, status: "FAILED", error: error.message });
    throw new Error(`Failed to send email: ${error.message}`);
  }

  await logEmail({ to, subject, template, status: "SENT", resendId: data?.id });

  return data;
}
