# 🚀 Guia de Deploy para Produção - Payment Service

## ✅ Checklist Pré-Deploy

### O que já está pronto:
- ✅ **Next.js (Frontend)**: Deployado em produção
- ✅ **Convex**: Em ambiente de produção (`wonderful-salmon-48.convex.cloud`)
- ⏳ **Payment Service**: Pronto para deploy

## 📋 PASSO A PASSO COMPLETO

### **PASSO 1: Deploy do Payment Service no Railway** (Mais Fácil)

#### 1.1 Instalar Railway CLI:
```bash
npm install -g @railway/cli
```

#### 1.2 Login no Railway:
```bash
railway login
```

#### 1.3 Criar projeto no Railway:
```bash
cd payment-service
railway init
# Escolha: "Empty Project"
# Dê um nome: "tuca-payment-service"
```

#### 1.4 Configurar variáveis de ambiente no Railway:
```bash
# Configurar todas as variáveis de uma vez
railway variables set \
  NODE_ENV=production \
  PORT=3001 \
  MERCADO_PAGO_ACCESS_TOKEN=APP_USR-4502131590791687-091910-8b2ae9f979b05fd51b5dd3f64dee711d-2702432900 \
  MERCADO_PAGO_PUBLIC_KEY=APP_USR-c6615316-135e-4bae-a601-09ea74695458 \
  MERCADO_PAGO_WEBHOOK_SECRET=651dca06e476bbb3bdaa96f00b6db41f1d5b890c86e68f92ca1b37ebabd03ece \
  API_KEY=prod-tuca-payment-key-2024-secure \
  CONVEX_URL=https://wonderful-salmon-48.convex.cloud \
  CONVEX_WEBHOOK_SECRET=convex-webhook-secret-2024 \
  FRONTEND_URL=https://www.tucanoronha.com.br \
  LOG_LEVEL=info
```

#### 1.5 Deploy:
```bash
railway up
```

#### 1.6 Obter URL do serviço:
```bash
railway domain
# Vai retornar algo como: https://tuca-payment-service.up.railway.app
```

### **PASSO 2: Configurar Domínio Customizado (Opcional mas Recomendado)**

#### 2.1 No Railway Dashboard:
1. Vá em Settings → Domains
2. Clique em "Add Custom Domain"
3. Digite: `payments.tucanoronha.com.br`

#### 2.2 No seu DNS (Cloudflare/Route53):
```
Type: CNAME
Name: payments
Value: tuca-payment-service.up.railway.app
Proxy: Enabled (se usar Cloudflare)
```

### **PASSO 3: Atualizar Variáveis no Convex (Produção)**

```bash
# Configurar URL do Payment Service no Convex
npx convex env set PAYMENT_SERVICE_URL https://payments.tucanoronha.com.br --prod
npx convex env set PAYMENT_SERVICE_API_KEY prod-tuca-payment-key-2024-secure --prod

# Deploy das mudanças
CONVEX_DEPLOYMENT=prod:wonderful-salmon-48 npx convex deploy
```

### **PASSO 4: Atualizar Variáveis no Next.js/Vercel**

No painel da Vercel ou via CLI:

```bash
vercel env add PAYMENT_SERVICE_API_KEY production
# Digite: prod-tuca-payment-key-2024-secure

vercel env add NEXT_PUBLIC_PAYMENT_SERVICE_URL production
# Digite: https://payments.tucanoronha.com.br
```

Ou no Painel Vercel:
1. Settings → Environment Variables
2. Adicione:
   - `PAYMENT_SERVICE_API_KEY`: `prod-tuca-payment-key-2024-secure`
   - `NEXT_PUBLIC_PAYMENT_SERVICE_URL`: `https://payments.tucanoronha.com.br`

### **PASSO 5: Configurar Webhook no Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações" → Selecione sua aplicação
3. Em "Webhooks" → "Configurar notificações"
4. Configure:
   - **URL de produção**: `https://payments.tucanoronha.com.br/webhooks/mercadopago`
   - **Eventos**: 
     - ✅ Pagamentos
     - ✅ Planos (se usar assinaturas)
   - **Assinatura**: Copie o secret e atualize no Railway se diferente

### **PASSO 6: Redeploy Next.js com Novas Variáveis**

```bash
vercel --prod
```

Ou trigger redeploy no painel Vercel.

## 🔧 Configuração Final de Integração

### **Arquivo de configuração para produção:**

Crie um arquivo `.env.production` no Payment Service (para referência):

```env
# Payment Service - Production
NODE_ENV=production
PORT=3001

# Mercado Pago (TESTE por enquanto)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-4502131590791687-091910-8b2ae9f979b05fd51b5dd3f64dee711d-2702432900
MERCADO_PAGO_PUBLIC_KEY=APP_USR-c6615316-135e-4bae-a601-09ea74695458
MERCADO_PAGO_WEBHOOK_SECRET=651dca06e476bbb3bdaa96f00b6db41f1d5b890c86e68f92ca1b37ebabd03ece

# Security
API_KEY=prod-tuca-payment-key-2024-secure

# Services
CONVEX_URL=https://wonderful-salmon-48.convex.cloud
CONVEX_WEBHOOK_SECRET=convex-webhook-secret-2024
FRONTEND_URL=https://www.tucanoronha.com.br

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=<se-tiver>
```

## 🧪 Teste de Integração Produção

### **Script de teste para produção:**

```bash
#!/bin/bash

PROD_PAYMENT_URL="https://payments.tucanoronha.com.br"
PROD_API_KEY="prod-tuca-payment-key-2024-secure"

echo "🧪 Testando Payment Service em Produção..."

# 1. Health Check
echo "1. Health Check..."
curl -s $PROD_PAYMENT_URL/health | jq .

# 2. Criar preferência de teste
echo "2. Criando preferência de teste..."
curl -X POST $PROD_PAYMENT_URL/api/payments/preference \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PROD_API_KEY" \
  -d '{
    "bookingId": "prod-test-'$(date +%s)'",
    "assetType": "activity",
    "items": [{
      "title": "Teste Produção",
      "quantity": 1,
      "unitPrice": 1.00
    }],
    "payer": {
      "name": "Teste Produção",
      "email": "teste@tucanoronha.com.br"
    },
    "backUrls": {
      "success": "https://www.tucanoronha.com.br/booking/success",
      "pending": "https://www.tucanoronha.com.br/booking/pending",
      "failure": "https://www.tucanoronha.com.br/booking/cancel"
    }
  }' | jq .

echo "✅ Testes concluídos!"
```

## 📊 Monitoramento em Produção

### **1. Railway Dashboard:**
- Métricas em tempo real
- Logs
- Uso de recursos
- URL: https://railway.app/project/[seu-projeto]

### **2. Logs do Payment Service:**
```bash
railway logs --tail
```

### **3. Health Checks:**
- Health: https://payments.tucanoronha.com.br/health
- Ready: https://payments.tucanoronha.com.br/health/ready

### **4. Sentry (Opcional):**
Se configurar Sentry, adicione no Railway:
```bash
railway variables set SENTRY_DSN=<seu-dsn-sentry>
```

## 🔄 Fluxo Completo Integrado

```
1. Cliente acessa: www.tucanoronha.com.br
   ↓
2. Next.js (Vercel) autentica via Clerk
   ↓
3. Cria reserva no Convex (wonderful-salmon-48)
   ↓
4. Payment Service (Railway) cria preferência MP
   ↓
5. Cliente paga no Mercado Pago
   ↓
6. Webhook → Payment Service → Convex
   ↓
7. Admin confirma → Captura pagamento
   ↓
8. Voucher gerado e enviado
```

## ⚠️ Checklist Final

- [ ] Payment Service deployado no Railway
- [ ] URL obtida e funcionando
- [ ] Domínio customizado configurado (opcional)
- [ ] Variáveis de ambiente no Convex atualizadas
- [ ] Variáveis de ambiente no Vercel atualizadas
- [ ] Webhook do Mercado Pago configurado
- [ ] Next.js redeployado
- [ ] Teste de ponta a ponta realizado

## 🚨 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se a API_KEY é a mesma em todos os lugares
- Railway: `railway variables`
- Convex: `npx convex env list --prod`
- Vercel: Painel → Settings → Environment Variables

### Erro: "Payment Service Unavailable"
- Verifique se o serviço está rodando: `railway logs`
- Teste health: `curl https://payments.tucanoronha.com.br/health`

### Erro: "Webhook not working"
- Verifique o secret no MP e no Railway
- Teste manual: `curl https://payments.tucanoronha.com.br/webhooks/test`

## 🎉 Pronto!

Após seguir todos esses passos, seu sistema estará:
- ✅ 100% em produção
- ✅ Totalmente integrado
- ✅ Pronto para processar pagamentos reais (quando migrar credenciais)
- ✅ Monitorado e com logs

---

**Precisa de ajuda?** Execute os comandos na ordem e me avise se encontrar algum erro!
