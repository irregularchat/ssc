/**
 * Format a price stored as cents into a display string.
 * @param cents - Price in cents (integer)
 * @returns Formatted string like "$12.99"
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
