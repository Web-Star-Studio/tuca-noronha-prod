#!/bin/bash

echo "🚀 Starting Tuca Noronha Full Stack..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Kill existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "next dev" 2>/dev/null
pkill -f "tsx watch" 2>/dev/null
pkill -f "convex dev" 2>/dev/null
sleep 2

# Start Payment Service
echo -e "${BLUE}Starting Payment Service on port 3001...${NC}"
cd payment-service && npm run dev &
PAYMENT_PID=$!
sleep 3

# Check if payment service started
if check_port 3001; then
    echo -e "${GREEN}✅ Payment Service running on http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠️ Payment Service may not have started properly${NC}"
fi

cd ..

# Start Convex
echo -e "${BLUE}Starting Convex backend...${NC}"
npx convex dev &
CONVEX_PID=$!
sleep 3

# Start Next.js
echo -e "${BLUE}Starting Next.js on port 3000...${NC}"
npm run dev &
NEXT_PID=$!
sleep 5

# Check if Next.js started
if check_port 3000; then
    echo -e "${GREEN}✅ Next.js running on http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️ Next.js may not have started properly${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 All services started!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "💳 Payment Service: http://localhost:3001"
echo "🔧 Payment Service Health: http://localhost:3001/health"
echo "📊 Convex Dashboard: https://dashboard.convex.dev"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to handle cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    kill $PAYMENT_PID 2>/dev/null
    kill $CONVEX_PID 2>/dev/null
    kill $NEXT_PID 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    pkill -f "tsx watch" 2>/dev/null
    pkill -f "convex dev" 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for all background processes
wait
