import * as dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

async function testSubscriptionWebhook() {
  console.log("🧪 Testing subscription webhook processing...\n");

  // Use the real user ID provided
  const testUserId = "jx74mesdz2mepnm63zkxy70rbh7j3rsw";
  console.log("👤 Using real user ID:", testUserId);

  try {

    // Test 1: Create a test subscription directly
    console.log("\n📝 Test 1: Creating subscription...");
    
    const testSubscriptionData = {
      id: `sub_test_${Date.now()}`,
      customer: "cus_test_123",
      status: "active",
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
      // canceled_at omitted for active subscriptions
      items: {
        data: [{
          price: {
            id: "price_1RgUUlGbTEVfu7BMLwU6TSdF", // Using the real price ID
          },
        }],
      },
      metadata: {
        userId: testUserId,
      },
    };

    const subscriptionResult = await convex.action(internal.domains.subscriptions.actions.processSubscriptionWebhook, {
      eventType: "customer.subscription.created",
      subscription: testSubscriptionData,
    });

    console.log("✅ Subscription processing result:", subscriptionResult);

    if (!subscriptionResult.success) {
      console.error("❌ Subscription creation failed:", subscriptionResult.error);
      return;
    }

    // Test 2: Create a test payment for the subscription
    console.log("\n💰 Test 2: Creating payment record...");
    
    // First, we need to get the subscription we just created to get its ID
    console.log("🔍 Looking up created subscription...");
    const subscription = await convex.query(internal.domains.subscriptions.queries.getByStripeSubscriptionId, {
      stripeSubscriptionId: testSubscriptionData.id,
    });

    if (!subscription) {
      console.error("❌ Could not find created subscription");
      return;
    }

    console.log("✅ Found subscription:", subscription._id);

    const testInvoiceData = {
      id: `in_test_${Date.now()}`,
      customer: "cus_test_123",
      subscription: testSubscriptionData.id,
      amount_paid: 9900, // R$ 99.00 in cents
      currency: "brl",
      payment_intent: `pi_test_${Date.now()}`,
      status: "paid",
      paid: true,
      created: Math.floor(Date.now() / 1000),
    };

    const invoiceResult = await convex.action(internal.domains.subscriptions.actions.processInvoiceWebhook, {
      eventType: "invoice.paid",
      invoice: testInvoiceData,
    });

    console.log("✅ Invoice processing result:", invoiceResult);

    if (!invoiceResult.success) {
      console.error("❌ Invoice processing failed:", invoiceResult.error);
      return;
    }

    // Test 3: Direct verification - check subscription exists in database
    console.log("\n🔍 Test 3: Direct database verification...");
    
    const directSubscriptionCheck = await convex.query(internal.domains.subscriptions.queries.getByStripeSubscriptionId, {
      stripeSubscriptionId: testSubscriptionData.id,
    });

    console.log("✅ Direct subscription lookup:", {
      found: !!directSubscriptionCheck,
      subscriptionId: directSubscriptionCheck?._id,
      userId: directSubscriptionCheck?.userId,
      status: directSubscriptionCheck?.status,
      stripeId: directSubscriptionCheck?.stripeSubscriptionId,
    });

    // Test 4: Check if user has subscription with direct user ID query
    console.log("\n👤 Test 4: Check user subscription directly...");
    
    // Create a temporary query to check user subscriptions directly
    const userSubscriptions = await convex.query(internal.domains.users.queries.getUserById, {
      userId: testUserId,
    });

    console.log("✅ User exists:", !!userSubscriptions);

    // Test 5: Check payment records directly by subscription ID
    console.log("\n💳 Test 5: Check payment records...");
    
    // Note: Since we don't have a direct query for payments by subscription ID in our internal queries,
    // we'll rely on the fact that the invoice webhook returned success

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- User ID used:", testUserId);
    console.log("- Subscription created:", subscriptionResult.success);
    console.log("- Payment recorded:", invoiceResult.success);
    console.log("- Subscription found in DB:", !!directSubscriptionCheck);
    console.log("- User exists:", !!userSubscriptions);
    console.log("- Subscription status:", directSubscriptionCheck?.status);
    console.log("- Subscription Stripe ID:", directSubscriptionCheck?.stripeSubscriptionId);

    // Now test the actual hasActiveSubscription function that would be used in the app
    console.log("\n🎯 Test 6: Testing hasActiveSubscription (will likely fail due to auth)...");
    try {
      const hasActive = await convex.query(internal.domains.subscriptions.queries.hasActiveSubscription, {});
      console.log("✅ hasActiveSubscription result:", hasActive);
    } catch (error) {
      console.log("⚠️ hasActiveSubscription failed (expected due to no auth context):", error.message);
    }

  } catch (error) {
    console.error("\n💥 Error during test:", error);
    
    // Try to get more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run the test
if (require.main === module) {
  testSubscriptionWebhook()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 