type Attachment = {
  filename: string;
  content: Buffer | string;
  content_type?: string;
};

type SendEmailArgs = {
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
};

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000]; // ms

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendResendEmail(args: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: args.to,
          from: args.from,
          subject: args.subject,
          html: args.html,
          ...(args.attachments?.length && { attachments: args.attachments }),
        }),
      });

      if (res.ok) {
        return res.json();
      }

      const text = await res.text();

      // Don't retry client errors (400-level) — they won't succeed on retry
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`Resend error: ${res.status} ${text}`);
      }

      // Server errors (500-level) — worth retrying
      lastError = new Error(`Resend error: ${res.status} ${text}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If it's a client error we already threw above, re-throw immediately
      if (lastError.message.includes("Resend error: 4")) throw lastError;
    }

    if (attempt < MAX_RETRIES) {
      console.warn(
        `[resend] Attempt ${attempt + 1} failed, retrying in ${RETRY_DELAYS[attempt]}ms...`
      );
      await sleep(RETRY_DELAYS[attempt]);
    }
  }

  throw lastError || new Error("Email send failed after retries");
}