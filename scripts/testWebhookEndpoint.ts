import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testWebhookEndpoint() {
  console.log("🧪 Testing webhook endpoint...\n");

  const webhookUrl = "http://localhost:3000/api/stripe-webhook";
  
  // Simulate a checkout.session.completed event for subscription
  const testEvent = {
    id: `evt_test_${Date.now()}`,
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        object: "checkout.session",
        mode: "subscription",
        customer: "cus_test_123",
        subscription: "sub_test_123",
        invoice: "in_test_123",
        payment_intent: null,
        metadata: {
          type: "guide_subscription",
          userId: "jx74mesdz2mepnm63zkxy70rbh7j3rsw",
        },
      },
    },
  };

  try {
    console.log("📤 Sending test webhook to:", webhookUrl);
    console.log("Event type:", testEvent.type);
    console.log("Session mode:", testEvent.data.object.mode);
    console.log("Metadata:", testEvent.data.object.metadata);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "test_signature", // This will fail signature verification but test routing
      },
      body: JSON.stringify(testEvent),
    });

    console.log("\n📥 Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("Response body:", responseText);

    if (response.ok) {
      console.log("\n✅ Webhook endpoint is reachable and responding");
    } else {
      console.log("\n⚠️ Webhook endpoint returned error:", response.status);
    }

  } catch (error) {
    console.error("\n💥 Error testing webhook endpoint:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testWebhookEndpoint()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 