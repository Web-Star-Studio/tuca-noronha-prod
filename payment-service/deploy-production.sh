#!/bin/bash

# 🚀 Deploy Payment Service to Production
# This script automates the entire deployment process

set -e  # Exit on error

echo "================================================"
echo "🚀 DEPLOYING PAYMENT SERVICE TO PRODUCTION"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check Railway authentication
echo -e "${YELLOW}Checking Railway authentication...${NC}"
railway whoami || {
    echo -e "${RED}Not logged in to Railway. Please run: railway login${NC}"
    exit 1
}

# Production variables
PROD_API_KEY="prod-tuca-payment-key-2024-secure"
CONVEX_PROD_URL="https://wonderful-salmon-48.convex.cloud"
FRONTEND_PROD_URL="https://www.tucanoronha.com.br"

echo -e "${GREEN}✓ Railway authenticated${NC}"
echo ""

# Initialize Railway project if not exists
if [ ! -f ".railway/config.json" ]; then
    echo -e "${YELLOW}Initializing Railway project...${NC}"
    railway init
    echo -e "${GREEN}✓ Railway project initialized${NC}"
fi

# Set production environment variables
echo -e "${YELLOW}Setting production environment variables...${NC}"

railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set MERCADO_PAGO_ACCESS_TOKEN="APP_USR-4502131590791687-091910-8b2ae9f979b05fd51b5dd3f64dee711d-2702432900"
railway variables set MERCADO_PAGO_PUBLIC_KEY="APP_USR-c6615316-135e-4bae-a601-09ea74695458"
railway variables set MERCADO_PAGO_WEBHOOK_SECRET="651dca06e476bbb3bdaa96f00b6db41f1d5b890c86e68f92ca1b37ebabd03ece"
railway variables set API_KEY="$PROD_API_KEY"
railway variables set CONVEX_URL="$CONVEX_PROD_URL"
railway variables set CONVEX_WEBHOOK_SECRET="convex-webhook-secret-2024"
railway variables set FRONTEND_URL="$FRONTEND_PROD_URL"
railway variables set LOG_LEVEL="info"

echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Deploy to Railway
echo -e "${YELLOW}Deploying to Railway...${NC}"
railway up

echo ""
echo -e "${GREEN}✓ Deployment initiated${NC}"
echo ""

# Get service URL
echo -e "${YELLOW}Getting service URL...${NC}"
SERVICE_URL=$(railway domain)

if [ -z "$SERVICE_URL" ]; then
    echo -e "${YELLOW}No domain found. Generating one...${NC}"
    railway domain create
    SERVICE_URL=$(railway domain)
fi

echo -e "${GREEN}✓ Service URL: $SERVICE_URL${NC}"
echo ""

# Update Convex environment variables
echo "================================================"
echo "📝 NEXT STEPS"
echo "================================================"
echo ""
echo "1. Update Convex production variables:"
echo -e "${YELLOW}npx convex env set PAYMENT_SERVICE_URL https://$SERVICE_URL --prod${NC}"
echo -e "${YELLOW}npx convex env set PAYMENT_SERVICE_API_KEY $PROD_API_KEY --prod${NC}"
echo ""
echo "2. Update Vercel environment variables:"
echo "   - PAYMENT_SERVICE_API_KEY = $PROD_API_KEY"
echo "   - NEXT_PUBLIC_PAYMENT_SERVICE_URL = https://$SERVICE_URL"
echo ""
echo "3. Configure Mercado Pago webhook:"
echo "   URL: https://$SERVICE_URL/webhooks/mercadopago"
echo ""
echo "4. (Optional) Add custom domain:"
echo -e "${YELLOW}railway domain add payments.tucanoronha.com.br${NC}"
echo ""

# Test the deployment
echo "================================================"
echo "🧪 TESTING DEPLOYMENT"
echo "================================================"
echo ""

echo "Waiting for service to be ready..."
sleep 10

# Health check
echo "Testing health endpoint..."
curl -s "https://$SERVICE_URL/health" | jq . || echo -e "${RED}Health check failed. Service may still be starting...${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Service URL: https://$SERVICE_URL"
echo "Health Check: https://$SERVICE_URL/health"
echo "Logs: railway logs --tail"
echo ""
echo "Don't forget to complete the integration steps above!"
