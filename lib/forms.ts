export type ComingSoonInterest = {
  name?: string;
  email: string;
  interest?: string; // e.g. "ecommerce_support", "website_building", etc.
  message?: string;
};

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Endpoint used by /coming-soon to submit the early interest form.
 * Set this in Vercel env vars:
 * NEXT_PUBLIC_ECOM_INTEREST_FORM_ENDPOINT
 */
export function getEcomInterestEndpoint(): string {
  return process.env.NEXT_PUBLIC_ECOM_INTEREST_FORM_ENDPOINT || "";
}