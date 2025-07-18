# Migração de Direct Charges para Destination Charges

## Resumo da Mudança

Este documento descreve a migração do sistema de pagamentos de **Direct Charges** para **Destination Charges** no Stripe Connect, mantendo o fluxo de pagamento atual inalterado.

## Principais Diferenças

### Direct Charges (Anterior)
- Cliente pagava diretamente ao parceiro
- Usava `on_behalf_of` e `transfer_data.destination`
- Parceiro era responsável por reembolsos e chargebacks
- Taxas do Stripe eram deduzidas do parceiro

### Destination Charges (Atual)
- Cliente paga à plataforma
- Usa apenas `transfer_data.destination` (sem `on_behalf_of`)
- Plataforma é responsável por reembolsos e chargebacks
- Taxas do Stripe são deduzidas da plataforma

## Mudanças Implementadas

### 1. Remoção do `on_behalf_of`
A principal mudança técnica foi remover o parâmetro `on_behalf_of` das configurações de PaymentIntent:

```typescript
// Antes (Direct Charges)
sessionParams.payment_intent_data.application_fee_amount = applicationFeeAmount;
sessionParams.payment_intent_data.on_behalf_of = stripeAccountId;
sessionParams.payment_intent_data.transfer_data = {
  destination: stripeAccountId,
};

// Depois (Destination Charges)
sessionParams.payment_intent_data.application_fee_amount = applicationFeeAmount;
// Removido on_behalf_of - plataforma é agora merchant of record
sessionParams.payment_intent_data.transfer_data = {
  destination: stripeAccountId,
};
```

### 2. Fluxo de Pagamento Atualizado

#### Fluxo Anterior (Direct Charges)
```
Cliente → Paga R$ 100 → Conta do Parceiro
├── Taxa Stripe (3,19%) → Deduzida do parceiro
├── Taxa plataforma (10%) → Transferida para plataforma
└── Parceiro recebe líquido: ~R$ 87
```

#### Fluxo Atual (Destination Charges)
```
Cliente → Paga R$ 100 → Conta da Plataforma
├── Taxa Stripe (3,19%) → Deduzida da plataforma
├── Taxa plataforma (10%) → Fica com a plataforma
└── Transferência ao parceiro: R$ 90 (sem deduções)
```

### 3. Responsabilidades

Com Destination Charges:
- **Plataforma** é responsável por:
  - Reembolsos
  - Chargebacks
  - Taxas do Stripe
  - Gerenciar disputas

- **Parceiro** recebe:
  - Valor líquido sem deduções adicionais
  - Transferências automáticas após confirmação

## Arquivos Modificados

1. **`convex/domains/stripe/actions.ts`**
   - Removido `on_behalf_of` de `createCheckoutSession`
   - Atualizado comentários e logs
   - Mantida lógica de `transfer_data`

2. **`docs/STRIPE_EXPRESS_MODEL.md`**
   - Atualizada documentação do modelo
   - Novo fluxo de pagamento
   - Exemplos de código atualizados

3. **`src/api/stripe-webhook/route.ts`**
   - Atualizado comentários sobre Destination Charges

4. **`convex/domains/partners/actions.ts`**
   - Atualizado comentários para Destination Charges

5. **Páginas de teste**
   - Atualizadas referências de UI

## Benefícios da Mudança

1. **Maior controle da plataforma** sobre o fluxo financeiro
2. **Simplificação de reembolsos** - plataforma gerencia tudo
3. **Melhor visibilidade** de todas as transações
4. **Redução de complexidade** para parceiros

## Considerações Importantes

1. **Não há mudança no fluxo do usuário** - a experiência permanece a mesma
2. **Partners continuam recebendo** seus valores normalmente
3. **Application fees** continuam funcionando da mesma forma
4. **Webhooks** continuam processando eventos normalmente

## Próximos Passos

1. **Testar** em ambiente de desenvolvimento
2. **Validar** webhooks e callbacks
3. **Monitorar** primeiras transações em produção
4. **Ajustar** taxas se necessário para cobrir custos do Stripe 