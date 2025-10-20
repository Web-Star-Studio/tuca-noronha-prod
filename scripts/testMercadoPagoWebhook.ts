/**
 * Script para testar o webhook do Mercado Pago localmente
 * Execute: bun run scripts/testMercadoPagoWebhook.ts
 */

const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL || "https://wonderful-salmon-48.convex.site";
const WEBHOOK_URL = `${CONVEX_SITE_URL}/mercadopago/webhook`;

// Payload de exemplo do Mercado Pago
const testPayload = {
  id: "12345678",
  type: "payment",
  action: "payment.created",
  data: {
    id: "12345678"
  }
};

console.log("🧪 Testando webhook do Mercado Pago...");
console.log(`📍 URL: ${WEBHOOK_URL}`);
console.log(`📦 Payload:`, JSON.stringify(testPayload, null, 2));

async function testWebhook() {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MercadoPago/1.0-Test",
        "X-Signature": "test-signature",
      },
      body: JSON.stringify(testPayload),
    });

    const text = await response.text();
    
    console.log("\n✅ Resposta recebida:");
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Body: ${text}`);

    if (response.ok) {
      console.log("\n🎉 Webhook processado com sucesso!");
      console.log("📊 Verifique os logs no Dashboard do Convex:");
      console.log("   https://dashboard.convex.dev/");
    } else {
      console.error("\n❌ Erro ao processar webhook");
    }
  } catch (error) {
    console.error("\n❌ Erro ao testar webhook:", error);
  }
}

// Também testa o endpoint GET (validação)
async function testGetValidation() {
  console.log("\n🔍 Testando endpoint GET (validação do MP)...");
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "GET",
    });

    const text = await response.text();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Body: ${text}`);
  } catch (error) {
    console.error("Erro ao testar GET:", error);
  }
}

// Executa os testes
(async () => {
  await testGetValidation();
  console.log("\n" + "=".repeat(60) + "\n");
  await testWebhook();
})();
