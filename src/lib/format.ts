// "$20" for whole dollars, "$12.50" otherwise.
export function formatPrice(cents: number) {
  return `$${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`;
}

// US phone numbers become 203-555-0100 (a leading +1 is dropped). Emails and anything else are left alone.
export function formatZelle(value: string) {
  const v = value.trim();
  if (!/^[\d\s().+-]+$/.test(v)) return v;
  const digits = v.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : v;
}
