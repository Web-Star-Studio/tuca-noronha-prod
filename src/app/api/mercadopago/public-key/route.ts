import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: "Mercado Pago public key not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey });
}
