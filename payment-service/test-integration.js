#!/usr/bin/env node

/**
 * Test script for Payment Service integration
 */

const API_URL = 'http://localhost:3001';
const API_KEY = 'tuca-payment-service-key-2024';

async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  const response = await fetch(`${API_URL}/health`);
  const data = await response.json();
  console.log('Health:', data);
  return data.status === 'healthy';
}

async function testCreatePreference() {
  console.log('\n💳 Testing create preference...');
  
  const response = await fetch(`${API_URL}/api/payments/preference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      bookingId: `test-${Date.now()}`,
      assetType: 'activity',
      items: [{
        title: 'Test Tour - Fernando de Noronha',
        quantity: 2,
        unitPrice: 150.00
      }],
      payer: {
        name: 'Test User',
        email: 'test@example.com'
      },
      backUrls: {
        success: 'http://localhost:3000/success',
        pending: 'http://localhost:3000/pending',
        failure: 'http://localhost:3000/cancel'
      },
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    })
  });

  const data = await response.json();
  console.log('Preference created:', {
    success: data.success,
    preferenceId: data.preferenceId,
    checkoutUrl: data.checkoutUrl ? '✅ URL generated' : '❌ No URL'
  });
  
  return data;
}

async function runTests() {
  console.log('🚀 Starting Payment Service Integration Tests\n');
  console.log('================================\n');

  try {
    // Test 1: Health Check
    const isHealthy = await testHealthCheck();
    if (!isHealthy) {
      throw new Error('Service is not healthy');
    }
    console.log('✅ Health check passed');

    // Test 2: Create Preference
    const preference = await testCreatePreference();
    if (!preference.success) {
      throw new Error('Failed to create preference');
    }
    console.log('✅ Preference creation passed');
    
    // Display checkout URL for manual testing
    console.log('\n📋 Test Results:');
    console.log('================');
    console.log('✅ All tests passed!');
    console.log('\n🔗 Checkout URL for manual testing:');
    console.log(preference.checkoutUrl || preference.sandboxInitPoint);
    console.log('\n💡 Use these test cards:');
    console.log('   Visa: 4509 9535 6623 3704');
    console.log('   Mastercard: 5031 7557 3453 0604');
    console.log('   CVV: 123, Expiry: 11/25');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
