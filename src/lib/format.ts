// "$20" for whole dollars, "$12.50" otherwise.
export function formatPrice(cents: number) {
  return `$${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`;
}
