import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("Received MP webhook:", JSON.stringify(body, null, 2));

    // Validate webhook signature if needed
    // const signature = request.headers.get("x-signature");
    // const requestId = request.headers.get("x-request-id");
    
    // Basic validation
    if (!body.id || !body.type || !body.data?.id) {
      console.error("Invalid webhook payload:", body);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Process the webhook
    const result = await convex.mutation(api.domains.payments.mutations.processPaymentWebhook, {
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

    if (result.success) {
      console.log("Webhook processed successfully:", result.message);
      return NextResponse.json({ status: "ok" }, { status: 200 });
    } else {
      console.error("Error processing webhook:", result.message);
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({ status: "Webhook endpoint is active" });
}
