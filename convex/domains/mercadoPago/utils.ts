// Utilities for Mercado Pago REST API integration (Convex server environment)

const BASE_URL = "https://api.mercadopago.com";

export function getAccessToken(): string {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing MERCADO_PAGO_ACCESS_TOKEN environment variable");
  }
  return token;
}

export async function mpFetch<T = any>(
  path: string,
  init: RequestInit & { method?: string } = {}
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // keep as text
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || text || res.statusText;
    throw new Error(`Mercado Pago API error (${res.status}): ${msg}`);
  }
  return (json ?? (text as any)) as T;
}

// NOTE: Mercado Pago webhook signature verification requires HMAC SHA256 over a specific string
// structure using the webhook secret, with parameters from the x-signature header. The exact
// construction may vary by account configuration.
// For now we provide a permissive placeholder that can be hardened later.
export function verifyWebhookSignature(
  signatureHeader: string | null,
  _rawBody: string
): boolean {
  const required = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!required) {
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET not set; skipping signature verification (DEV mode)");
    return true; // allow in dev
  }
  if (!signatureHeader) {
    console.error("Missing x-signature header");
    return false;
  }
  // TODO: Implement proper validation according to Mercado Pago docs.
  // This is intentionally permissive for initial sandbox/testing.
  return true;
}
