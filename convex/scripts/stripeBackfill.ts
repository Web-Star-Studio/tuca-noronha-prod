import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Public action to run Stripe backfill (accessible from dashboard/frontend)
 * This is a wrapper around the internal backfill action for easier testing
 */
export const runStripeBackfill = action({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    partnerId: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    processed: v.number(),
    succeeded: v.number(),
    failed: v.number(),
    errors: v.array(v.object({
      activityId: v.string(),
      activityTitle: v.string(),
      error: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    console.log("🚀 Starting Stripe backfill from public action...");
    
    const result = await ctx.runAction(internal.domains.stripe.backfill.backfillActivitiesStripe, {
      dryRun: args.dryRun,
      limit: args.limit,
      partnerId: args.partnerId as any, // Type conversion for ID
    });

    return result;
  },
});

/**
 * Get integration summary (accessible from dashboard/frontend)
 */
export const getIntegrationSummary = action({
  args: {},
  returns: v.object({
    totalActivities: v.number(),
    withStripeProducts: v.number(),
    withoutStripeProducts: v.number(),
    withPaymentLinks: v.number(),
    withoutPaymentLinks: v.number(),
    activeActivities: v.number(),
    inactiveActivities: v.number(),
  }),
  handler: async (ctx) => {
    const summary = await ctx.runQuery(internal.domains.stripe.backfillQueries.getStripeIntegrationSummary);
    return summary;
  },
});

/**
 * Backfill a single activity (useful for testing)
 */
export const backfillSingleActivity = action({
  args: {
    activityId: v.string(),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.runAction(internal.domains.stripe.backfill.backfillSingleActivity, {
      activityId: args.activityId as any, // Type conversion for ID
      dryRun: args.dryRun,
    });

    return result;
  },
});

/*
================================================================================
                            EXEMPLOS DE USO
================================================================================

IMPORTANTE: Configure as variáveis de ambiente antes de executar:
- STRIPE_SECRET_KEY=sk_test_...
- NEXT_PUBLIC_APP_URL=http://localhost:3000

================================================================================
1. VERIFICAR STATUS ATUAL
================================================================================

import { api } from "./convex/_generated/api";
import { useAction } from "convex/react";

// No React/Frontend:
const getSummary = useAction(api.scripts.stripeBackfill.getIntegrationSummary);
const summary = await getSummary();
console.log(summary);

// Output esperado:
{
  totalActivities: 25,
  withStripeProducts: 5,
  withoutStripeProducts: 20,
  withPaymentLinks: 5,
  withoutPaymentLinks: 20,
  activeActivities: 22,
  inactiveActivities: 3
}

================================================================================
2. TESTE DRY RUN (apenas simula, não executa)
================================================================================

const runBackfill = useAction(api.scripts.stripeBackfill.runStripeBackfill);
const result = await runBackfill({ dryRun: true, limit: 5 });
console.log(result);

// Output esperado:
{
  total: 5,
  processed: 5,
  succeeded: 5,
  failed: 0,
  errors: []
}

================================================================================
3. EXECUTAR BACKFILL REAL (com limite de segurança)
================================================================================

// Processar apenas 10 atividades por vez
const result = await runBackfill({ dryRun: false, limit: 10 });
console.log(result);

================================================================================
4. PROCESSAR APENAS UM PARCEIRO ESPECÍFICO
================================================================================

// Se você tem o ID do parceiro
const result = await runBackfill({ 
  dryRun: false, 
  limit: 50,
  partnerId: "jd7xyz123abc..." 
});

================================================================================
5. TESTAR UMA ATIVIDADE ESPECÍFICA
================================================================================

const backfillSingle = useAction(api.scripts.stripeBackfill.backfillSingleActivity);
const result = await backfillSingle({ 
  activityId: "jd7xyz123abc...",
  dryRun: false 
});
console.log(result);

================================================================================
6. EXECUTAR VIA CONVEX DASHBOARD
================================================================================

1. Acesse https://dashboard.convex.dev
2. Vá para seu projeto
3. Clique em "Functions"
4. Procure por "scripts/stripe-backfill:runStripeBackfill"
5. Execute com os parâmetros desejados

Exemplo de parâmetros no dashboard:
{
  "dryRun": true,
  "limit": 5
}

================================================================================
7. EXECUTAR VIA CLI (se preferir)
================================================================================

npx convex run scripts/stripe-backfill:runStripeBackfill '{"dryRun": true, "limit": 5}'

================================================================================
TROUBLESHOOTING
================================================================================

Se ocorrerem erros:

1. Verifique as variáveis de ambiente
2. Certifique-se que o Stripe está configurado
3. Execute primeiro com dryRun: true
4. Comece com limit baixo (5-10)
5. Verifique os logs no console do Convex

================================================================================
*/ 