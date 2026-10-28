import type { GroupKey } from "./db";

// The answer choices from the signup form, and which capacity group each one counts toward.
// To add or change an option, edit this list.
export const CATEGORIES: { key: string; label: string; group: GroupKey }[] = [
  { key: "1y_mba", label: "First year MBA / Partner of 1Y", group: "first" },
  { key: "1y_degree", label: "1 Year Degree (AM, GBS, etc.)", group: "first" },
  { key: "2y_mba", label: "Second year MBA / Partner of 2Y", group: "second" },
  { key: "exchange", label: "Exchange Student", group: "second" },
];

export const GROUPS: Record<GroupKey, { label: string; short: string }> = {
  first: { label: "1st Years & 1-Year Degrees", short: "1st Years" },
  second: { label: "2nd Years & Exchange Students", short: "2nd Years" },
};

export const GROUP_KEYS: GroupKey[] = ["first", "second"];

export function categoryLabel(key: string) {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
