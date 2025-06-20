import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Expected payload: { amount: number; currency?: string; customerId?: string; metadata?: any }
export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "brl", customerId, metadata } = await req.json();

    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Invalid or missing amount (in cents)" },
        { status: 400 }
      );
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: metadata ?? {},
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error: any) {
    console.error("Stripe PI Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 