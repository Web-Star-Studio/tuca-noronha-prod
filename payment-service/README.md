# Payment Service - Tuca Noronha

A dedicated microservice for handling payments using Mercado Pago SDK.

## Features

- ✅ Full Mercado Pago SDK integration
- ✅ Manual capture support (authorize → capture)
- ✅ Webhook handling with signature verification
- ✅ RESTful API endpoints
- ✅ Docker support
- ✅ Health checks and monitoring
- ✅ Secure API key authentication
- ✅ Comprehensive logging

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker (optional)

### Installation

```bash
cd payment-service
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the environment variables in `.env` with your credentials.

### Development

```bash
npm run dev
```

The service will start on `http://localhost:3001`

### Production

#### Using Node.js:
```bash
npm run build
npm start
```

#### Using Docker:
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
All API endpoints require an `x-api-key` header with your API key.

### Endpoints

#### Create Checkout Preference
```
POST /api/payments/preference
```

#### Get Payment Status
```
GET /api/payments/payment/:paymentId
```

#### Capture Payment
```
POST /api/payments/payment/:paymentId/capture
```

#### Cancel Payment
```
POST /api/payments/payment/:paymentId/cancel
```

#### Refund Payment
```
POST /api/payments/payment/:paymentId/refund
```

#### Search Payments by Booking
```
GET /api/payments/booking/:bookingId/payments
```

### Webhooks

#### Mercado Pago Webhook
```
POST /webhooks/mercadopago
```

### Health Checks

#### Basic Health
```
GET /health
```

#### Readiness Check
```
GET /health/ready
```

## Integration with Next.js

Use the provided client SDK:

```typescript
import { PaymentServiceClient } from './payment-service/src/client/payment-client';

const paymentClient = new PaymentServiceClient(
  'http://localhost:3001',
  process.env.PAYMENT_SERVICE_API_KEY
);

// Create preference
const result = await paymentClient.createPreference({
  bookingId: 'booking-123',
  assetType: 'activity',
  items: [{
    title: 'Tour de Noronha',
    quantity: 2,
    unitPrice: 150.00
  }],
  backUrls: {
    success: 'https://example.com/success',
    pending: 'https://example.com/pending',
    failure: 'https://example.com/cancel'
  }
});

// Redirect user to checkout
window.location.href = result.checkoutUrl;
```

## Testing

### Using Test Credentials

The service is configured with test credentials by default. Use these test cards:

- **Visa**: 4509 9535 6623 3704
- **Mastercard**: 5031 7557 3453 0604
- **CVV**: 123
- **Expiry**: Any future date

### Manual Testing

```bash
# Health check
curl http://localhost:3001/health

# Create preference (with API key)
curl -X POST http://localhost:3001/api/payments/preference \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "bookingId": "test-123",
    "assetType": "activity",
    "items": [{
      "title": "Test Item",
      "quantity": 1,
      "unitPrice": 100
    }],
    "backUrls": {
      "success": "http://localhost:3000/success",
      "pending": "http://localhost:3000/pending",
      "failure": "http://localhost:3000/cancel"
    }
  }'
```

## Security

- API key authentication for all endpoints
- Webhook signature verification
- HTTPS recommended for production
- Environment variables for sensitive data
- Rate limiting support

## Monitoring

- Winston logging with different log levels
- Health check endpoints
- Docker health checks
- Structured JSON logs in production

## License

Private - Tuca Noronha
