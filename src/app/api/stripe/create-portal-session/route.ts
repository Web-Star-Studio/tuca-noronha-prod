import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Expected payload: { customerId: string }
export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url:
        process.env.STRIPE_BILLING_PORTAL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000/",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Billing Portal Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 