import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import healthRoutes from './routes/health.routes';
import { initializeMercadoPago } from './services/mercadopago.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize MercadoPago SDK
initializeMercadoPago();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse JSON for regular routes (not webhooks)
app.use((req, res, next) => {
  if (req.path.startsWith('/webhooks/')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Health check (no auth required)
app.use('/health', healthRoutes);

// Webhook routes (special handling, no auth)
app.use('/webhooks', webhookRoutes);

// API routes (with authentication)
app.use('/api/payments', authMiddleware, paymentRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Payment service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
