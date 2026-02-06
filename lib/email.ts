export async function sendInternalEmail(link: string) {
  // V1: simple console log (safe + deployable)
  // NEXT: swap with Resend, SendGrid, etc.

  console.log("🔒 INTERNAL PIE REPORT");
  console.log("Open:", link);

  // When ready, replace with real email provider
}
