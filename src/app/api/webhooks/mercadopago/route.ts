import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("[MP Webhook] Received:", JSON.stringify(body, null, 2));

    // Validate webhook signature if needed
    // const signature = request.headers.get("x-signature");
    // const requestId = request.headers.get("x-request-id");
    
    // Basic validation
    if (!body.type) {
      console.error("[MP Webhook] Invalid payload - missing type:", body);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const eventType = body.type || body.topic;
    console.log(`[MP Webhook] Processing type: ${eventType}`);

    // Route to appropriate processor based on event type
    let result;

    if (
      eventType === "subscription_preapproval" ||
      eventType === "subscription_authorized_payment" ||
      eventType === "subscription_preapproval_plan"
    ) {
      // Process subscription/guide webhooks
      console.log("[MP Webhook] → Routing to subscription processor");
      console.log("[MP Webhook] Calling action with args:", {
        id: body.id,
        type: eventType,
        action: body.action,
        data: body.data,
        entity: body.entity,
        application_id: body.application_id,
        date: body.date,
        version: body.version,
      });
      
      try {
        // Build args object, only including defined values
        const actionArgs: any = {};
        if (body.id !== undefined) actionArgs.id = body.id;
        if (eventType !== undefined) actionArgs.type = eventType;
        if (body.action !== undefined) actionArgs.action = body.action;
        if (body.data !== undefined) actionArgs.data = body.data;
        if (body.entity !== undefined) actionArgs.entity = body.entity;
        if (body.application_id !== undefined) actionArgs.application_id = body.application_id;
        if (body.date !== undefined) actionArgs.date = body.date;
        if (body.version !== undefined) actionArgs.version = body.version;

        result = await convex.action(
          api.domains.subscriptions.actions.processSubscriptionWebhook,
          actionArgs
        );
        console.log("[MP Webhook] Action result:", result);
      } catch (actionError) {
        console.error("[MP Webhook] Action error:", actionError);
        throw actionError;
      }
    } else if (eventType === "payment") {
      // Process payment webhooks (package proposals)
      console.log("[MP Webhook] → Routing to payment processor");
      
      // Validação extra para pagamentos
      if (!body.data?.id) {
        console.error("[MP Webhook] Invalid payment payload - missing data.id:", body);
        return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
      }

      result = await convex.mutation(api.domains.payments.mutations.processPaymentWebhook, {
        id: body.id,
        live_mode: body.live_mode || false,
        type: body.type,
        date_created: body.date_created,
        application_id: body.application_id || 0,
        user_id: body.user_id || 0,
        version: body.version || 1,
        api_version: body.api_version || "v1",
        action: body.action || "payment.updated",
        data: {
          id: body.data.id,
        },
      });
    } else {
      // Unknown event type
      console.warn(`[MP Webhook] Unknown event type: ${eventType}`);
      return NextResponse.json({ 
        status: "ignored", 
        message: `Event type ${eventType} not handled` 
      }, { status: 200 });
    }

    if (result?.success || result?.processed) {
      console.log(`[MP Webhook] ✅ Processed successfully:`, result);
      return NextResponse.json({ status: "ok" }, { status: 200 });
    } else {
      console.error(`[MP Webhook] ❌ Processing failed:`, result);
      return NextResponse.json({ 
        error: result?.error || result?.message || "Processing failed" 
      }, { status: 400 });
    }
  } catch (error) {
    console.error("[MP Webhook] ❌ Exception:", error);
    console.error("[MP Webhook] Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({ status: "Webhook endpoint is active" });
}
