export type IntakeData = {
  websiteType: "Business" | "Ecommerce" | "Portfolio" | "Landing";
  pages: "1" | "3-5" | "6-10";
  booking: boolean;
  payments: boolean;
  blog: boolean;
  design: "Classic" | "Modern" | "Creative";
  timeline: "4+ weeks" | "2-3 weeks" | "Under 14 days";
};

export type PriceBreakdown = {
  basePrice: number;
  pageAddOn: number;
  featureAddOn: number;
  designMultiplier: number;
  rushFee: number;
  total: number;
};

export function calculatePrice(data: IntakeData): PriceBreakdown {
  let basePrice = 0;
  let pageAddOn = 0;
  let featureAddOn = 0;
  let designMultiplier = 1;
  let rushFee = 0;

  // Base price
  if (data.websiteType === "Landing") basePrice = 350;
  if (data.websiteType === "Portfolio") basePrice = 650;
  if (data.websiteType === "Business") basePrice = 750;
  if (data.websiteType === "Ecommerce") basePrice = 1200;

  // Pages
  if (data.pages === "3-5") pageAddOn = 250;
  if (data.pages === "6-10") pageAddOn = 500;

  // Features
  if (data.booking) featureAddOn += 250;
  if (data.payments) featureAddOn += 300;
  if (data.blog) featureAddOn += 150;

  // Design multiplier
  if (data.design === "Modern") designMultiplier = 1.1;
  if (data.design === "Creative") designMultiplier = 1.25;

  // Rush fee
  if (data.timeline === "2-3 weeks") rushFee = 0.15;
  if (data.timeline === "Under 14 days") rushFee = 0.3;

  const subtotal = (basePrice + pageAddOn + featureAddOn) * designMultiplier;
  const total = Math.round(subtotal + subtotal * rushFee);

  return {
    basePrice,
    pageAddOn,
    featureAddOn,
    designMultiplier,
    rushFee: Math.round(subtotal * rushFee),
    total,
  };
}