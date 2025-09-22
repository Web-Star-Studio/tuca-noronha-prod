/**
 * Script para testar o webhook do Mercado Pago
 * Simula o payload que o Mercado Pago envia
 */

const webhookUrl = "https://wonderful-salmon-48.convex.site/mercadopago/webhook";

// Payload similar ao que o MP envia
const testPayload = {
    action: "payment.updated",
    api_version: "v1",
    data: { id: "123456" },
    date_created: "2021-11-01T02:02:02Z",
    id: "123456",
    live_mode: false,
    type: "payment",
    user_id: 2453949822
};

console.log('🧪 Testando webhook do Mercado Pago...');
console.log('URL:', webhookUrl);
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('');

async function testWebhook() {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'MercadoPago Test Tool'
            },
            body: JSON.stringify(testPayload)
        });

        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        
        const responseText = await response.text();
        console.log(`📝 Response: ${responseText}`);

        if (response.ok) {
            console.log('✅ Webhook funcionando corretamente!');
        } else {
            console.log('❌ Webhook falhou');
        }

    } catch (error) {
        console.error('💥 Erro ao testar webhook:', error.message);
    }
}

testWebhook();
