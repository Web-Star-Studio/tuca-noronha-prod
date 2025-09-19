import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { logger } from '../utils/logger';
import { z } from 'zod';

let client: MercadoPagoConfig;
let preferenceClient: Preference;
let paymentClient: Payment;

// Initialize MercadoPago SDK
export const initializeMercadoPago = () => {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN is not defined');
  }

  client = new MercadoPagoConfig({ 
    accessToken,
    options: {
      timeout: 5000,
      idempotencyKey: 'unique-request-id'
    }
  });

  preferenceClient = new Preference(client);
  paymentClient = new Payment(client);

  logger.info('MercadoPago SDK initialized');
};

// Schema for preference creation
const CreatePreferenceSchema = z.object({
  bookingId: z.string(),
  assetType: z.enum(['activity', 'event', 'restaurant', 'vehicle']),
  items: z.array(z.object({
    title: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    currencyId: z.string().default('BRL')
  })),
  payer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.object({
      area_code: z.string().optional(),
      number: z.string().optional()
    }).optional()
  }).optional(),
  backUrls: z.object({
    success: z.string().url(),
    pending: z.string().url(),
    failure: z.string().url()
  }),
  metadata: z.record(z.any()).optional(),
  autoReturn: z.enum(['approved', 'all']).optional(),
  statementDescriptor: z.string().optional(),
  externalReference: z.string().optional()
});

export type CreatePreferenceInput = z.infer<typeof CreatePreferenceSchema>;

/**
 * Create a checkout preference for a booking
 */
export const createCheckoutPreference = async (input: CreatePreferenceInput) => {
  try {
    const validated = CreatePreferenceSchema.parse(input);
    
    // Detect if we're using test credentials
    const isTestMode = process.env.MERCADO_PAGO_ACCESS_TOKEN?.includes('TEST') ||
                      process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith('APP_USR');
    
    const preference = await preferenceClient.create({
      body: {
        items: validated.items.map(item => ({
          id: `${validated.bookingId}-${Date.now()}`,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: item.currencyId
        })),
        payer: validated.payer,
        back_urls: validated.backUrls,
        ...(validated.autoReturn ? { auto_return: validated.autoReturn } : {}),
        statement_descriptor: validated.statementDescriptor,
        external_reference: validated.externalReference || validated.bookingId,
        metadata: {
          ...validated.metadata,
          bookingId: validated.bookingId,
          assetType: validated.assetType,
          environment: isTestMode ? 'test' : 'production'
        },
        // Optimize for test mode
        payment_methods: isTestMode ? {
          installments: 1, // Single payment for simplicity
          default_installments: 1
        } : undefined,
        // Set capture mode for manual capture
        capture: false, // Authorization only, capture manually later
        binary_mode: false // Allow pending states
      }
    });

    logger.info('Preference created', { 
      preferenceId: preference.id,
      bookingId: validated.bookingId 
    });

    // Return the appropriate URL based on environment
    const checkoutUrl = isTestMode 
      ? preference.sandbox_init_point 
      : preference.init_point;

    return {
      success: true,
      preferenceId: preference.id,
      checkoutUrl: checkoutUrl || '',
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    };
  } catch (error) {
    logger.error('Failed to create preference', error);
    throw error;
  }
};

/**
 * Get payment details by ID
 */
export const getPayment = async (paymentId: string) => {
  try {
    const payment = await paymentClient.get({ id: paymentId });
    
    return {
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      paymentMethod: payment.payment_method_id,
      payer: payment.payer,
      metadata: payment.metadata,
      dateCreated: payment.date_created,
      dateApproved: payment.date_approved,
      captured: payment.captured,
      externalReference: payment.external_reference
    };
  } catch (error) {
    logger.error('Failed to get payment', { paymentId, error });
    throw error;
  }
};

/**
 * Capture an authorized payment
 */
export const capturePayment = async (paymentId: string, amount?: number) => {
  try {
    const payment = await paymentClient.capture({
      id: paymentId,
      requestOptions: {},
      body: amount ? { transaction_amount: amount } : {}
    });
    
    logger.info('Payment captured', {
      paymentId,
      status: payment.status,
      amount: payment.transaction_amount
    });

    return {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      captured: payment.captured
    };
  } catch (error) {
    logger.error('Failed to capture payment', { paymentId, error });
    throw error;
  }
};

/**
 * Cancel an authorized payment (before capture)
 */
export const cancelPayment = async (paymentId: string) => {
  try {
    const payment = await paymentClient.cancel({
      id: paymentId,
      requestOptions: {}
    });
    
    logger.info('Payment cancelled', {
      paymentId,
      status: payment.status
    });

    return {
      success: true,
      paymentId: payment.id,
      status: payment.status
    };
  } catch (error) {
    logger.error('Failed to cancel payment', { paymentId, error });
    throw error;
  }
};

/**
 * Refund a captured payment
 */
export const refundPayment = async (paymentId: string, amount?: number) => {
  try {
    const refund = await paymentClient.refund({
      id: paymentId,
      requestOptions: {},
      body: amount ? { amount } : {}
    });
    
    logger.info('Payment refunded', {
      paymentId,
      refundId: refund.id,
      amount: refund.amount
    });

    return {
      success: true,
      paymentId,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    };
  } catch (error) {
    logger.error('Failed to refund payment', { paymentId, error });
    throw error;
  }
};

/**
 * Search payments by external reference (bookingId)
 */
export const searchPaymentsByBooking = async (bookingId: string) => {
  try {
    const payments = await paymentClient.search({
      options: {
        criteria: 'desc',
        external_reference: bookingId
      }
    });

    return payments.results.map(payment => ({
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      dateCreated: payment.date_created,
      captured: payment.captured
    }));
  } catch (error) {
    logger.error('Failed to search payments', { bookingId, error });
    throw error;
  }
};
