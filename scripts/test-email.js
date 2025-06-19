#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require("convex/browser");

// Verificar se a URL do Convex está configurada
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.log("❌ NEXT_PUBLIC_CONVEX_URL não configurada");
  console.log("💡 Configure a variável no arquivo .env.local");
  process.exit(1);
}

// Configurar cliente Convex
const client = new ConvexHttpClient(convexUrl);

async function testEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log("❌ Por favor, forneça um email para teste:");
    console.log("   node scripts/test-email.js seu-email@exemplo.com");
    process.exit(1);
  }

  console.log("🧪 Testando sistema de emails...");
  console.log(`📧 Enviando para: ${testEmail}`);
  
  try {
    const result = await client.action("domains/email/actions:testEmailService", {
      testEmail: testEmail
    });
    
    if (result.success) {
      console.log("✅ " + result.message);
      console.log("📱 Verifique sua caixa de entrada (pode levar alguns minutos)");
      console.log("📁 Verifique também a pasta de spam");
    } else {
      console.log("❌ " + result.message);
    }
  } catch (error) {
    console.error("💥 Erro no teste:", error.message);
  }
}

testEmail(); 