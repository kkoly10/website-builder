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
          ...(args.attachments?.length && {
            attachments: args.attachments.map((a) => ({
              ...a,
              content: Buffer.isBuffer(a.content)
                ? a.content.toString("base64")
                : Buffer.from(a.content, "utf8").toString("base64"),
            })),
          }),
        }),
      });

      if (res.ok) {
        return res.json();
      }

      const text = await res.text();

      // Retry on 429 (rate limited) and 5xx — both transient. Other
      // 4xx codes (400 bad request, 401 unauthorized, 422 invalid
      // recipient) won't succeed on retry, so throw immediately.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(`Resend error: ${res.status} ${text}`);
      }

      // 429 or 5xx — worth retrying
      lastError = new Error(`Resend error: ${res.status} ${text}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Re-throw non-retryable 4xx (but let 429 fall through to retry).
      if (
        lastError.message.startsWith("Resend error: 4") &&
        !lastError.message.startsWith("Resend error: 429")
      ) {
        throw lastError;
      }
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