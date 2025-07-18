"use node";

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal, api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import Stripe from "stripe";

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil" as any,
});

// Helper function to ensure URL has proper protocol
function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  // Ensure baseUrl has protocol
  let url = baseUrl;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // In production, always use https; in dev, use http
    const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
    url = protocol + url;
  }
  // Remove trailing slash from base URL if present
  url = url.replace(/\/$/, '');
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return url + path;
}

// Criar conta conectada no Stripe
export const createStripeConnectedAccount = action({
  args: {
    userId: v.id("users"),
    email: v.string(),
    country: v.string(),
    businessType: v.optional(v.union(v.literal("individual"), v.literal("company"))),
    businessName: v.optional(v.string()),
  },
  returns: v.object({
    stripeAccountId: v.string(),
    onboardingUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Criar conta conectada no Stripe com configuração para Destination Charges
      const account = await stripe.accounts.create({
        type: "express", // Express account com dashboard limitado
        country: args.country,
        email: args.email,
        business_type: args.businessType || "individual",
        company: args.businessType === "company" && args.businessName ? {
          name: args.businessName,
        } : undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Buscar a taxa padrão configurada
      const defaultFeePercentage = await ctx.runQuery(api.domains.systemSettings.queries.getDefaultPartnerFee);

      // Criar partner no banco de dados
      const partnerId = await ctx.runMutation(internal.domains.partners.mutations.createPartner, {
        userId: args.userId,
        stripeAccountId: account.id,
        country: args.country,
        businessType: args.businessType,
        businessName: args.businessName,
        defaultFeePercentage, // Usar taxa configurável
      });

      // Gerar link de onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: getAbsoluteUrl('/admin/dashboard/pagamentos/onboarding?refresh=true'),
        return_url: getAbsoluteUrl('/admin/dashboard/pagamentos/onboarding?success=true'),
        type: "account_onboarding",
        collection_options: {
          fields: "eventually_due", // Coletar todas as informações necessárias
        },
      });

      return {
        stripeAccountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      console.error("Erro ao criar conta conectada:", error);
      throw new Error("Falha ao criar conta conectada no Stripe");
    }
  },
});

// Gerar novo link de onboarding (quando o anterior expira)
export const refreshOnboardingLink = action({
  args: {
    stripeAccountId: v.string(),
  },
  returns: v.object({
    onboardingUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: args.stripeAccountId,
        refresh_url: getAbsoluteUrl('/admin/dashboard/pagamentos/onboarding?refresh=true'),
        return_url: getAbsoluteUrl('/admin/dashboard/pagamentos/onboarding?success=true'),
        type: "account_onboarding",
        collection_options: {
          fields: "eventually_due",
        },
      });

      return {
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      console.error("Erro ao gerar link de onboarding:", error);
      throw new Error("Falha ao gerar novo link de onboarding");
    }
  },
});

// Calcular e aplicar taxa de aplicação
export const calculateApplicationFee = action({
  args: {
    partnerId: v.id("partners"),
    totalAmount: v.number(), // em centavos
  },
  returns: v.object({
    totalAmount: v.number(),
    feePercentage: v.number(),
    applicationFeeAmount: v.number(),
    partnerAmount: v.number(),
    estimatedStripeFee: v.number(),
  }),
  handler: async (ctx, args) => {
    // Buscar partner e sua taxa atual
    const partner = await ctx.runQuery(internal.domains.partners.queries.getPartnerByStripeId, {
      stripeAccountId: args.partnerId as unknown as string,
    });

    if (!partner) {
      throw new Error("Partner não encontrado");
    }

    // Calcular valores
    const feePercentage = partner.feePercentage;
    const applicationFeeAmount = Math.floor(args.totalAmount * (feePercentage / 100));
    
    // Estimar taxa do Stripe (2.9% + R$ 0,29)
    const estimatedStripeFee = Math.floor(args.totalAmount * 0.029) + 29;
    
    // O partner recebe o total menos a taxa da plataforma
    // O Stripe deduz suas taxas automaticamente do valor do partner
    const partnerAmount = args.totalAmount - applicationFeeAmount;

    return {
      totalAmount: args.totalAmount,
      feePercentage,
      applicationFeeAmount,
      partnerAmount,
      estimatedStripeFee,
    };
  },
});

// Processar webhook do Stripe Connect
export const processStripeConnectWebhook = internalAction({
  args: {
    event: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = args.event;
    console.log("Processando webhook do Stripe Connect:", event.type);

    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        
        // Determinar status do onboarding
        let status: "pending" | "in_progress" | "completed" | "rejected" = "pending";
        
        if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
          status = "completed";
        } else if (account.details_submitted) {
          status = "in_progress";
        }

        // Atualizar status no banco
        await ctx.runMutation(internal.domains.partners.mutations.updateOnboardingStatus, {
          stripeAccountId: account.id,
          status,
          capabilities: {
            cardPayments: account.capabilities?.card_payments === "active",
            transfers: account.capabilities?.transfers === "active",
          },
        });
        break;
      }

      case "account.application.deauthorized": {
        // Partner desconectou a conta
        const account = event.data.object as any;
        await ctx.runMutation(internal.domains.partners.mutations.updateOnboardingStatus, {
          stripeAccountId: event.account!,
          status: "rejected",
        });
        break;
      }

      case "payment_intent.succeeded": {
        // Pagamento bem-sucedido com Destination Charge
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Se for um Destination Charge com conta conectada
        if (event.account) {
          // O webhook está vindo da conta conectada
          // Aqui podemos registrar a transação se necessário
          console.log("Destination charge succeeded for connected account:", event.account);
        }
        break;
      }

      case "application_fee.created": {
        // Taxa de aplicação foi criada
        const applicationFee = event.data.object as Stripe.ApplicationFee;
        console.log("Application fee created:", applicationFee.amount);
        break;
      }

      case "transfer.created":
      case "transfer.updated": {
        // Transferência criada ou atualizada
        const transfer = event.data.object as Stripe.Transfer;
        console.log("Transfer event:", transfer.id, transfer.amount);
        break;
      }
    }

    return null;
  },
});

// Criar link do Express Dashboard para o partner
export const createDashboardLink = action({
  args: {
    stripeAccountId: v.string(),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const loginLink = await stripe.accounts.createLoginLink(args.stripeAccountId);
      return {
        url: loginLink.url,
      };
    } catch (error) {
      console.error("Erro ao criar link do dashboard:", error);
      throw new Error("Falha ao criar link do Express Dashboard");
    }
  },
});

// Sincronizar status do partner com o Stripe (temporário - para corrigir casos onde webhook não funcionou)
export const syncPartnerStatus = action({
  args: {
    stripeAccountId: v.string(),
  },
  returns: v.object({
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    chargesEnabled: v.boolean(),
    payoutsEnabled: v.boolean(),
    detailsSubmitted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      // Buscar conta no Stripe
      const account = await stripe.accounts.retrieve(args.stripeAccountId);
      
      // Determinar status baseado no estado da conta
      let onboardingStatus: 'pending' | 'in_progress' | 'completed' | 'rejected' = 'pending';
      
      if (account.charges_enabled && account.payouts_enabled) {
        onboardingStatus = 'completed';
      } else if (account.details_submitted) {
        onboardingStatus = 'in_progress';
      } else if (account.requirements?.disabled_reason) {
        onboardingStatus = 'rejected';
      }
      
      // Atualizar status no banco
      await ctx.runMutation(internal.domains.partners.mutations.updateOnboardingStatus, {
        stripeAccountId: account.id,
        status: onboardingStatus,
        capabilities: {
          cardPayments: account.capabilities?.card_payments === 'active',
          transfers: account.capabilities?.transfers === 'active',
        },
      });
      
      console.log(`Status sincronizado: ${onboardingStatus}`);
      
      return {
        status: onboardingStatus,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        detailsSubmitted: account.details_submitted || false,
      };
    } catch (error) {
      console.error("Erro ao sincronizar status:", error);
      throw new Error("Falha ao sincronizar status com o Stripe");
    }
  },
}); 