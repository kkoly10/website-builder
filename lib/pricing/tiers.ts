export const TIER_CONFIG = {
  Starter: { min: 1800, max: 2400, hoursMin: 20, hoursMax: 30 },
  Growth: { min: 3500, max: 4500, hoursMin: 35, hoursMax: 55 },
  Premium: { min: 6500, max: 10000, hoursMin: 65, hoursMax: 120 },
} as const;

export type TierName = keyof typeof TIER_CONFIG;
