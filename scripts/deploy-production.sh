#!/bin/bash

# Script de Deploy para Produção - Mercado Pago
# Executa todas as etapas necessárias para deploy em produção

echo "🚀 Deploy do Sistema de Pagamento Mercado Pago para Produção"
echo "============================================================="

# 1. Verificar se as variáveis de ambiente estão configuradas
echo "📋 Verificando variáveis de ambiente..."

if [ -z "$MERCADO_PAGO_ACCESS_TOKEN" ]; then
    echo "❌ ERRO: MERCADO_PAGO_ACCESS_TOKEN não configurada"
    echo "   Configure no arquivo .env.local ou nas variáveis de ambiente"
    exit 1
fi

if [ -z "$CONVEX_SITE_URL" ]; then
    echo "⚠️  AVISO: CONVEX_SITE_URL não configurada"
    echo "   Recomendado para URLs de webhook e redirects"
fi

if [ -z "$MERCADO_PAGO_WEBHOOK_SECRET" ]; then
    echo "⚠️  AVISO: MERCADO_PAGO_WEBHOOK_SECRET não configurada"
    echo "   Recomendado para segurança dos webhooks"
fi

echo "✅ Variáveis de ambiente verificadas"

# 2. Build do Next.js
echo ""
echo "🔨 Executando build do Next.js..."
bun run build

if [ $? -ne 0 ]; then
    echo "❌ ERRO: Build falhou"
    exit 1
fi

echo "✅ Build concluído com sucesso"

# 3. Deploy do Convex
echo ""
echo "☁️  Fazendo deploy do Convex..."
npx convex deploy --prod

if [ $? -ne 0 ]; then
    echo "❌ ERRO: Deploy do Convex falhou"
    exit 1
fi

echo "✅ Convex deployado com sucesso"

# 4. Verificações pós-deploy
echo ""
echo "🔍 Verificações pós-deploy:"
echo "  1. Configure webhook no Mercado Pago Dashboard:"
echo "     - URL: ${CONVEX_SITE_URL:-https://sua-url.com}/mercadopago/webhook"
echo "     - Eventos: payment.*"
echo "  2. Teste um booking completo"
echo "  3. Verifique logs no Convex dashboard"

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🎉 Sistema de pagamento Mercado Pago está em PRODUÇÃO!"
