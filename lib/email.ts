import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, react, from, replyTo }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: from ?? "MercatoList <notifications@mercatolist.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
