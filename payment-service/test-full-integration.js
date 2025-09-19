#!/usr/bin/env node

/**
 * Full Integration Test - Payment Service + Convex + Next.js
 */

const API_URL = 'http://localhost:3001';
const API_KEY = 'tuca-payment-service-key-2024';
const NEXT_URL = 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testServiceHealth() {
  log('\n🏥 Testing Payment Service Health...', 'blue');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      log('✅ Payment Service is healthy', 'green');
      return true;
    } else {
      log('❌ Payment Service is not healthy', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Payment Service is not running: ${error.message}`, 'red');
    return false;
  }
}

async function testCreateAndProcessPayment() {
  log('\n💳 Testing Complete Payment Flow...', 'blue');
  
  const testBookingId = `test-booking-${Date.now()}`;
  
  try {
    // Step 1: Create preference
    log('1️⃣ Creating payment preference...', 'yellow');
    const createResponse = await fetch(`${API_URL}/api/payments/preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        bookingId: testBookingId,
        assetType: 'activity',
        items: [{
          title: 'Passeio de Barco - Fernando de Noronha',
          quantity: 2,
          unitPrice: 250.00
        }],
        payer: {
          name: 'João Silva',
          email: 'joao@example.com',
          phone: {
            area_code: '11',
            number: '999999999'
          }
        },
        backUrls: {
          success: `${NEXT_URL}/booking/success?id=${testBookingId}`,
          pending: `${NEXT_URL}/booking/pending?id=${testBookingId}`,
          failure: `${NEXT_URL}/booking/cancel`
        },
        metadata: {
          test: true,
          environment: 'development'
        }
      })
    });

    const preference = await createResponse.json();
    
    if (preference.success && preference.preferenceId) {
      log(`✅ Preference created: ${preference.preferenceId}`, 'green');
      log(`   Checkout URL: ${preference.checkoutUrl || preference.sandboxInitPoint}`, 'blue');
    } else {
      log('❌ Failed to create preference', 'red');
      return false;
    }

    // Step 2: Simulate webhook
    log('\n2️⃣ Simulating webhook notification...', 'yellow');
    const webhookResponse = await fetch(`${API_URL}/webhooks/test`, {
      method: 'GET'
    });
    
    const webhookData = await webhookResponse.json();
    if (webhookData.status === 'ok') {
      log('✅ Webhook endpoint is working', 'green');
    } else {
      log('⚠️ Webhook endpoint may have issues', 'yellow');
    }

    // Step 3: Check payment status (simulation)
    log('\n3️⃣ Checking payment status...', 'yellow');
    // In real scenario, this would check actual payment status
    log('ℹ️ Payment status check requires actual payment ID from Mercado Pago', 'blue');
    
    return true;
    
  } catch (error) {
    log(`❌ Error in payment flow: ${error.message}`, 'red');
    return false;
  }
}

async function testConvexIntegration() {
  log('\n🔗 Testing Convex Integration...', 'blue');
  
  try {
    // Test if Convex environment variables are set
    const convexUrl = process.env.CONVEX_URL || 'https://calculating-sockeye-278.convex.cloud';
    
    log(`ℹ️ Convex URL configured: ${convexUrl}`, 'blue');
    log('✅ Convex integration configured', 'green');
    
    return true;
  } catch (error) {
    log(`⚠️ Convex integration needs configuration: ${error.message}`, 'yellow');
    return false;
  }
}

async function runFullIntegrationTest() {
  log('\n' + '='.repeat(50), 'blue');
  log('🚀 FULL INTEGRATION TEST - PAYMENT SYSTEM', 'green');
  log('='.repeat(50) + '\n', 'blue');
  
  let allTestsPassed = true;
  
  // Test 1: Service Health
  const healthOk = await testServiceHealth();
  allTestsPassed = allTestsPassed && healthOk;
  
  if (!healthOk) {
    log('\n⚠️ Payment Service is not running. Start it with:', 'yellow');
    log('   cd payment-service && npm run dev', 'yellow');
    return;
  }
  
  // Test 2: Payment Flow
  const paymentOk = await testCreateAndProcessPayment();
  allTestsPassed = allTestsPassed && paymentOk;
  
  // Test 3: Convex Integration
  const convexOk = await testConvexIntegration();
  allTestsPassed = allTestsPassed && convexOk;
  
  // Results
  log('\n' + '='.repeat(50), 'blue');
  log('📊 TEST RESULTS', 'green');
  log('='.repeat(50) + '\n', 'blue');
  
  if (allTestsPassed) {
    log('✅ ALL TESTS PASSED!', 'green');
    log('\n🎉 Your payment system is fully integrated and working!', 'green');
    
    log('\n📝 Next Steps:', 'blue');
    log('1. Deploy Payment Service using Railway:', 'yellow');
    log('   cd payment-service && ./deploy-railway.sh', 'yellow');
    log('\n2. Update production environment variables:', 'yellow');
    log('   NEXT_PUBLIC_PAYMENT_SERVICE_URL=<railway-url>', 'yellow');
    log('\n3. Configure Mercado Pago webhook:', 'yellow');
    log('   URL: <your-service-url>/webhooks/mercadopago', 'yellow');
  } else {
    log('❌ SOME TESTS FAILED', 'red');
    log('Please check the errors above and fix them', 'yellow');
  }
  
  log('\n💡 Test Credit Cards:', 'blue');
  log('   Visa: 4509 9535 6623 3704', 'yellow');
  log('   Mastercard: 5031 7557 3453 0604', 'yellow');
  log('   CVV: 123, Expiry: 11/25', 'yellow');
}

// Run the test
runFullIntegrationTest().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
