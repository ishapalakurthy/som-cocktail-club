// Base-spirit categories for the recipe book filters. Safe to import from client components.
export const SPIRITS = [
  { key: "gin", label: "Gin" },
  { key: "agave", label: "Tequila & mezcal" },
  { key: "rum", label: "Rum" },
  { key: "whiskey", label: "Whiskey" },
  { key: "vodka", label: "Vodka" },
  { key: "brandy", label: "Brandy" },
  { key: "other", label: "Other" },
  { key: "zero", label: "Zero-proof" },
] as const;

export type SpiritKey = (typeof SPIRITS)[number]["key"];

export function spiritLabel(key: string) {
  return SPIRITS.find((s) => s.key === key)?.label ?? key;
}

export type Ingredient = { amount: string; item: string };
