export const ECOM_INTAKE_STATUSES = ["new", "reviewing", "quoted", "in_progress", "completed", "archived"] as const;
export const ECOM_CALL_STATUSES = ["new", "requested", "scheduled", "reviewing", "completed", "closed"] as const;
export const ECOM_QUOTE_STATUSES = ["draft", "review", "sent", "accepted", "declined"] as const;
export const ECOM_OPEN_CALL_STATUSES = ["new", "requested", "scheduled", "active", "open", "reviewing"] as const;

export type EcommerceIntakeStatus = (typeof ECOM_INTAKE_STATUSES)[number];
export type EcommerceCallStatus = (typeof ECOM_CALL_STATUSES)[number];
export type EcommerceQuoteStatus = (typeof ECOM_QUOTE_STATUSES)[number];
export type EcommerceOpenCallStatus = (typeof ECOM_OPEN_CALL_STATUSES)[number];

export function normalizeStatus(value: unknown, fallback: string) {
  const status = String(value ?? "").trim().toLowerCase();
  return status || fallback;
}

export function isEcommerceIntakeStatus(value: string): value is EcommerceIntakeStatus {
  return ECOM_INTAKE_STATUSES.includes(value as EcommerceIntakeStatus);
}

export function isEcommerceCallStatus(value: string): value is EcommerceCallStatus {
  return ECOM_CALL_STATUSES.includes(value as EcommerceCallStatus);
}

export function isEcommerceQuoteStatus(value: string): value is EcommerceQuoteStatus {
  return ECOM_QUOTE_STATUSES.includes(value as EcommerceQuoteStatus);
}

export function isEcommerceOpenCallStatus(value: string): value is EcommerceOpenCallStatus {
  return ECOM_OPEN_CALL_STATUSES.includes(value as EcommerceOpenCallStatus);
}

export function statusLabel(value: unknown, fallback: string) {
  const status = normalizeStatus(value, fallback);
  if (status === "not requested") return "Not requested";
  if (status === "not started") return "Not started";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
