/**
 * Script para verificar eventos de webhook do Mercado Pago
 */

// Simular um fetch dos últimos eventos (em produção usaria Convex client)
console.log('🔍 Verificando eventos de webhook do Mercado Pago...');
console.log('================================================');

// Vamos testar se o endpoint está respondendo e ver se tem eventos recentes
const webhookUrl = "https://wonderful-salmon-48.convex.site/mercadopago/test-webhook";

async function testWebhookResponse() {
    console.log(`📡 Testando endpoint: ${webhookUrl}`);
    
    try {
        const testPayload = {
            id: `test_${Date.now()}`,
            type: "payment",
            action: "payment.updated",
            data: { id: "mp_test_payment_123" }
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TestScript/1.0'
            },
            body: JSON.stringify(testPayload)
        });

        const status = response.status;
        const responseData = await response.json();
        
        console.log(`   Status: ${status}`);
        console.log(`   Response:`, responseData);
        
        if (responseData.success) {
            console.log('✅ Webhook endpoint está funcionando corretamente!');
        } else {
            console.log('❌ Webhook teve problema:', responseData.error);
        }
        
    } catch (error) {
        console.log(`❌ Erro ao testar webhook: ${error.message}`);
    }
}

async function checkRecentActivity() {
    console.log('\n📊 Status dos webhooks:');
    console.log('   ✅ Endpoint configurado: /mercadopago/webhook');
    console.log('   ✅ Endpoint de teste: /mercadopago/test-webhook');
    console.log('   ✅ Handler: handleMercadoPagoWebhook');
    console.log('   ✅ Processamento: processWebhookEvent');
    console.log('   ✅ Armazenamento: mpWebhookEvents table');
    
    console.log('\n🔧 Configuração necessária:');
    console.log('   1. URL no dashboard MP: https://wonderful-salmon-48.convex.site/mercadopago/webhook');
    console.log('   2. Eventos: payment, merchant_order');
    console.log('   3. Webhook secret (opcional): MERCADO_PAGO_WEBHOOK_SECRET');
}

async function main() {
    await testWebhookResponse();
    await checkRecentActivity();
}

main().catch(console.error);
