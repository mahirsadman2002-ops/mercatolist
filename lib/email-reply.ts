/**
 * Helpers for the Resend inbound email reply system.
 * Allows users to reply to MercatoList notification emails and have their
 * replies automatically added to the correct conversation thread.
 */

const INBOUND_DOMAIN =
  process.env.RESEND_INBOUND_DOMAIN || "inbound.mercatolist.com";

/**
 * Generate a reply-to address that encodes the inquiry (thread) ID.
 * e.g. reply+clxyz123@inbound.mercatolist.com
 */
export function generateReplyToAddress(inquiryId: string): string {
  return `reply+${inquiryId}@${INBOUND_DOMAIN}`;
}

/**
 * Parse an inbound reply email body — strip signatures, quoted text,
 * and return only the new reply content.
 */
export function parseReplyBody(text: string): string {
  if (!text) return "";

  const lines = text.split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    // Stop at "On ... wrote:" pattern (common Gmail/Apple Mail quote header)
    if (/^On .+ wrote:$/i.test(line.trim())) break;

    // Stop at divider lines
    if (/^---+\s*$/.test(line.trim())) break;
    if (/^___+\s*$/.test(line.trim())) break;

    // Stop at signature marker "-- " (RFC 3676)
    if (line.trimEnd() === "--") break;
    if (line === "-- ") break;

    // Stop at common mobile/client signatures
    if (/^Sent from my (iPhone|iPad|Galaxy|Android)/i.test(line.trim())) break;
    if (/^Get Outlook for/i.test(line.trim())) break;
    if (/^Sent from Mail for/i.test(line.trim())) break;
    if (/^Sent from Yahoo Mail/i.test(line.trim())) break;

    // Skip quoted lines ("> ")
    if (/^>/.test(line)) continue;

    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
}

/**
 * Detect auto-reply / out-of-office emails that should be ignored.
 */
export function isAutoReply(subject: string, body: string): boolean {
  const subjectLower = (subject || "").toLowerCase();
  const bodyLower = (body || "").toLowerCase();

  const autoReplySubjectPatterns = [
    "out of office",
    "automatic reply",
    "auto-reply",
    "autoreply",
    "auto reply",
    "away from office",
    "on vacation",
    "i am currently out",
    "delivery status notification",
    "undeliverable",
    "mail delivery failed",
  ];

  for (const pattern of autoReplySubjectPatterns) {
    if (subjectLower.includes(pattern)) return true;
  }

  const autoReplyBodyPatterns = [
    "i am currently out of the office",
    "i'm currently out of the office",
    "this is an automated response",
    "this is an automatic reply",
    "do not reply to this email",
  ];

  for (const pattern of autoReplyBodyPatterns) {
    if (bodyLower.includes(pattern)) return true;
  }

  return false;
}
