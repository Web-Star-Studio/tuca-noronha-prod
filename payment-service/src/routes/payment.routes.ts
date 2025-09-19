import { Router } from 'express';
import { z } from 'zod';
import {
  createCheckoutPreference,
  getPayment,
  capturePayment,
  cancelPayment,
  refundPayment,
  searchPaymentsByBooking
} from '../services/mercadopago.service';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

const router = Router();

// Create checkout preference
router.post('/preference', asyncHandler(async (req, res) => {
  const schema = z.object({
    bookingId: z.string(),
    assetType: z.enum(['activity', 'event', 'restaurant', 'vehicle']),
    items: z.array(z.object({
      title: z.string(),
      quantity: z.number(),
      unitPrice: z.number()
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
    metadata: z.record(z.any()).optional()
  });

  const data = schema.parse(req.body);
  const result = await createCheckoutPreference(data);
  
  logger.info('Preference created via API', {
    bookingId: data.bookingId,
    preferenceId: result.preferenceId
  });

  res.json(result);
}));

// Get payment status
router.get('/payment/:paymentId', asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const payment = await getPayment(paymentId);
  res.json(payment);
}));

// Capture authorized payment
router.post('/payment/:paymentId/capture', asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { amount } = req.body;
  
  const result = await capturePayment(paymentId, amount);
  
  logger.info('Payment captured via API', {
    paymentId,
    amount
  });

  res.json(result);
}));

// Cancel authorized payment
router.post('/payment/:paymentId/cancel', asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  
  const result = await cancelPayment(paymentId);
  
  logger.info('Payment cancelled via API', { paymentId });

  res.json(result);
}));

// Refund captured payment
router.post('/payment/:paymentId/refund', asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { amount } = req.body;
  
  const result = await refundPayment(paymentId, amount);
  
  logger.info('Payment refunded via API', {
    paymentId,
    amount
  });

  res.json(result);
}));

// Search payments by booking
router.get('/booking/:bookingId/payments', asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const payments = await searchPaymentsByBooking(bookingId);
  res.json({ bookingId, payments });
}));

export default router;
