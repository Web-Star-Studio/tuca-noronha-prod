# 🚀 Stripe Backfill - Guia Completo

Este documento explica como usar o script de backfill para criar produtos e payment links do Stripe para atividades existentes no sistema.

## 📋 Pré-requisitos

### 1. Variáveis de Ambiente
Certifique-se que estas variáveis estão configuradas:

```env
STRIPE_SECRET_KEY=sk_test_...  # Chave secreta do Stripe
NEXT_PUBLIC_APP_URL=http://localhost:3000  # URL da aplicação
```

### 2. Conta do Stripe
- Conta do Stripe configurada
- Webhooks configurados (se necessário)
- Permissões para criar produtos e payment links

## 🛠️ Métodos de Execução

### Método 1: Interface Web (Recomendado)

1. Acesse: `http://localhost:3000/admin/stripe-backfill`
2. Clique em "Atualizar Status" para ver a situação atual
3. Configure os parâmetros:
   - **Modo de teste**: Sempre ative primeiro para simular
   - **Limite**: Comece com 10-20 atividades
   - **ID do Parceiro**: Opcional, para processar apenas um parceiro
4. Execute o backfill

### Método 2: Dashboard do Convex

1. Acesse: https://dashboard.convex.dev
2. Vá para seu projeto
3. Clique em "Functions"
4. Procure por: `scripts/stripeBackfill:runStripeBackfill`
5. Execute com parâmetros JSON:

```json
{
  "dryRun": true,
  "limit": 10
}
```

### Método 3: CLI

```bash
# Teste (dry run)
npx convex run scripts/stripeBackfill:runStripeBackfill '{"dryRun": true, "limit": 5}'

# Execução real
npx convex run scripts/stripeBackfill:runStripeBackfill '{"dryRun": false, "limit": 10}'
```

### Método 4: Código React

```typescript
import { useAction } from 'convex/react';
import { api } from './convex/_generated/api';

const MyComponent = () => {
  const runBackfill = useAction(api.scripts.stripeBackfill.runStripeBackfill);
  const getSummary = useAction(api.scripts.stripeBackfill.getIntegrationSummary);

  const handleBackfill = async () => {
    // 1. Ver status atual
    const summary = await getSummary();
    console.log('Status:', summary);

    // 2. Executar backfill
    const result = await runBackfill({
      dryRun: true,
      limit: 10
    });
    console.log('Resultado:', result);
  };

  return <button onClick={handleBackfill}>Executar Backfill</button>;
};
```

## 📊 Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `dryRun` | boolean | `false` | Se `true`, apenas simula sem executar |
| `limit` | number | `100` | Máximo de atividades a processar |
| `partnerId` | string | - | ID do parceiro específico (opcional) |

## 🔄 Processo do Backfill

Para cada atividade sem Stripe, o script:

1. **Cria produto no Stripe** com:
   - Nome da atividade
   - Descrição
   - Preço em centavos
   - Metadata (ID da atividade, tipo, parceiro)

2. **Cria payment link** com:
   - URL de sucesso configurada
   - URL de cancelamento
   - Metadata para rastreamento

3. **Atualiza a atividade** no Convex com:
   - `stripeProductId`
   - `stripePriceId`
   - `stripePaymentLinkId`
   - `acceptsOnlinePayment: true`

## 📈 Interpretando Resultados

### Exemplo de Resultado
```json
{
  "total": 25,        // Atividades encontradas
  "processed": 25,    // Atividades processadas
  "succeeded": 23,    // Sucessos
  "failed": 2,        // Falhas
  "errors": [         // Detalhes dos erros
    {
      "activityId": "abc123",
      "activityTitle": "Passeio de Barco",
      "error": "Stripe product creation failed"
    }
  ]
}
```

### Status da Integração
```json
{
  "totalActivities": 100,        // Total de atividades
  "withStripeProducts": 75,      // Com produtos Stripe
  "withoutStripeProducts": 25,   // Sem produtos Stripe
  "withPaymentLinks": 75,        // Com payment links
  "withoutPaymentLinks": 25,     // Sem payment links
  "activeActivities": 95,        // Atividades ativas
  "inactiveActivities": 5        // Atividades inativas
}
```

## ⚠️ Segurança e Boas Práticas

### 1. Sempre teste primeiro
```bash
# ✅ Correto - sempre comece com dry run
{"dryRun": true, "limit": 5}

# ❌ Evite - executar direto em produção
{"dryRun": false, "limit": 100}
```

### 2. Use limites baixos
```bash
# ✅ Correto - processar em lotes pequenos
{"limit": 10}

# ❌ Evite - muitas atividades de uma vez
{"limit": 500}
```

### 3. Monitore logs
```bash
# Acompanhe no console do Convex:
🚀 Starting activities Stripe backfill...
📊 Found 15 activities to process
🔄 Processing activity: Passeio de Barco (ID: abc123)
   ✅ Created Stripe product: prod_123
   ✅ Created payment link: plink_456
   ✅ Updated activity with Stripe info
🎉 Backfill completed!
   📊 Total: 15
   ✅ Succeeded: 15
   ❌ Failed: 0
```

## 🐛 Troubleshooting

### Erro: "Stripe product creation failed"
**Causa**: Problema na API do Stripe
**Solução**: 
- Verifique `STRIPE_SECRET_KEY`
- Confirme que a conta Stripe está ativa
- Verifique rate limits

### Erro: "Activity not found"
**Causa**: ID da atividade inválido
**Solução**: 
- Verifique se a atividade existe
- Confirme que está ativa

### Erro: "Failed to create payment link"
**Causa**: Produto criado mas payment link falhou
**Solução**: 
- Re-execute o script (não duplicará produtos)
- Verifique configurações do Stripe

### Muitas falhas
**Solução**: 
1. Execute com `limit: 1` para testar
2. Verifique logs detalhados
3. Confirme variáveis de ambiente

## 🔧 Funcionalidades Avançadas

### Processar apenas um parceiro
```json
{
  "dryRun": false,
  "limit": 50,
  "partnerId": "jd7xyz123abc..."
}
```

### Backfill de uma atividade específica
```typescript
const backfillSingle = useAction(api.scripts.stripeBackfill.backfillSingleActivity);
const result = await backfillSingle({
  activityId: "abc123",
  dryRun: false
});
```

### Verificar atividades sem Stripe
```typescript
// Método interno - use via dashboard
const activities = await ctx.runQuery(
  internal.domains.stripe.backfill.getActivitiesWithoutStripe,
  { limit: 100 }
);
```

## 📝 Logs e Monitoramento

### Logs importantes
- `🚀 Starting activities Stripe backfill...` - Início do processo
- `📊 Found X activities to process` - Atividades encontradas
- `🔄 Processing activity: Name (ID: ...)` - Processando cada atividade
- `✅ Created Stripe product: ...` - Produto criado com sucesso
- `✅ Created payment link: ...` - Payment link criado
- `❌ Failed to process activity` - Falha no processamento
- `🎉 Backfill completed!` - Processo finalizado

### Monitorar no Stripe Dashboard
1. Acesse o dashboard do Stripe
2. Vá em "Products" para ver produtos criados
3. Vá em "Payment Links" para ver links criados
4. Verifique metadata para confirmar origem (Convex)

## 🚨 Importante

1. **Não execute em produção** sem testar primeiro
2. **Monitore rate limits** do Stripe
3. **Faça backup** antes de grandes operações
4. **Execute em horários de baixo tráfego**
5. **Tenha um plano de rollback** se necessário

## 📞 Suporte

Se encontrar problemas:
1. Verifique este documento primeiro
2. Consulte logs do Convex
3. Teste com `dryRun: true`
4. Use `limit` baixo para identificar problemas
5. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: $(date +"%Y-%m-%d")
**Versão**: 1.0 