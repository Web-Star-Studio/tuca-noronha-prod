/**
 * Stripe Constants
 * 
 * Brazilian Stripe fee structure as of 2024:
 * - 3.99% + R$ 0.39 for domestic cards
 * - These values must match the backend calculations in convex/domains/stripe/actions.ts
 */

export const STRIPE_FEES = {
  // Percentage fee (3.99%)
  PERCENTAGE: 0.0399,
  
  // Fixed fee in BRL (R$ 0.39)
  FIXED: 0.39,
  
  // Currency
  CURRENCY: 'BRL' as const,
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

/**
 * Format the fee percentage for display
 * @returns Formatted percentage string
 */
export function formatStripeFeePercentage(): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(STRIPE_FEES.PERCENTAGE);
}

/**
 * Format the fixed fee for display
 * @returns Formatted currency string
 */
export function formatStripeFixedFee(): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: STRIPE_FEES.CURRENCY
  }).format(STRIPE_FEES.FIXED);
} 