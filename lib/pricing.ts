export type IntakeData = {
  websiteType: "Business" | "Ecommerce" | "Portfolio" | "Landing";
  pages: "1" | "3-5" | "6-10";
  booking: boolean;
  payments: boolean;
  blog: boolean;
  design: "Classic" | "Modern" | "Creative";
  timeline: "4+ weeks" | "2-3 weeks" | "Under 14 days";
};

export function calculatePrice(data: IntakeData) {
  let base = 0;

  // Base pricing
  if (data.websiteType === "Landing") base = 350;
  if (data.websiteType === "Portfolio") base = 650;
  if (data.websiteType === "Business") base = 750;
  if (data.websiteType === "Ecommerce") base = 1200;

  // Page add-ons
  if (data.pages === "3-5") base += 250;
  if (data.pages === "6-10") base += 500;

  // Features
  if (data.booking) base += 250;
  if (data.payments) base += 300;
  if (data.blog) base += 150;

  // Design multiplier
  if (data.design === "Modern") base *= 1.1;
  if (data.design === "Creative") base *= 1.25;

  // Rush fee
  if (data.timeline === "2-3 weeks") base *= 1.15;
  if (data.timeline === "Under 14 days") base *= 1.3;

  return Math.round(base);
}
