/**
 * Payment Service Integration for Next.js
 */

import { PaymentServiceClient } from '@/../../payment-service/src/client/payment-client';

// Configure the payment service URL based on environment
const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://payments.tucanoronha.com.br' 
    : 'http://localhost:3001');

const PAYMENT_SERVICE_API_KEY = process.env.PAYMENT_SERVICE_API_KEY || 'tuca-payment-service-key-2024';

// Singleton instance
let paymentClient: PaymentServiceClient;

/**
 * Get the payment service client instance
 */
export function getPaymentClient(): PaymentServiceClient {
  if (!paymentClient) {
    paymentClient = new PaymentServiceClient(
      PAYMENT_SERVICE_URL,
      PAYMENT_SERVICE_API_KEY
    );
  }
  return paymentClient;
}

/**
 * Create a checkout preference for a booking
 */
export async function createCheckoutPreference(params: {
  bookingId: string;
  assetType: 'activity' | 'event' | 'restaurant' | 'vehicle';
  assetName: string;
  totalPrice: number;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}) {
  const client = getPaymentClient();
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return client.createPreference({
    bookingId: params.bookingId,
    assetType: params.assetType,
    items: [{
      title: params.assetName,
      quantity: 1,
      unitPrice: params.totalPrice
    }],
    payer: params.customerEmail ? {
      email: params.customerEmail,
      name: params.customerName || '',
      phone: params.customerPhone
    } : undefined,
    backUrls: {
      success: params.successUrl || `${baseUrl}/reservas/?booking_id=${params.bookingId}`,
      pending: params.successUrl || `${baseUrl}/reservas/?booking_id=${params.bookingId}`,
      failure: params.cancelUrl || `${baseUrl}/booking/cancel`
    },
    metadata: {
      ...params.metadata,
      source: 'nextjs-app'
    }
  });
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentId: string) {
  const client = getPaymentClient();
  return client.getPayment(paymentId);
}

/**
 * Capture an authorized payment (for admin dashboard)
 */
export async function capturePayment(paymentId: string, amount?: number) {
  const client = getPaymentClient();
  return client.capturePayment(paymentId, amount);
}

/**
 * Cancel a payment
 */
export async function cancelPayment(paymentId: string) {
  const client = getPaymentClient();
  return client.cancelPayment(paymentId);
}

/**
 * Refund a payment
 */
export async function refundPayment(paymentId: string, amount?: number) {
  const client = getPaymentClient();
  return client.refundPayment(paymentId, amount);
}

/**
 * Search payments by booking ID
 */
export async function searchPaymentsByBooking(bookingId: string) {
  const client = getPaymentClient();
  return client.searchPaymentsByBooking(bookingId);
}

/**
 * Check if payment service is healthy
 */
export async function checkPaymentServiceHealth() {
  try {
    const client = getPaymentClient();
    const health = await client.health();
    return {
      isHealthy: health.status === 'healthy',
      ...health
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
