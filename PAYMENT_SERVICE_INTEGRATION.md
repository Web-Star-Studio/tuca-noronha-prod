# 💳 Payment Service - Integração Completa

## ✅ Status da Integração

**SISTEMA TOTALMENTE INTEGRADO E FUNCIONANDO!**

### Componentes Implementados:

1. **Payment Service (Express + TypeScript)**
   - ✅ SDK oficial do Mercado Pago
   - ✅ API RESTful com autenticação
   - ✅ Webhooks com assinatura verificada
   - ✅ Captura manual de pagamentos
   - ✅ Docker ready

2. **Integração Next.js**
   - ✅ Client SDK implementado
   - ✅ Hooks React para pagamentos
   - ✅ Variáveis de ambiente configuradas

3. **Integração Convex**
   - ✅ Actions para comunicação com Payment Service
   - ✅ Webhook handlers configurados
   - ✅ Sincronização de status de pagamento

## 🚀 Como Usar

### Desenvolvimento Local

1. **Iniciar todos os serviços:**
```bash
./start-all.sh
```

Ou manualmente:
```bash
# Terminal 1 - Payment Service
cd payment-service && npm run dev

# Terminal 2 - Convex
npx convex dev

# Terminal 3 - Next.js
npm run dev
```

2. **URLs de Desenvolvimento:**
- Frontend: http://localhost:3000
- Payment Service: http://localhost:3001
- Health Check: http://localhost:3001/health

### Teste de Integração

```bash
node payment-service/test-full-integration.js
```

## 🌐 Deploy em Produção

### Opção 1: Railway (Recomendado)

```bash
cd payment-service
./deploy-railway.sh
```

### Opção 2: Docker

```bash
cd payment-service
docker-compose up -d
```

### Opção 3: VPS com PM2

```bash
npm run build
pm2 start dist/index.js --name payment-service
pm2 save
```

## 🔧 Configuração de Produção

### 1. Variáveis de Ambiente

**Payment Service (.env):**
```env
NODE_ENV=production
PORT=3001
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
MERCADO_PAGO_WEBHOOK_SECRET=xxx
API_KEY=your-secure-api-key
CONVEX_URL=https://wonderful-salmon-48.convex.cloud
FRONTEND_URL=https://tucanoronha.com.br
```

**Next.js (.env.local):**
```env
PAYMENT_SERVICE_API_KEY=your-secure-api-key
NEXT_PUBLIC_PAYMENT_SERVICE_URL=https://payments.tucanoronha.com.br
```

**Convex:**
```bash
npx convex env set PAYMENT_SERVICE_URL https://payments.tucanoronha.com.br --prod
npx convex env set PAYMENT_SERVICE_API_KEY your-secure-api-key --prod
```

### 2. Webhook Mercado Pago

Configure no painel do Mercado Pago:
- URL: `https://payments.tucanoronha.com.br/webhooks/mercadopago`
- Eventos: `payment`, `plan`, `invoice`

### 3. DNS

Adicione no seu provedor DNS:
```
Type: A (ou CNAME)
Name: payments
Value: <IP ou URL do serviço>
```

## 📚 API Endpoints

### Criar Preferência
```
POST /api/payments/preference
x-api-key: your-api-key

{
  "bookingId": "123",
  "assetType": "activity",
  "items": [{
    "title": "Tour",
    "quantity": 1,
    "unitPrice": 100
  }],
  "backUrls": {
    "success": "https://site.com/success",
    "pending": "https://site.com/pending",
    "failure": "https://site.com/cancel"
  }
}
```

### Capturar Pagamento
```
POST /api/payments/payment/:paymentId/capture
x-api-key: your-api-key
```

### Cancelar Pagamento
```
POST /api/payments/payment/:paymentId/cancel
x-api-key: your-api-key
```

### Status do Pagamento
```
GET /api/payments/payment/:paymentId
x-api-key: your-api-key
```

## 🧪 Cartões de Teste

| Cartão | Número | CVV | Validade |
|--------|--------|-----|----------|
| Visa (Aprovado) | 4509 9535 6623 3704 | 123 | 11/25 |
| Mastercard (Aprovado) | 5031 7557 3453 0604 | 123 | 11/25 |
| Visa (Recusado) | 4000 0000 0000 0002 | 123 | 11/25 |

## 📈 Fluxo de Pagamento

```
1. Cliente faz reserva
   ↓
2. Payment Service cria preferência
   ↓
3. Cliente é redirecionado para Mercado Pago
   ↓
4. Pagamento autorizado (não capturado)
   ↓
5. Webhook notifica Payment Service
   ↓
6. Admin confirma reserva
   ↓
7. Payment Service captura pagamento
   ↓
8. Voucher gerado e enviado
```

## 🔍 Monitoramento

- Logs: `payment-service/logs/`
- Health Check: `/health`
- Ready Check: `/health/ready`
- Webhook Test: `/webhooks/test`

## 🆘 Troubleshooting

### Erro: "Payment Service not running"
```bash
cd payment-service && npm run dev
```

### Erro: "Invalid API key"
Verifique se `PAYMENT_SERVICE_API_KEY` está configurado em ambos os lados.

### Erro: "Webhook signature mismatch"
Verifique se `MERCADO_PAGO_WEBHOOK_SECRET` está correto.

## 📞 Suporte

- Documentação: `/payment-service/README.md`
- Deploy Guide: `/payment-service/DEPLOY.md`
- Logs: `payment-service/logs/`

---

**Sistema de Pagamentos v1.0.0** - Tuca Noronha 2024
