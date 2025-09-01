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

// NOTE: Mercado Pago webhook signature verification uses HMAC SHA-256 with a secret
// and a message built from request parameters. MP has two commonly seen formats:
// 1) message = `id:{id};topic:{type};ts:{ts}` using query params `id` and `type` (or `topic`).
// 2) message = `id:{id};request-id:{x-request-id};ts:{ts}` using `x-request-id` header.
// We'll attempt both for compatibility.
export async function verifyWebhookSignature(
  signatureHeader: string | null,
  request: Request
): Promise<boolean> {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET not set; skipping signature verification (DEV mode)");
    return true; // allow in dev
  }
  if (!signatureHeader) {
    console.error("Missing x-signature header");
    return false;
  }

  // Parse x-signature header. Expected format like: "ts=1731026009, v1=<hex>" or with semicolons.
  const parts = signatureHeader.split(/[;,]\s*/).map((p) => p.trim());
  const sigMap = new Map<string, string>();
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k && v) sigMap.set(k.trim(), v.trim());
  }
  const ts = sigMap.get("ts");
  const v1 = sigMap.get("v1");
  if (!ts || !v1) {
    console.error("x-signature header missing ts or v1");
    return false;
  }

  const url = new URL(request.url);
  const qpId = url.searchParams.get("id") ?? undefined;
  const qpType = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? undefined;
  const xRequestId = request.headers.get("x-request-id") ?? undefined;
  const headerId = request.headers.get("x-id") ?? undefined;
  const headerTopic = request.headers.get("x-topic") ?? undefined;

  const candidates: string[] = [];
  // Format 1: id;topic;ts (prefer query params, fallback to headers)
  const c1Id = qpId ?? headerId;
  const c1Topic = qpType ?? headerTopic;
  if (c1Id && c1Topic) {
    candidates.push(`id:${c1Id};topic:${c1Topic};ts:${ts}`);
  }
  // Format 2: id;request-id;ts (prefer query/header id paired with x-request-id)
  const c2Id = qpId ?? headerId;
  if (c2Id && xRequestId) {
    candidates.push(`id:${c2Id};request-id:${xRequestId};ts:${ts}`);
  }

  if (candidates.length === 0) {
    console.error("Unable to construct signature base string: missing id/topic or request-id");
    return false;
  }

  // Compute HMAC for each candidate and compare to v1.
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  for (const msg of candidates) {
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
    const expected = bufferToHex(sigBuf);
    if (timingSafeEqualHex(expected, v1)) {
      return true;
    }
  }

  console.error("Mercado Pago signature mismatch for all candidate formats");
  return false;
}

function bufferToHex(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time compare for hex strings of equal length
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
