#!/bin/bash

# Deploy script for Railway
echo "🚀 Deploying Payment Service to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Initialize Railway project if not exists
if [ ! -f "railway.json" ]; then
    echo "🎯 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set MERCADO_PAGO_ACCESS_TOKEN="${MERCADO_PAGO_ACCESS_TOKEN}"
railway variables set MERCADO_PAGO_PUBLIC_KEY="${MERCADO_PAGO_PUBLIC_KEY}"
railway variables set MERCADO_PAGO_WEBHOOK_SECRET="${MERCADO_PAGO_WEBHOOK_SECRET}"
railway variables set API_KEY="${API_KEY:-tuca-payment-service-key-2024}"
railway variables set CONVEX_URL="${CONVEX_URL:-https://wonderful-salmon-48.convex.cloud}"
railway variables set FRONTEND_URL="${FRONTEND_URL:-https://tucanoronha.com.br}"
railway variables set LOG_LEVEL=info

# Deploy
echo "🚂 Deploying to Railway..."
railway up

# Get deployment URL
echo "✅ Deployment complete!"
echo "🌐 Your service URL:"
railway domain

echo ""
echo "📝 Next steps:"
echo "1. Update NEXT_PUBLIC_PAYMENT_SERVICE_URL in your .env with the Railway URL"
echo "2. Configure webhook URL in Mercado Pago dashboard"
echo "3. Add custom domain: railway domain add payments.tucanoronha.com.br"
