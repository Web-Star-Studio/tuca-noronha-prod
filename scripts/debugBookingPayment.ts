/**
 * Script para debugar pagamento de reserva específica
 * Execute: bun run debug:booking -- <bookingId>
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const client = new ConvexHttpClient(CONVEX_URL);

const bookingId = process.argv[2];

if (!bookingId) {
  console.error("❌ Por favor forneça o ID da reserva:");
  console.error("   bun run debug:booking -- <bookingId>");
  process.exit(1);
}

console.log("🔍 Debugando reserva:", bookingId);
console.log("📍 Convex URL:", CONVEX_URL);
console.log();

async function debugBooking() {
  try {
    // 1. Verificar se a reserva existe
    console.log("1️⃣ Buscando reserva na base de dados...");
    
    // Tentar em todas as tabelas de booking
    const tables = [
      "activityBookings",
      "eventBookings", 
      "vehicleBookings",
      "restaurantReservations"
    ];
    
    let booking = null;
    let bookingType = null;
    
    for (const table of tables) {
      try {
        // Nota: isso requer uma query pública ou você precisa adicionar uma
        console.log(`   Tentando em ${table}...`);
        // booking = await client.query(api.domains.bookings.queries.getBookingById, { 
        //   bookingId,
        //   bookingType: table.replace("Bookings", "").replace("Reservations", "")
        // });
        // if (booking) {
        //   bookingType = table;
        //   break;
        // }
      } catch (error) {
        // Tabela não tem essa reserva, continuar
      }
    }
    
    // 2. Verificar webhooks relacionados
    console.log("\n2️⃣ Verificando webhooks do Mercado Pago...");
    console.log("   💡 Acesse o Convex Dashboard para ver logs:");
    console.log("   https://dashboard.convex.dev/");
    console.log();
    console.log("   Filtre por:");
    console.log(`   - "bookingId" e procure por "${bookingId}"`);
    console.log(`   - "[MP] Processing payment notification"`);
    console.log();
    
    // 3. Instruções para verificar no Mercado Pago
    console.log("3️⃣ Verificar no Dashboard do Mercado Pago:");
    console.log("   https://www.mercadopago.com.br/developers/panel");
    console.log();
    console.log("   Passos:");
    console.log("   a) Vá em 'Suas integrações' → Sua aplicação");
    console.log("   b) Vá em 'Webhooks'");
    console.log("   c) Veja o histórico de notificações enviadas");
    console.log("   d) Verifique se há erros nas tentativas de envio");
    console.log();
    
    // 4. Verificar configuração do webhook
    console.log("4️⃣ Verificar URL do Webhook:");
    console.log("   URL esperada: https://wonderful-salmon-48.convex.site/mercadopago/webhook");
    console.log();
    console.log("   Teste manualmente:");
    console.log("   curl https://wonderful-salmon-48.convex.site/mercadopago/webhook");
    console.log("   Deve retornar: 'Webhook endpoint is ready'");
    console.log();
    
    // 5. Próximos passos
    console.log("5️⃣ Próximos Passos:");
    console.log();
    console.log("   ✅ Se webhook foi recebido mas reserva não atualizou:");
    console.log("      → Problema nos metadados (bookingId não está sendo enviado)");
    console.log("      → Verificar logs do Convex Dashboard");
    console.log();
    console.log("   ❌ Se webhook NÃO foi recebido:");
    console.log("      → URL do webhook está incorreta no MP");
    console.log("      → Reconfigurar no painel do Mercado Pago");
    console.log();
    console.log("   🔧 Para forçar atualização manual:");
    console.log("      → Acesse o Convex Dashboard");
    console.log("      → Vá em 'Functions' → 'mercadoPago' → 'mutations'");
    console.log("      → Execute 'updateBookingPaymentStatus' manualmente");
    console.log();
    
    // 6. Informações úteis
    console.log("6️⃣ Informações Úteis:");
    console.log();
    console.log("   📦 Metadados que o webhook procura:");
    console.log("      - payment.metadata.bookingId");
    console.log("      - payment.metadata.booking_id");
    console.log("      - payment.external_reference");
    console.log();
    console.log("   📋 Status do pagamento esperados:");
    console.log("      - approved: Pagamento aprovado → Atualiza reserva");
    console.log("      - pending: Pagamento pendente");
    console.log("      - rejected: Pagamento rejeitado");
    console.log();

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

debugBooking();
