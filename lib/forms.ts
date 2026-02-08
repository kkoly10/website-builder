export type ComingSoonInterest = {
  name?: string;
  email: string;
  interest?: string; // e.g. "ecommerce_support", "website_building", etc.
  message?: string;
};

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}