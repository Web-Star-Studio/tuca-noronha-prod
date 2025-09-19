import { Router } from 'express';
import express from 'express';
import crypto from 'crypto';
import { getPayment } from '../services/mercadopago.service';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Parse raw body for webhook signature verification
router.use('/mercadopago', express.raw({ type: 'application/json' }));

// Verify Mercado Pago webhook signature
const verifyWebhookSignature = (
  signature: string | undefined,
  requestId: string | undefined, 
  body: string
): boolean => {
  if (!signature || !requestId) {
    logger.warn('Missing webhook signature or request ID');
    return false;
  }

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('MERCADO_PAGO_WEBHOOK_SECRET not configured');
    return true; // Allow in development
  }

  // Parse signature header: "ts=xxx,v1=yyy"
  const parts = signature.split(',');
  const sigData: Record<string, string> = {};
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key && value) {
      sigData[key.trim()] = value.trim();
    }
  }

  const timestamp = sigData.ts;
  const receivedSignature = sigData.v1;

  if (!timestamp || !receivedSignature) {
    logger.warn('Invalid signature format');
    return false;
  }

  // Construct the message to sign
  const message = `id:${requestId};request-id:${requestId};ts:${timestamp};`;
  
  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
};

// Mercado Pago webhook endpoint
router.post('/mercadopago', asyncHandler(async (req, res) => {
  const signature = req.headers['x-signature'] as string;
  const requestId = req.headers['x-request-id'] as string;
  const body = req.body.toString();

  // Verify signature
  const isValid = verifyWebhookSignature(signature, requestId, body);
  
  if (!isValid && process.env.NODE_ENV === 'production') {
    logger.warn('Invalid webhook signature', { requestId });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse the body
  const data = JSON.parse(body);
  const { type, action, data: eventData } = data;

  logger.info('Webhook received', {
    type,
    action,
    dataId: eventData?.id
  });

  // Handle different webhook types
  try {
    switch (type) {
      case 'payment':
        await handlePaymentWebhook(eventData.id);
        break;
        
      case 'plan':
        // Handle subscription plans if needed
        logger.info('Plan webhook received', { planId: eventData.id });
        break;
        
      case 'subscription':
        // Handle subscriptions if needed
        logger.info('Subscription webhook received', { subscriptionId: eventData.id });
        break;
        
      default:
        logger.warn('Unhandled webhook type', { type });
    }

    // Always respond quickly to webhooks
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook', { error, type, dataId: eventData?.id });
    res.status(200).json({ received: true }); // Still acknowledge receipt
  }
}));

// Handle payment webhook
async function handlePaymentWebhook(paymentId: string) {
  try {
    const payment = await getPayment(paymentId);
    
    logger.info('Payment webhook processed', {
      paymentId,
      status: payment.status,
      amount: payment.amount,
      bookingId: payment.externalReference
    });

    // Update Convex database via HTTP API
    const convexUrl = process.env.CONVEX_URL || 'https://calculating-sockeye-278.convex.cloud';
    const convexResponse = await fetch(`${convexUrl}/api/webhooks/payment-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.CONVEX_WEBHOOK_SECRET || ''
      },
      body: JSON.stringify({
        paymentId: payment.id,
        bookingId: payment.externalReference,
        status: payment.status,
        amount: payment.amount,
        captured: payment.captured,
        timestamp: new Date().toISOString()
      })
    });

    if (!convexResponse.ok) {
      logger.warn('Failed to update Convex', { 
        status: convexResponse.status,
        bookingId: payment.externalReference 
      });
    }
    
    switch (payment.status) {
      case 'approved':
        logger.info('Payment approved', { paymentId, bookingId: payment.externalReference });
        // Update booking status to 'paid'
        break;
        
      case 'authorized':
        logger.info('Payment authorized', { paymentId, bookingId: payment.externalReference });
        // Update booking status to 'authorized'
        break;
        
      case 'cancelled':
      case 'rejected':
        logger.info('Payment cancelled/rejected', { paymentId, bookingId: payment.externalReference });
        // Update booking status to 'cancelled'
        break;
        
      case 'refunded':
        logger.info('Payment refunded', { paymentId, bookingId: payment.externalReference });
        // Update booking status to 'refunded'
        break;
    }
  } catch (error) {
    logger.error('Failed to process payment webhook', { paymentId, error });
    throw error;
  }
}

// Test webhook endpoint (for development)
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
