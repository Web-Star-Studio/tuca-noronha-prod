/**
 * Payment Service Client SDK
 * This can be used by your Next.js app to communicate with the payment service
 */

export class PaymentServiceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(
    path: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Request failed' 
      }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create a checkout preference
   */
  async createPreference(data: {
    bookingId: string;
    assetType: 'activity' | 'event' | 'restaurant' | 'vehicle';
    items: Array<{
      title: string;
      quantity: number;
      unitPrice: number;
    }>;
    payer?: {
      name: string;
      email: string;
      phone?: string;
    };
    backUrls: {
      success: string;
      pending: string;
      failure: string;
    };
    metadata?: Record<string, any>;
  }) {
    return this.request<{
      success: boolean;
      preferenceId: string;
      checkoutUrl: string;
      initPoint?: string;
      sandboxInitPoint?: string;
    }>('/api/payments/preference', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string) {
    return this.request<{
      id: string;
      status: string;
      statusDetail: string;
      amount: number;
      currency: string;
      captured: boolean;
      externalReference: string;
    }>(`/api/payments/payment/${paymentId}`);
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(paymentId: string, amount?: number) {
    return this.request<{
      success: boolean;
      paymentId: string;
      status: string;
      amount: number;
      captured: boolean;
    }>(`/api/payments/payment/${paymentId}/capture`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  /**
   * Cancel an authorized payment
   */
  async cancelPayment(paymentId: string) {
    return this.request<{
      success: boolean;
      paymentId: string;
      status: string;
    }>(`/api/payments/payment/${paymentId}/cancel`, {
      method: 'POST'
    });
  }

  /**
   * Refund a captured payment
   */
  async refundPayment(paymentId: string, amount?: number) {
    return this.request<{
      success: boolean;
      paymentId: string;
      refundId: string;
      amount: number;
      status: string;
    }>(`/api/payments/payment/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  /**
   * Search payments by booking ID
   */
  async searchPaymentsByBooking(bookingId: string) {
    return this.request<{
      bookingId: string;
      payments: Array<{
        id: string;
        status: string;
        amount: number;
        dateCreated: string;
        captured: boolean;
      }>;
    }>(`/api/payments/booking/${bookingId}/payments`);
  }

  /**
   * Health check
   */
  async health() {
    return this.request<{
      status: string;
      service: string;
      timestamp: string;
      uptime: number;
    }>('/health');
  }
}
