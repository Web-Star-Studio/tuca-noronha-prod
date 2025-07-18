# Correção de Erro: Stripe Price ID Não Encontrado

## Problema

Ao tentar fazer uma reserva de um asset de um partner, o sistema estava retornando o erro:

```
StripeInvalidRequestError: No such price: 'price_1RlvkqGdWDi0SgxliA4DT43S'
```

## Causa

Este erro ocorre quando:

1. **Banco de dados de desenvolvimento com dados de produção**: O banco foi copiado de produção mas está usando as chaves do Stripe de teste
2. **Price IDs deletados**: Os price IDs foram deletados no Stripe mas as referências permanecem no banco
3. **Ambiente incorreto**: Usando Stripe em modo teste mas os IDs são de produção (ou vice-versa)

## Solução Implementada

### 1. Verificação e Fallback Automático

Modificamos a função `createCheckoutSession` para:

- Verificar se o price ID armazenado existe no Stripe antes de usá-lo
- Se o price ID for válido e o valor corresponder, usar o existente
- Se o price ID for inválido, criar um novo produto e preço dinamicamente

```typescript
// Verifica se o price ID existe
const existingPrice = await stripe.prices.retrieve(booking.asset.stripePriceId);
if (existingPrice && existingPrice.active) {
  // Usa o price ID existente
} else {
  // Cria novo produto e preço
}
```

### 2. Script de Limpeza

Criamos funções para validar e limpar price IDs inválidos:

#### Validar todos os assets:
```bash
bunx tsx scripts/stripeCleanup.ts
```

#### Limpar price IDs inválidos de um tipo específico:
```bash
bunx tsx scripts/stripeCleanup.ts --clean --type=activity
```

### 3. Re-sincronização com Stripe

Após limpar os IDs inválidos, execute o backfill para re-criar os produtos no Stripe:

```bash
# Para activities
bunx tsx scripts/stripeBackfill.ts --type=activity

# Para todos os tipos
bunx tsx scripts/stripeBackfill.ts
```

## Prevenção

Para evitar este problema no futuro:

1. **Ambientes separados**: Use bancos de dados separados para desenvolvimento e produção
2. **Chaves do Stripe corretas**: Verifique se está usando as chaves corretas no `.env.local`:
   ```env
   # Para desenvolvimento/teste
   STRIPE_SECRET_KEY=sk_test_...
   
   # Para produção
   STRIPE_SECRET_KEY=sk_live_...
   ```
3. **Validação periódica**: Execute o script de validação periodicamente para detectar IDs inválidos

## Logs de Debug

O sistema agora registra logs detalhados durante a criação de checkout sessions:

- `✅ Found valid existing price ID`: Price ID válido encontrado
- `⚠️ Existing price ID not found or inactive`: Price ID inválido, criando novo
- `🔄 Creating new product and price`: Criando novo produto/preço
- `✅ Created new price in Stripe`: Novo price criado com sucesso

## Referências

- [Stripe API - Prices](https://stripe.com/docs/api/prices)
- [Stripe Test vs Live Mode](https://stripe.com/docs/keys)
- [Convex Actions](https://docs.convex.dev/functions/actions) 