import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { verifyWebhookSignature } from "./utils";

/**
 * Mercado Pago webhook handler
 * Handles various payload shapes and headers used by Mercado Pago.
 */
export const handleMercadoPagoWebhook = httpAction(async (ctx, request) => {
  try {
    const rawBody = await request.text();

    // Signature verification (flexible for testing)
    const signature = request.headers.get("x-signature");
    const userAgent = request.headers.get("user-agent") || "";
    const isTestFromMP = userAgent.includes("MercadoPago") || userAgent.includes("curl") || userAgent.includes("MP-Monitor");
    
    // Skip signature verification for MP test tool or if no secret is configured
    const shouldVerifySignature = !isTestFromMP && process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    
    if (shouldVerifySignature) {
      const valid = await verifyWebhookSignature(signature, request);
      if (!valid) {
        console.error("Invalid Mercado Pago webhook signature");
        return new Response("Invalid signature", { status: 400 });
      }
    } else {
      console.log("🔓 Signature verification skipped (test mode or no secret configured)");
    }

    // Parse JSON body if present
    let body: any = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      // Non-JSON payloads are rare but we tolerate; continue with empty object
      console.warn("Could not parse Mercado Pago webhook body as JSON.", e);
      body = {};
    }

    // MP may also pass identifiers via headers or query string
    const url = new URL(request.url);
    const qpId = url.searchParams.get("id");
    const qpType = url.searchParams.get("type") || url.searchParams.get("topic");

    const headerId = request.headers.get("x-id");
    const headerTopic = request.headers.get("x-topic");

    // Attempt to normalize event fields
    const event = {
      id: body?.id ?? body?.data?.id ?? headerId ?? qpId ?? undefined,
      type: body?.type ?? headerTopic ?? qpType ?? undefined,
      action: body?.action ?? body?.event ?? undefined,
      data: body?.data ?? body ?? undefined,
    } as { id?: string | number; type?: string; action?: string; data?: any };

    console.log(`📧 Received Mercado Pago webhook: type=${event.type} action=${event.action} id=${event.id}`);
    console.log(`📝 Raw body: ${rawBody}`);
    console.log(`🔍 Event data:`, JSON.stringify(event, null, 2));

    // Validate that we have the minimum required data
    if (!event.id) {
      console.error("❌ Missing event ID in webhook payload");
      return new Response("Missing event ID", { status: 400 });
    }

    const result = await ctx.runAction(
      internal.domains.mercadoPago.actions.processWebhookEvent,
      {
        id: event.id,
        type: event.type,
        action: event.action,
        data: event.data,
      }
    );

    if (result.success) {
      console.log("✅ MP webhook processed successfully");
      return new Response("ok", { status: 200 });
    }

    console.error("❌ MP webhook processing failed:", result.error);
    return new Response(`Processing failed: ${result.error}`, { status: 400 });
  } catch (error) {
    console.error("MP webhook handler error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

/**
 * Development test endpoint to simulate webhook payloads
 */
export const testWebhook = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const testEvent = {
      id: body.id ?? `mp_test_${Date.now()}`,
      type: body.type ?? "payment",
      action: body.action ?? "payment.updated",
      data: body.data ?? { id: body.paymentId ?? `mp_pay_${Date.now()}` },
    };

    const result = await ctx.runAction(
      internal.domains.mercadoPago.actions.processWebhookEvent,
      testEvent as any
    );

    return new Response(
      JSON.stringify({ success: result.success, processed: result.processed, error: result.error }),
      { status: result.success ? 200 : 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("MP test webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
