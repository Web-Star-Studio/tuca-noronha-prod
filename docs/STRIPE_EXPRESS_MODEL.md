# Modelo de Taxas do Stripe Express

## Visão Geral

Este documento explica como funciona o modelo de taxas e pagamentos com Stripe Express accounts no nosso sistema.

## Tipo de Conta: Express

Utilizamos **Stripe Express accounts** para nossos parceiros, que oferece:

- Dashboard simplificado para parceiros
- Onboarding gerenciado pelo Stripe
- Requisitos de compliance coletados automaticamente
- Menor responsabilidade legal para a plataforma

## Modelo de Cobrança: Destination Charges

Com Destination Charges:
1. **Cliente paga à plataforma** que depois transfere fundos ao parceiro
2. **Plataforma coleta taxa de aplicação** (application fee) automaticamente
3. **Plataforma é responsável** por reembolsos e chargebacks
4. **Stripe deduz suas taxas** do valor da plataforma

### Fluxo de Pagamento

```
Cliente paga R$ 100,00 → Plataforma
├── Taxa do Stripe (~2.9% + R$ 0,29): ~R$ 3,19 (deduzida da plataforma)
├── Taxa da plataforma (10%): R$ 10,00 → Fica com a plataforma
└── Transferência ao parceiro: R$ 90,00
    └── Parceiro recebe: R$ 90,00 (sem dedução adicional)
```

## Configurações Importantes

### 1. Quem Paga as Taxas do Stripe

Em contas Express com Destination Charges:
- **Plataforma paga as taxas do Stripe** (deduzidas do valor total)
- **Plataforma recebe a application fee** e pode cobrir os custos
- **Parceiro recebe o valor transferido** sem deduções adicionais

### 2. Capacidades Habilitadas

```javascript
capabilities: {
  card_payments: { requested: true },  // Aceitar pagamentos com cartão
  transfers: { requested: true },       // Receber transferências
}
```

### 3. Taxa de Aplicação (Application Fee)

- Configurável por parceiro (padrão definido no sistema)
- Calculada como percentual do valor total
- Transferida automaticamente para a plataforma

## Implementação no Código

### Criar PaymentIntent com Destination Charge

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // R$ 100,00
  currency: 'brl',
  application_fee_amount: 1000, // R$ 10,00 (10%)
  transfer_data: {
    destination: partnerStripeAccountId,
  },
  // NÃO incluir on_behalf_of para destination charges
});
// NÃO incluir stripeAccount no segundo parâmetro - charge na conta da plataforma
```

### Cálculo de Taxas

```javascript
// Em convex/domains/partners/actions.ts
const feePercentage = partner.feePercentage; // Ex: 10%
const applicationFeeAmount = Math.floor(totalAmount * (feePercentage / 100));
const partnerAmount = totalAmount - applicationFeeAmount;
```

## Webhooks Importantes

1. **account.updated**: Monitora status do onboarding
2. **payment_intent.succeeded**: Confirma pagamentos
3. **application_fee.created**: Registra taxas cobradas

## Limitações do Modelo Express

1. **Sem controle sobre taxas do Stripe**: Parceiro sempre paga
2. **Dashboard limitado**: Apenas funcionalidades essenciais
3. **Sem customização avançada**: Fluxos pré-definidos pelo Stripe

## Vantagens para a Plataforma

1. **Menor responsabilidade legal**: Stripe gerencia compliance
2. **Onboarding simplificado**: Processo automatizado
3. **Menor manutenção**: Stripe cuida das atualizações
4. **Application fee garantida**: Recebida sem deduções 