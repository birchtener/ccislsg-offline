export const ASSET_CONDITIONS = [
  "Brand New",
  "Used - Good",
  "Used - Fair",
  "Broken",
  "To be assessed",
] as const;

export type AssetCondition = (typeof ASSET_CONDITIONS)[number];

export const DEFAULT_ASSET_CONDITION: AssetCondition = "Used - Good";
