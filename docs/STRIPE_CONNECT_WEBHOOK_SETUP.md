# Configuração do Webhook do Stripe Connect

## Problema Identificado
O status do onboarding do Stripe Connect não está sendo atualizado automaticamente após o parceiro completar o processo porque o webhook não estava processando os eventos do Connect.

## Solução Implementada

### 1. Adicionado Handlers para Eventos do Connect
Adicionamos suporte para os seguintes eventos no webhook handler (`src/api/stripe-webhook/route.ts`):

- **`account.updated`**: Dispara quando qualquer informação da conta conectada é atualizada
- **`account.external_account.created`**: Dispara quando uma conta bancária é adicionada

### 2. Lógica de Atualização do Status

```typescript
// Determina o status baseado no estado da conta
if (account.charges_enabled && account.payouts_enabled) {
  onboardingStatus = 'completed';
} else if (account.details_submitted) {
  onboardingStatus = 'in_progress';
} else if (account.requirements?.disabled_reason) {
  onboardingStatus = 'rejected';
}
```

## Configuração do Webhook no Stripe Dashboard

### Passo 1: Acessar Webhooks
1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Clique em "Add endpoint"

### Passo 2: Configurar URL do Endpoint
- **Endpoint URL**: `https://seu-dominio.com/api/stripe-webhook`
- Para desenvolvimento local, use [ngrok](https://ngrok.com/) ou similar:
  ```bash
  ngrok http 3000
  # Use a URL do ngrok: https://xxx.ngrok.io/api/stripe-webhook
  ```

### Passo 3: Selecionar Eventos
Marque os seguintes eventos:

#### Eventos de Pagamento (já configurados):
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

#### Eventos do Connect (NOVOS - IMPORTANTES):
- ✅ `account.updated` - **ESSENCIAL para atualizar status do onboarding**
- ✅ `account.external_account.created`
- ✅ `account.application.authorized` (opcional)
- ✅ `account.application.deauthorized` (opcional)

#### Eventos de Assinatura:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Passo 4: Obter Webhook Secret
1. Após criar o endpoint, copie o "Signing secret"
2. Adicione ao seu `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Testando o Webhook

### 1. Usando Stripe CLI (Recomendado)
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Encaminhar eventos para localhost
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Em outro terminal, trigger evento de teste
stripe trigger account.updated
```

### 2. Testando o Fluxo Completo
1. Crie uma conta de parceiro em `/admin/dashboard/pagamentos`
2. Complete o onboarding no Stripe
3. Verifique os logs do webhook
4. O status deve atualizar automaticamente para "completed"

## Debugging

### Verificar Logs do Webhook
```bash
# Ver logs em tempo real
stripe logs tail
```

### Verificar no Dashboard
1. Vá para [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Clique no seu endpoint
3. Veja "Recent deliveries" para verificar se os eventos estão chegando

### Logs no Console
O webhook handler registra todas as ações:
- `🔄 Stripe Connect account updated: acct_xxx`
- `✅ Partner onboarding status updated to: completed`

## Troubleshooting

### Status não atualiza após onboarding
1. Verifique se o evento `account.updated` está selecionado no webhook
2. Confirme que o `STRIPE_WEBHOOK_SECRET` está correto
3. Verifique os logs para erros

### Erro "No signatures found matching the expected signature"
- O `STRIPE_WEBHOOK_SECRET` está incorreto
- Certifique-se de usar o secret do ambiente correto (test/live)

### Partner não aparece após criar conta
1. Verifique se a mutation `createPartner` foi executada
2. Confirme que o `userId` está correto
3. Verifique no Convex Dashboard se o documento foi criado

## Próximos Passos

1. **Produção**: Configure o webhook com a URL de produção
2. **Monitoramento**: Configure alertas para falhas de webhook
3. **Retry Logic**: O Stripe automaticamente tenta novamente em caso de falha
4. **Segurança**: Sempre valide a assinatura do webhook 