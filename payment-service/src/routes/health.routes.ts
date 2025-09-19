import { Router } from 'express';
import { MercadoPagoConfig } from 'mercadopago';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Detailed health check
router.get('/ready', async (req, res) => {
  const checks = {
    service: true,
    mercadoPago: false,
    environment: false
  };

  // Check MercadoPago SDK
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (accessToken) {
      checks.mercadoPago = true;
    }
  } catch (error) {
    // MercadoPago not configured
  }

  // Check required environment variables
  const requiredEnvVars = [
    'MERCADO_PAGO_ACCESS_TOKEN',
    'MERCADO_PAGO_PUBLIC_KEY',
    'API_KEY'
  ];

  checks.environment = requiredEnvVars.every(
    varName => process.env[varName] !== undefined
  );

  const allHealthy = Object.values(checks).every(check => check === true);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

export default router;
