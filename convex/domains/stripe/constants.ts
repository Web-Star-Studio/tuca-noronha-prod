/**
 * Stripe Constants for Backend
 * 
 * Brazilian Stripe fee structure as of 2024:
 * - 3.99% + R$ 0.39 for domestic cards
 * 
 * IMPORTANT: These values must match the frontend constants in src/lib/constants/stripe.ts
 * Any changes here must be reflected in the frontend as well.
 */

export const STRIPE_FEES = {
  // Percentage fee (3.99%)
  PERCENTAGE: 0.0399,
  
  // Fixed fee in BRL (R$ 0.39)
  FIXED: 0.39,
  
  // Currency
  CURRENCY: 'brl' as const,
} as const;

/**
 * Calculate the Stripe fee for a given amount
 * @param amount - The base amount in BRL
 * @returns The Stripe fee amount
 */
export function calculateStripeFee(amount: number): number {
  return (amount * STRIPE_FEES.PERCENTAGE) + STRIPE_FEES.FIXED;
}

/**
 * Calculate the total amount including Stripe fees
 * @param amount - The base amount in BRL
 * @returns The total amount including fees
 */
export function calculateTotalWithStripeFee(amount: number): number {
  return amount + calculateStripeFee(amount);
} 