# Sistema de Partners com Stripe Connect

## Configuração Inicial

### 1. Configurar Stripe Connect no Dashboard

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá para **Settings > Connect settings**
3. Configure:
   - **Platform name**: Travel Noronha Next
   - **Platform website**: Seu domínio
   - **Business details**: Informações da empresa
   - **Branding**: Logo e cores da plataforma

### 2. Configurar Webhooks

#### Webhook Principal (Eventos da Plataforma)
- **Endpoint URL**: `https://seu-dominio.com/stripe/webhook`
- **Eventos**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

#### Webhook Connect (Eventos das Contas Conectadas)
- **Endpoint URL**: `https://seu-dominio.com/stripe/connect-webhook`
- **Eventos**:
  - `account.updated`
  - `account.application.deauthorized`
  - `application_fee.created`
  - `transfer.created`
  - `transfer.updated`
  - `payout.paid`
  - `payout.failed`

### 3. Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...

# Configuração da aplicação
NEXT_PUBLIC_URL=https://seu-dominio.com
```

## Fluxo de Onboarding

### 1. Criar Conta Conectada

```typescript
// Frontend
const { stripeAccountId, onboardingUrl } = await createStripeConnectedAccount({
  userId: user.id,
  email: user.email,
  country: "BR",
  businessType: "individual", // ou "company"
  businessName: "Nome da Empresa", // se company
});

// Redirecionar para onboarding
window.location.href = onboardingUrl;
```

### 2. Status do Onboarding

O sistema rastreia automaticamente o status:
- `pending`: Conta criada, onboarding não iniciado
- `in_progress`: Informações submetidas, aguardando verificação
- `completed`: Verificado e pronto para receber pagamentos
- `rejected`: Conta rejeitada ou desconectada

### 3. Configurar Taxa do Partner

Apenas administradores podem configurar taxas:

```typescript
await updatePartnerFee({
  partnerId: "partner_id",
  feePercentage: 15, // 15% de taxa
  reason: "Ajuste de taxa padrão",
});
```

## Processamento de Pagamentos

### Direct Charges com Application Fee

Quando um pagamento é processado:

1. Cliente paga R$ 100,00
2. Stripe cria Direct Charge na conta do partner
3. Application fee de 15% (R$ 15,00) é transferida para a plataforma
4. Partner recebe R$ 85,00 - taxas do Stripe
5. Plataforma recebe R$ 15,00

### Cálculo de Taxas

```typescript
// Exemplo de cálculo
const totalAmount = 10000; // R$ 100,00 em centavos
const feePercentage = 15; // 15% para a plataforma

const platformFee = Math.floor(totalAmount * 0.15); // R$ 15,00
const stripeFee = Math.floor(totalAmount * 0.029) + 29; // ~R$ 3,19
const partnerReceives = totalAmount - platformFee - stripeFee; // ~R$ 81,81
```

## Estrutura de Dados

### Partners
- Informações da conta conectada
- Status de onboarding
- Taxa configurada
- Capabilities ativas

### Partner Fees
- Histórico de alterações de taxa
- Data efetiva
- Usuário que alterou
- Motivo da alteração

### Partner Transactions
- Registro de todas as transações
- Valores e taxas aplicadas
- Status da transação
- Metadados do Stripe

## Segurança

### Validações
- Apenas admin master pode alterar taxas
- Partners só visualizam suas próprias transações
- Webhooks são verificados com assinatura

### Compliance
- KYC/AML via Stripe
- Documentação fiscal automática
- Conformidade PCI DSS

## Monitoramento

### Logs Importantes
- Criação de contas conectadas
- Alterações de taxa
- Processamento de pagamentos
- Erros de webhook

### Métricas
- Taxa de conclusão de onboarding
- Volume de transações por partner
- Receita de application fees

## Troubleshooting

### Onboarding não completa
1. Verificar logs de webhook `account.updated`
2. Checar requirements no Stripe Dashboard
3. Verificar se capabilities estão ativas

### Pagamento não divide corretamente
1. Verificar se partner está ativo
2. Confirmar taxa configurada
3. Checar logs de `application_fee.created`

### Webhook não processa
1. Verificar assinatura do webhook
2. Checar se evento está configurado no Dashboard
3. Verificar logs do Convex 