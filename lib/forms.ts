export function getEcomInterestEndpoint(): string {
  const v = process.env.NEXT_PUBLIC_ECOM_INTEREST_FORM_ENDPOINT;
  return v || "";
}
