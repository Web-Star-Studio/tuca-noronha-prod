# Atualização da Versão da API do Stripe

## Data: 17 de Julho de 2025

### Versão Anterior
- **API Version**: `2024-06-20`

### Nova Versão
- **API Version**: `2025-06-30.basil`

## Arquivos Atualizados

Todos os arquivos que inicializam o cliente Stripe foram atualizados:

1. **Scripts**
   - `/scripts/setupGuideSubscription.ts`

2. **Convex Actions**
   - `/convex/domains/adminReservations/actions.ts`
   - `/convex/domains/partners/actions.ts`
   - `/convex/domains/stripe/actions.ts`
   - `/convex/domains/subscriptions/actions.ts`
   - `/convex/domains/coupons/actions.ts`

3. **Biblioteca e API Routes**
   - `/src/lib/stripe.ts`
   - `/src/api/stripe-webhook/route.ts`

## Formato Utilizado

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil" as any,
});
```

### Nota sobre TypeScript
Mantivemos o uso de `as any` para evitar conflitos com os tipos do TypeScript, já que a biblioteca @types/stripe pode não estar totalmente sincronizada com as versões mais recentes da API.

## Benefícios da Nova Versão

A versão `2025-06-30.basil` é a mais recente da API do Stripe e inclui:
- Melhorias de performance
- Novos recursos e endpoints
- Correções de bugs
- Melhor suporte para Stripe Connect

## Verificação

- ✅ Build passou com sucesso
- ✅ Nenhum erro de TypeScript
- ✅ Todas as referências foram atualizadas

## Próximos Passos

1. Testar todas as funcionalidades do Stripe em ambiente de desenvolvimento
2. Verificar se os webhooks continuam funcionando corretamente
3. Monitorar logs para qualquer comportamento inesperado 