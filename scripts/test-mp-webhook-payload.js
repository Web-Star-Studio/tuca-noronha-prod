/**
 * Test script com o payload exato que o Mercado Pago enviou
 */

const webhookUrl = "https://wonderful-salmon-48.convex.site/mercadopago/webhook";

// Payload exato que falhou
const testPayload = {
  action: "payment.updated",
  api_version: "v1",
  data: {"id":"123456"},
  date_created: "2021-11-01T02:02:02Z",
  id: "123456",
  live_mode: false,
  type: "payment",
  user_id: 2453949822
};

async function testExactPayload() {
    console.log('🧪 Testando payload exato do Mercado Pago...');
    console.log('===============================================');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    console.log('');

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'MercadoPago/1.0',
                'X-Signature': 'ts=1234567890,v1=test' // Fake signature for test
            },
            body: JSON.stringify(testPayload)
        });

        const status = response.status;
        const responseText = await response.text();
        
        console.log(`📊 Resultado:`);
        console.log(`   Status: ${status}`);
        console.log(`   Response: ${responseText}`);
        
        if (status === 200) {
            console.log('✅ SUCESSO: Webhook processou corretamente');
        } else {
            console.log(`❌ ERRO: Status ${status}`);
            console.log(`   Descrição: ${responseText}`);
        }
        
    } catch (error) {
        console.log(`💥 ERRO DE REDE: ${error.message}`);
    }
}

testExactPayload();
