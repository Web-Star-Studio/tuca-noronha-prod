import { v } from "convex/values";
import { 
  STRIPE_PAYMENT_STATUS, 
  STRIPE_REFUND_REASONS, 
  SUPPORTED_CURRENCIES,
  STRIPE_ASSET_TYPES 
} from "./types";

/**
 * Convert price from reais to cents (for Stripe)
 * Stripe requires amounts in the smallest currency unit (cents for BRL)
 */
export function convertToCents(amount: number, currency: string = "brl"): number {
  // For currencies like BRL, USD, EUR - multiply by 100
  // For zero-decimal currencies like JPY - return as-is
  const zeroDecimalCurrencies = ["jpy", "krw", "vnd"];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
}

/**
 * Convert price from cents to reais (from Stripe)
 */
export function convertFromCents(amount: number, currency: string = "brl"): number {
  const zeroDecimalCurrencies = ["jpy", "krw", "vnd"];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }
  
  return amount / 100;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = "brl"): string {
  const actualAmount = convertFromCents(amount, currency);
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(actualAmount);
}

/**
 * Validate payment status
 */
export function isValidPaymentStatus(status: string): boolean {
  return Object.values(STRIPE_PAYMENT_STATUS).includes(status as any);
}

/**
 * Validate refund reason
 */
export function isValidRefundReason(reason: string): boolean {
  return Object.values(STRIPE_REFUND_REASONS).includes(reason as any);
}

/**
 * Validate currency
 */
export function isValidCurrency(currency: string): boolean {
  return Object.values(SUPPORTED_CURRENCIES).includes(currency as any);
}

/**
 * Validate asset type
 */
export function isValidAssetType(assetType: string): boolean {
  return Object.values(STRIPE_ASSET_TYPES).includes(assetType as any);
}

/**
 * Generate booking confirmation code
 */
export function generateConfirmationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get asset table name from asset type
 */
export function getAssetTableName(assetType: string): string {
  switch (assetType) {
    case "activity":
      return "activities";
    case "event":
      return "events";
    case "restaurant":
      return "restaurants";
    case "accommodation":
      return "accommodations";
    case "vehicle":
      return "vehicles";
    case "package":
      return "packages";
    default:
      throw new Error(`Unknown asset type: ${assetType}`);
  }
}

/**
 * Get booking table name from asset type
 */
export function getBookingTableName(assetType: string): string {
  switch (assetType) {
    case "activity":
      return "activityBookings";
    case "event":
      return "eventBookings";
    case "restaurant":
      return "restaurantReservations";
    case "accommodation":
      return "accommodationBookings";
    case "vehicle":
      return "vehicleBookings";
    case "package":
      return "packageBookings";
    default:
      throw new Error(`Unknown asset type: ${assetType}`);
  }
}

/**
 * Get asset ID field name from asset type
 */
export function getAssetIdFieldName(assetType: string): string {
  switch (assetType) {
    case "activity":
      return "activityId";
    case "event":
      return "eventId";
    case "restaurant":
      return "restaurantId";
    case "accommodation":
      return "accommodationId";
    case "vehicle":
      return "vehicleId";
    case "package":
      return "packageId";
    default:
      throw new Error(`Unknown asset type: ${assetType}`);
  }
}

/**
 * Check if payment is successful
 */
export function isPaymentSuccessful(paymentStatus?: string): boolean {
  return paymentStatus === STRIPE_PAYMENT_STATUS.SUCCEEDED;
}

/**
 * Check if payment is pending
 */
export function isPaymentPending(paymentStatus?: string): boolean {
  return paymentStatus === STRIPE_PAYMENT_STATUS.PENDING || 
         paymentStatus === STRIPE_PAYMENT_STATUS.PROCESSING;
}

/**
 * Check if payment failed
 */
export function isPaymentFailed(paymentStatus?: string): boolean {
  return paymentStatus === STRIPE_PAYMENT_STATUS.FAILED ||
         paymentStatus === STRIPE_PAYMENT_STATUS.CANCELED;
}

/**
 * Check if payment is refunded
 */
export function isPaymentRefunded(paymentStatus?: string): boolean {
  return paymentStatus === STRIPE_PAYMENT_STATUS.REFUNDED ||
         paymentStatus === STRIPE_PAYMENT_STATUS.PARTIALLY_REFUNDED;
}

/**
 * Get payment status color for UI
 */
export function getPaymentStatusColor(paymentStatus?: string): string {
  switch (paymentStatus) {
    case STRIPE_PAYMENT_STATUS.SUCCEEDED:
      return "green";
    case STRIPE_PAYMENT_STATUS.PENDING:
    case STRIPE_PAYMENT_STATUS.PROCESSING:
      return "yellow";
    case STRIPE_PAYMENT_STATUS.FAILED:
    case STRIPE_PAYMENT_STATUS.CANCELED:
      return "red";
    case STRIPE_PAYMENT_STATUS.REFUNDED:
    case STRIPE_PAYMENT_STATUS.PARTIALLY_REFUNDED:
      return "orange";
    case STRIPE_PAYMENT_STATUS.REQUIRES_ACTION:
      return "blue";
    default:
      return "gray";
  }
}

/**
 * Get payment status label for UI
 */
export function getPaymentStatusLabel(paymentStatus?: string): string {
  switch (paymentStatus) {
    case STRIPE_PAYMENT_STATUS.SUCCEEDED:
      return "Pago";
    case STRIPE_PAYMENT_STATUS.PENDING:
      return "Pendente";
    case STRIPE_PAYMENT_STATUS.PROCESSING:
      return "Processando";
    case STRIPE_PAYMENT_STATUS.FAILED:
      return "Falhou";
    case STRIPE_PAYMENT_STATUS.CANCELED:
      return "Cancelado";
    case STRIPE_PAYMENT_STATUS.REFUNDED:
      return "Reembolsado";
    case STRIPE_PAYMENT_STATUS.PARTIALLY_REFUNDED:
      return "Parcialmente Reembolsado";
    case STRIPE_PAYMENT_STATUS.REQUIRES_ACTION:
      return "Requer Ação";
    default:
      return "Desconhecido";
  }
}

/**
 * Calculate refund amount based on policy and timing
 */
export function calculateRefundAmount(
  totalAmount: number,
  bookingDate: number,
  cancelDate: number = Date.now(),
  policy: "full" | "partial" | "none" = "full"
): number {
  if (policy === "none") {
    return 0;
  }

  if (policy === "full") {
    return totalAmount;
  }

  // Partial refund based on how far in advance the cancellation is
  const daysUntilBooking = Math.ceil((bookingDate - cancelDate) / (1000 * 60 * 60 * 24));
  
  if (daysUntilBooking >= 7) {
    return totalAmount; // Full refund if 7+ days
  } else if (daysUntilBooking >= 3) {
    return Math.round(totalAmount * 0.75); // 75% refund if 3-6 days
  } else if (daysUntilBooking >= 1) {
    return Math.round(totalAmount * 0.50); // 50% refund if 1-2 days
  } else {
    return 0; // No refund if same day or past
  }
}

/**
 * Generate Stripe product name for an asset
 */
export function generateStripeProductName(assetType: string, assetName: string): string {
  const typeLabels = {
    activity: "Atividade",
    event: "Evento",
    restaurant: "Restaurante",
    accommodation: "Hospedagem",
    vehicle: "Veículo",
    package: "Pacote"
  };

  const typeLabel = typeLabels[assetType as keyof typeof typeLabels] || assetType;
  return `${typeLabel}: ${assetName}`;
}

/**
 * Generate Stripe product description for an asset
 */
export function generateStripeProductDescription(
  assetType: string, 
  assetName: string, 
  description?: string
): string {
  const baseDescription = description || `Reserva de ${assetName}`;
  return `${baseDescription} - Tuca Noronha Travel Platform`;
}

/**
 * Validate booking data before creating checkout session
 */
export function validateBookingForCheckout(booking: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!booking) {
    errors.push("Booking not found");
    return { valid: false, errors };
  }

  if (!booking.userId) {
    errors.push("User ID is required");
  }

  if (!booking.totalPrice || booking.totalPrice <= 0) {
    errors.push("Valid total price is required");
  }

  if (!booking.customerInfo?.email) {
    errors.push("Customer email is required");
  }

  if (!booking.customerInfo?.name) {
    errors.push("Customer name is required");
  }

  if (booking.status === "canceled" || booking.status === "completed") {
    errors.push("Cannot process payment for canceled or completed bookings");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get webhook event types we handle
 */
export function getHandledWebhookEvents(): string[] {
  return [
    "checkout.session.completed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.canceled",
    "charge.dispute.created",
    "invoice.payment_succeeded",
    "customer.subscription.updated"
  ];
}

/**
 * Parse webhook metadata safely
 */
export function parseWebhookMetadata(metadata: any): {
  bookingId?: string;
  userId?: string;
  assetType?: string;
  assetId?: string;
} {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return {
    bookingId: metadata.bookingId,
    userId: metadata.userId,
    assetType: metadata.assetType,
    assetId: metadata.assetId,
  };
}
