"use node";

import Stripe from "stripe";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

async function setupGuideSubscription() {
  try {
    console.log("🔍 Procurando produto existente...");
    
    // Buscar produtos existentes
    const products = await stripe.products.list({
      limit: 100,
    });

    let product = products.data.find(
      (p) => p.name === "Guia Fernando de Noronha Anual 2025"
    );

    // Se não encontrar, criar novo produto
    if (!product) {
      console.log("📦 Criando novo produto...");
      product = await stripe.products.create({
        name: "Guia Fernando de Noronha Anual 2025",
        description: "Acesso de um ano ao guia de viagem exclusivo",
        metadata: {
          type: "guide_subscription",
          duration: "annual",
        },
      });
      console.log("✅ Produto criado:", product.id);
    } else {
      console.log("✅ Produto encontrado:", product.id);
    }

    // Buscar preços existentes do produto
    const prices = await stripe.prices.list({
      product: product.id,
      limit: 100,
    });

    // Verificar se já existe preço recorrente anual
    let yearlyPrice = prices.data.find(
      (p) => 
        p.recurring?.interval === "year" && 
        p.currency === "brl" && 
        p.unit_amount === 9900
    );

    // Se não encontrar, criar novo preço
    if (!yearlyPrice) {
      console.log("💰 Criando novo preço recorrente anual...");
      yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 9900, // R$99.00 em centavos
        currency: "brl",
        recurring: {
          interval: "year",
        },
        metadata: {
          type: "guide_subscription",
          access_level: "full",
        },
      });
      console.log("✅ Preço recorrente anual criado:", yearlyPrice.id);
    } else {
      console.log("✅ Preço recorrente anual encontrado:", yearlyPrice.id);
    }

    // Exibir resumo
    console.log("\n📋 Resumo da configuração:");
    console.log("- Product ID:", product.id);
    console.log("- Price ID:", yearlyPrice.id);
    console.log("- Valor: R$ 99,00/ano");
    console.log("- Moeda: BRL");
    console.log("\n💡 Salve estes IDs para usar na implementação!");

    return {
      productId: product.id,
      priceId: yearlyPrice.id,
    };
  } catch (error) {
    console.error("❌ Erro ao configurar assinatura:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupGuideSubscription()
    .then(() => {
      console.log("\n✨ Configuração concluída com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Erro na configuração:", error);
      process.exit(1);
    });
}

export { setupGuideSubscription }; 