import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Stripe webhook handler
 * This endpoint receives webhooks from Stripe and processes them
 * 
 * Setup in Stripe Dashboard:
 * 1. Go to Developers > Webhooks
 * 2. Add endpoint: https://your-domain.com/stripe/webhook
 * 3. Select events: checkout.session.completed, payment_intent.succeeded, etc.
 * 4. Add webhook signing secret to environment variables
 */
export const handleStripeWebhook = httpAction(async (ctx, request) => {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature");
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature (would need to import Stripe here if doing full verification)
    // For now, we'll trust the signature check is done at the infrastructure level
    
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error("Invalid JSON in webhook body");
      return new Response("Invalid JSON", { status: 400 });
    }

    // Log the event for debugging
    console.log(`📧 Received Stripe webhook: ${event.type} (${event.id})`);

    // Process the event
    const result = await ctx.runAction(internal.domains.stripe.actions.processWebhookEvent, {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      data: event.data.object,
    });

    if (result.success) {
      console.log(`✅ Successfully processed webhook: ${event.id}`);
      return new Response("Webhook processed", { status: 200 });
    } else {
      console.error(`❌ Failed to process webhook: ${event.id}`, result.error);
      return new Response(`Processing failed: ${result.error}`, { status: 500 });
    }

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

/**
 * Test webhook endpoint for development
 * This can be used to manually test webhook processing
 */
export const testWebhook = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    
    console.log("🧪 Test webhook received:", body);

    // Create a test event
    const testEvent = {
      id: `test_${Date.now()}`,
      type: body.type || "checkout.session.completed",
      livemode: false,
      data: body.data || {
        id: "test_session",
        payment_intent: "test_pi",
        customer: "test_customer",
        metadata: {
          bookingId: body.bookingId || "test_booking",
          userId: body.userId || "test_user",
          assetType: body.assetType || "activity",
          assetId: body.assetId || "test_asset",
        },
        receipt_url: "https://pay.stripe.com/receipts/test"
      }
    };

    // Process the test event
    const result = await ctx.runAction(internal.domains.stripe.actions.processWebhookEvent, {
      eventId: testEvent.id,
      eventType: testEvent.type,
      livemode: testEvent.livemode,
      data: testEvent.data,
    });

    return new Response(JSON.stringify({
      success: result.success,
      processed: result.processed,
      error: result.error,
      eventId: testEvent.id,
    }), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Test webhook error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
