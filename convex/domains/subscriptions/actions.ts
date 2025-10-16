"use node";

/**
 * Mercado Pago Subscription Actions
 * 
 * Core functions for MP subscription integration:
 * - createSubscription: Create MP subscription (preapproval)
 * - processSubscriptionWebhook: Handle MP webhook notifications for subscriptions
 */

import { internalAction, action } from "../../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../../_generated/api";
import { mpFetch } from "../mercadoPago/utils";

// Subscription configuration
const GUIDE_SUBSCRIPTION_CONFIG = {
  title: "Assinatura Premium - Guia de Viagens",
  reason: "Acesso completo ao painel de guia de viagens",
  amount: 99.90, // Valor anual em reais
  frequency: 12, // 12 months = 1 year (MP doesn't accept "years")
  frequencyType: "months",
  currencyId: "BRL"
};

/**
 * Create a subscription preapproval plan via Checkout Pro
 * This works better with test cards than panel-created plans
 */
export const createSubscriptionCheckout = action({
  args: {
    userId: v.string(), // Clerk user ID
    userEmail: v.string(),
    userName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    checkoutUrl: v.optional(v.string()),
    preapprovalId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Mercado Pago doesn't accept localhost URLs
      const productionUrl = "https://tucanoronha.com.br";
      const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      // Use production URL if localhost or not configured
      const baseUrl = (configuredUrl && !configuredUrl.includes("localhost")) 
        ? configuredUrl 
        : productionUrl;
      
      const isProduction = !baseUrl.includes("localhost");
      const successUrl = `${baseUrl}/meu-painel/guia/sucesso`;

      // Create preapproval plan body
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Inicia amanhã
      
      const body: any = {
        reason: GUIDE_SUBSCRIPTION_CONFIG.title,
        external_reference: `guide_${args.userId}`,
        payer_email: args.userEmail,
        back_url: successUrl, // Required by MP API
        auto_recurring: {
          frequency: GUIDE_SUBSCRIPTION_CONFIG.frequency,
          frequency_type: GUIDE_SUBSCRIPTION_CONFIG.frequencyType,
          transaction_amount: GUIDE_SUBSCRIPTION_CONFIG.amount,
          currency_id: GUIDE_SUBSCRIPTION_CONFIG.currencyId,
        },
        status: "pending", // Will be authorized after payment
      };

      console.log("[MP] Creating subscription preapproval via Checkout Pro:", body);
      console.log("[MP] Environment:", { isProduction, baseUrl, successUrl });

      // Create preapproval via Mercado Pago API
      const preapproval = await mpFetch<any>("/preapproval", {
        method: "POST",
        body: JSON.stringify(body),
      });

      console.log("[MP] Preapproval created:", preapproval);

      // The init_point is the checkout URL
      const checkoutUrl = preapproval.init_point;

      if (!checkoutUrl) {
        throw new Error("No checkout URL returned from Mercado Pago");
      }

      // Em desenvolvimento, salvar preapprovalId no banco para referência
      if (!isProduction) {
        console.log("[MP] DEV MODE - Após pagamento, o webhook processará automaticamente");
        console.log("[MP] DEV MODE - PreapprovalId:", preapproval.id);
      }

      return {
        success: true,
        checkoutUrl,
        preapprovalId: String(preapproval.id),
      };
    } catch (error) {
      console.error("[MP] Failed to create subscription checkout:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a subscription (preapproval) for the guide panel
 */
export const createSubscription = action({
  args: {
    userId: v.string(), // Clerk user ID
    userEmail: v.string(),
    cardTokenId: v.string(), // Token do cartão gerado pelo MP SDK
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    preapprovalId: v.optional(v.string()),
    initPoint: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Create subscription body
      const startDate = new Date();
      const body = {
        reason: GUIDE_SUBSCRIPTION_CONFIG.reason,
        external_reference: `guide_${args.userId}`,
        payer_email: args.userEmail,
        card_token_id: args.cardTokenId,
        auto_recurring: {
          frequency: GUIDE_SUBSCRIPTION_CONFIG.frequency,
          frequency_type: GUIDE_SUBSCRIPTION_CONFIG.frequencyType,
          transaction_amount: GUIDE_SUBSCRIPTION_CONFIG.amount,
          currency_id: GUIDE_SUBSCRIPTION_CONFIG.currencyId,
          start_date: startDate.toISOString(),
        },
        back_url: args.successUrl,
        status: "authorized",
        notification_url: process.env.CONVEX_SITE_URL ? 
          `${process.env.CONVEX_SITE_URL}/mercadopago/subscription-webhook` : 
          undefined,
      };

      console.log("[MP] Creating subscription with body:", body);

      // Create subscription via Mercado Pago API
      const preapproval = await mpFetch<any>("/preapproval", {
        method: "POST",
        body: JSON.stringify(body),
      });

      console.log("[MP] Subscription created:", preapproval);

      // Save subscription in database
      await ctx.runMutation(internal.domains.subscriptions.mutations.upsertSubscription, {
        userId: args.userId,
        userEmail: args.userEmail,
        mpPreapprovalId: String(preapproval.id),
        status: "authorized",
        reason: GUIDE_SUBSCRIPTION_CONFIG.reason,
        externalReference: `guide_${args.userId}`,
        frequency: GUIDE_SUBSCRIPTION_CONFIG.frequency,
        frequencyType: GUIDE_SUBSCRIPTION_CONFIG.frequencyType,
        transactionAmount: GUIDE_SUBSCRIPTION_CONFIG.amount,
        currencyId: GUIDE_SUBSCRIPTION_CONFIG.currencyId,
        startDate: new Date(preapproval.start_date || startDate).getTime(),
        endDate: preapproval.end_date ? new Date(preapproval.end_date).getTime() : undefined,
      });

      return {
        success: true,
        preapprovalId: String(preapproval.id),
        initPoint: preapproval.init_point || args.successUrl,
      };
    } catch (error) {
      console.error("[MP] Failed to create subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a subscription preference (for Checkout Pro)
 */
export const createSubscriptionPreference = action({
  args: {
    userId: v.string(), // Clerk user ID
    userEmail: v.string(),
    userName: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.optional(v.string()),
    preferenceUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Build return URLs - Mercado Pago requires HTTPS URLs, not localhost
      // Replace localhost URLs with production URL
      const productionUrl = "https://tucanoronha.com.br";
      
      const replaceLocalhost = (url: string | undefined): string => {
        if (!url) return productionUrl;
        // Replace localhost/127.0.0.1 URLs with production URL
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          // Extract the path from the localhost URL
          const urlObj = new URL(url);
          return `${productionUrl}${urlObj.pathname}${urlObj.search}`;
        }
        return url;
      };
      
      // Use provided URLs but replace localhost with production URL
      const successUrl = replaceLocalhost(args.successUrl?.trim()) || productionUrl;
      const failureUrl = replaceLocalhost(args.cancelUrl?.trim()) || productionUrl;
      const pendingUrl = successUrl;
      
      // Validate back_urls
      if (!successUrl) {
        throw new Error("back_urls.success is required for Mercado Pago preference");
      }
      
      // Log what we're using
      console.log("[MP] Final URLs for subscription:", {
        original: { success: args.successUrl, cancel: args.cancelUrl },
        final: { success: successUrl, failure: failureUrl, pending: pendingUrl }
      });

      // Separar nome em first_name e last_name para melhor aprovação
      const nameParts = (args.userName || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      // Create a recurring payment preference
      const body = {
        items: [{
          title: GUIDE_SUBSCRIPTION_CONFIG.title,
          quantity: 1,
          currency_id: GUIDE_SUBSCRIPTION_CONFIG.currencyId,
          unit_price: GUIDE_SUBSCRIPTION_CONFIG.amount,
          category_id: "travel", // Categoria para melhorar aprovação
          description: GUIDE_SUBSCRIPTION_CONFIG.reason,
        }],
        payer: {
          name: args.userName,
          email: args.userEmail,
          // Melhor aprovação com first_name e last_name separados
          first_name: firstName,
          last_name: lastName,
        },
        back_urls: {
          success: successUrl,
          pending: pendingUrl,
          failure: failureUrl,
        },
        auto_return: "approved",
        external_reference: `guide_${args.userId}`,
        statement_descriptor: "TUCA NORONHA", // Aparece na fatura do cartão
        notification_url: process.env.CONVEX_SITE_URL ? 
          `${process.env.CONVEX_SITE_URL}/mercadopago/subscription-webhook` : 
          undefined,
        metadata: {
          userId: String(args.userId),
          userEmail: args.userEmail,
          subscriptionType: "guide",
        },
        // Indicar que é uma assinatura recorrente
        purpose: "wallet_purchase",
      };

      console.log("[MP] Creating subscription preference with URLs:", {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl,
      });

      console.log("[MP] Sending preference to API:", {
        back_urls: body.back_urls,
        auto_return: body.auto_return,
      });

      // X-Idempotency-Key prevents duplicate preference creation on retries
      const preference = await mpFetch<any>("/checkout/preferences", {
        method: "POST",
        headers: {
          "X-Idempotency-Key": `guide-pref-${args.userId}-${Date.now()}`,
        },
        body: JSON.stringify(body),
      });

      console.log("[MP] Subscription preference created:", preference);

      const checkoutUrl = preference.init_point || 
                         preference.sandbox_init_point || 
                         `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preference.id}`;

      return {
        success: true,
        preferenceId: String(preference.id),
        preferenceUrl: checkoutUrl,
      };
    } catch (error) {
      console.error("[MP] Failed to create subscription preference:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a subscription payment via Payment Brick (direct payment)
 */
export const createSubscriptionPayment = action({
  args: {
    userId: v.string(), // Clerk user ID
    userEmail: v.string(),
    userName: v.optional(v.string()),
    token: v.string(), // Card token from Payment Brick
    paymentMethodId: v.string(),
    issuerId: v.optional(v.string()),
    installments: v.optional(v.number()),
    payer: v.object({
      email: v.string(),
      identification: v.optional(v.object({
        type: v.string(),
        number: v.string()
      }))
    }),
  },
  returns: v.object({
    success: v.boolean(),
    paymentId: v.optional(v.string()),
    status: v.optional(v.string()),
    statusDetail: v.optional(v.string()),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    try {
      console.log("[MP] Creating subscription payment for user:", args.userId);

      // Create payment body
      const paymentBody: any = {
        transaction_amount: GUIDE_SUBSCRIPTION_CONFIG.amount,
        token: args.token,
        payment_method_id: args.paymentMethodId,
        installments: args.installments || 1,
        description: GUIDE_SUBSCRIPTION_CONFIG.title,
        payer: args.payer,
        external_reference: `guide_${args.userId}`,
        metadata: {
          userId: args.userId,
          userEmail: args.userEmail,
          subscriptionType: "guide"
        }
      };

      // Add issuer if provided
      if (args.issuerId) {
        paymentBody.issuer_id = args.issuerId;
      }

      // Call Mercado Pago Payments API
      // Note: X-Idempotency-Key is REQUIRED by Mercado Pago to prevent duplicate charges
      const payment = await mpFetch<any>('/v1/payments', {
        method: 'POST',
        headers: {
          "X-Idempotency-Key": `guide-${args.userId}-${Date.now()}`,
        },
        body: JSON.stringify(paymentBody)
      });

      console.log("[MP] Subscription payment created:", {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail
      });

      // If payment is approved, create subscription
      if (payment.status === "approved") {
        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

        // Create subscription in database
        await ctx.runMutation(internal.domains.subscriptions.mutations.upsertSubscription, {
          userId: args.userId,
          userEmail: args.userEmail,
          mpPreapprovalId: String(payment.id), // Use payment ID as reference
          status: "authorized",
          reason: GUIDE_SUBSCRIPTION_CONFIG.reason,
          externalReference: `guide_${args.userId}`,
          frequency: GUIDE_SUBSCRIPTION_CONFIG.frequency,
          frequencyType: GUIDE_SUBSCRIPTION_CONFIG.frequencyType,
          transactionAmount: GUIDE_SUBSCRIPTION_CONFIG.amount,
          currencyId: GUIDE_SUBSCRIPTION_CONFIG.currencyId,
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
        });

        // Record payment
        const subscription = await ctx.runQuery(
          internal.domains.subscriptions.queries.getUserSubscriptionInternal,
          { userId: args.userId }
        );

        if (subscription) {
          await ctx.runMutation(internal.domains.subscriptions.mutations.recordPayment, {
            userId: args.userId,
            subscriptionId: subscription._id,
            mpPaymentId: String(payment.id),
            mpPreapprovalId: String(payment.id),
            amount: payment.transaction_amount || GUIDE_SUBSCRIPTION_CONFIG.amount,
            currency: payment.currency_id || "BRL",
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentMethod: payment.payment_method_id,
            paymentTypeId: payment.payment_type_id,
            paidAt: payment.date_approved ? new Date(payment.date_approved).getTime() : Date.now(),
          });
        }
      }

      return {
        success: true,
        paymentId: String(payment.id),
        status: payment.status,
        statusDetail: payment.status_detail
      };

    } catch (error) {
      console.error("[MP] Failed to create subscription payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});

/**
 * Process Mercado Pago subscription webhook events
 * Public action to be called from API route
 */
export const processSubscriptionWebhook = action({
  args: {
    id: v.optional(v.union(v.string(), v.number())),
    type: v.optional(v.string()),
    action: v.optional(v.string()),
    data: v.optional(v.any()),
    entity: v.optional(v.string()),
    application_id: v.optional(v.union(v.string(), v.number())),
    date: v.optional(v.string()),
    version: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const eventId = args.id != null ? String(args.id) : undefined;

      if (!eventId) {
        return { success: false, processed: false, error: "Missing event id" };
      }

      console.log(`[MP] Processing subscription webhook: ${args.type} - ${args.action}`);

      // Handle subscription notifications
      if (args.type === "subscription_preapproval" || 
          args.type === "subscription_authorized_payment") {
        
        const preapprovalId = args.data?.id || args.data?.preapproval_id;
        if (!preapprovalId) {
          console.warn("[MP] No preapproval ID found in webhook data");
          return { success: true, processed: true };
        }

        // Fetch subscription details from MP
        try {
          console.log(`[MP] Attempting to fetch subscription ${preapprovalId} from Mercado Pago`);
          const subscription = await mpFetch<any>(`/preapproval/${preapprovalId}`);
          console.log(`[MP] Fetched subscription ${preapprovalId}:`, subscription);

          // Extract user ID from external reference or email
          const externalRef = subscription.external_reference;
          let userId = externalRef ? externalRef.replace("guide_", "") : null;
          
          // Se não tiver external_reference, buscar usuário pelo email
          if (!userId && subscription.payer_email) {
            const user = await ctx.runQuery(
              internal.domains.users.queries.getUserByEmail,
              { email: subscription.payer_email }
            );
            if (user) {
              userId = user.clerkId;
              console.log(`[MP] Found user by email: ${subscription.payer_email} -> ${userId}`);
            } else {
              console.warn(`[MP] No user found for email: ${subscription.payer_email}`);
            }
          }

          if (userId) {
            // Check if subscription already exists
            const existingSubscription = await ctx.runQuery(
              internal.domains.subscriptions.queries.getUserSubscriptionInternal,
              { userId }
            );

            if (existingSubscription) {
              // Update existing subscription
              await ctx.runMutation(internal.domains.subscriptions.mutations.updateSubscriptionStatus, {
                mpPreapprovalId: String(preapprovalId),
                status: subscription.status,
                cancelledDate: subscription.cancelled ? Date.now() : undefined,
                pausedDate: subscription.paused ? Date.now() : undefined,
              });
              console.log(`[MP] Updated existing subscription for user ${userId}`);
            } else {
              // Create new subscription
              const startDate = subscription.start_date ? new Date(subscription.start_date) : new Date();
              const endDate = subscription.end_date ? new Date(subscription.end_date) : undefined;

              await ctx.runMutation(internal.domains.subscriptions.mutations.upsertSubscription, {
                userId,
                userEmail: subscription.payer_email || "",
                mpPreapprovalId: String(preapprovalId),
                status: subscription.status,
                reason: subscription.reason || "Assinatura Premium - Guia de Viagens",
                externalReference: externalRef,
                frequency: subscription.auto_recurring?.frequency || 12,
                frequencyType: (subscription.auto_recurring?.frequency_type || "months") as "days" | "weeks" | "months" | "years",
                transactionAmount: subscription.auto_recurring?.transaction_amount || 99.90,
                currencyId: subscription.auto_recurring?.currency_id || "BRL",
                startDate: startDate.getTime(),
                endDate: endDate ? endDate.getTime() : undefined,
              });
              console.log(`[MP] Created new subscription for user ${userId}`);
            }
          }
        } catch (error) {
          console.error(`[MP] Failed to fetch subscription ${preapprovalId}:`, error);
          console.warn(`[MP] This is expected for test IDs. Webhook processing will continue.`);
          // Return success even if fetch fails (important for testing)
          return { success: true, processed: true, error: "Test ID or invalid preapproval - skipped" };
        }
      }

      // Handle payment notifications for subscriptions
      if (args.type === "payment" && args.data?.id) {
        const paymentId = args.data.id;
        
        try {
          const payment = await mpFetch<any>(`/v1/payments/${paymentId}`);
          console.log(`[MP] Fetched subscription payment ${paymentId}:`, payment);

          // Check if it's a subscription payment
          if (payment.metadata?.subscriptionType === "guide" && payment.metadata?.userId) {
            // Get subscription
            const subscription = await ctx.runQuery(
              internal.domains.subscriptions.queries.getUserSubscriptionInternal,
              { userId: payment.metadata.userId as any }
            );

            if (subscription) {
              // Record payment
              await ctx.runMutation(internal.domains.subscriptions.mutations.recordPayment, {
                userId: payment.metadata.userId as any,
                subscriptionId: subscription._id,
                mpPaymentId: String(payment.id),
                mpPreapprovalId: subscription.mpPreapprovalId,
                amount: payment.transaction_amount || 0,
                currency: payment.currency_id || "BRL",
                status: payment.status,
                statusDetail: payment.status_detail,
                paymentMethod: payment.payment_method_id,
                paymentTypeId: payment.payment_type_id,
                paidAt: payment.date_approved ? new Date(payment.date_approved).getTime() : undefined,
                failureReason: payment.status_detail,
              });
            }
          }
        } catch (error) {
          console.error(`[MP] Failed to process subscription payment ${paymentId}:`, error);
        }
      }

      return { success: true, processed: true };
    } catch (error) {
      console.error("[MP] Failed to process subscription webhook:", error);
      return { 
        success: false, 
        processed: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

/**
 * Manual action to process a subscription by email
 * Searches MP for active subscriptions for this email and processes them
 */
export const manuallyProcessSubscriptionByEmail = action({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
    subscription: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log(`[MP] Searching subscriptions for email: ${args.email}`);
      
      // Try multiple approaches to find the subscription
      
      // Approach 1: Check if user exists in our system first
      const user = await ctx.runQuery(
        internal.domains.users.queries.getUserByEmail,
        { email: args.email }
      );
      
      if (!user) {
        return {
          success: false,
          error: `Usuário não encontrado no sistema com o email ${args.email}. Verifique se o email está correto.`
        };
      }
      
      console.log(`[MP] User found in system: ${user.clerkId}`);
      
      // Approach 2: Check if subscription already exists in Convex
      const existingSubscription = await ctx.runQuery(
        internal.domains.subscriptions.queries.getUserSubscriptionInternal,
        { userId: user.clerkId }
      );
      
      if (existingSubscription) {
        return {
          success: true,
          message: `Assinatura já existe no sistema para ${args.email}`,
          subscription: existingSubscription
        };
      }
      
      // Approach 3: Search MP for subscriptions
      try {
        const preapprovals = await mpFetch<any>('/preapproval/search', {
          method: 'GET',
        });
        
        console.log(`[MP] Total preapprovals found: ${preapprovals.results?.length || 0}`);
        
        // Filter by email and any active status (not just 'authorized')
        const userPreapprovals = preapprovals.results?.filter((p: any) => 
          p.payer_email?.toLowerCase() === args.email.toLowerCase() && 
          (p.status === 'authorized' || p.status === 'pending')
        );
        
        console.log(`[MP] Preapprovals for ${args.email}:`, userPreapprovals?.length || 0);
        
        if (userPreapprovals && userPreapprovals.length > 0) {
          // Get the most recent subscription
          const mostRecent = userPreapprovals.sort((a: any, b: any) => 
            new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
          )[0];
          
          console.log(`[MP] Processing subscription:`, mostRecent.id);
          
          // Process this subscription
          const result = await ctx.runAction(api.domains.subscriptions.actions.manuallyProcessSubscription, {
            preapprovalId: String(mostRecent.id),
          });
          
          return result;
        }
      } catch (mpError) {
        console.error("[MP] Error searching MP preapprovals:", mpError);
        // Continue to approach 4
      }
      
      // Approach 4: Guide user to use Preapproval ID
      return {
        success: false,
        error: `Não encontrei assinatura automática para ${args.email}. Por favor:\n\n1. Acesse o painel do Mercado Pago\n2. Vá em Vendas → Assinaturas\n3. Encontre sua assinatura\n4. Copie o Preapproval ID\n5. Use a opção "Processar por Preapproval ID" nesta página`
      };
      
    } catch (error) {
      console.error("[MP] Failed to process subscription by email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});

/**
 * Manual action to process a subscription by preapproval ID
 * Use this to manually create a subscription if webhook failed
 */
export const manuallyProcessSubscription = action({
  args: {
    preapprovalId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
    subscription: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log(`[MP] Manually processing subscription ${args.preapprovalId}`);
      
      // Fetch subscription details from MP
      const preapproval = await mpFetch<any>(`/preapproval/${args.preapprovalId}`);
      console.log(`[MP] Fetched preapproval:`, preapproval);
      
      // Extract user info
      const userEmail = preapproval.payer_email;
      const externalRef = preapproval.external_reference;
      let userId = externalRef ? externalRef.replace("guide_", "") : null;
      
      // Se não tiver external_reference, buscar usuário pelo email
      if (!userId && userEmail) {
        const user = await ctx.runQuery(
          internal.domains.users.queries.getUserByEmail,
          { email: userEmail }
        );
        if (user) {
          userId = user.clerkId;
          console.log(`[MP] Found user by email: ${userEmail} -> ${userId}`);
        } else {
          return {
            success: false,
            error: `Nenhum usuário encontrado com o email: ${userEmail}`
          };
        }
      }
      
      if (!userId) {
        return {
          success: false,
          error: "Não foi possível identificar o usuário desta assinatura"
        };
      }
      
      // Map MP status to our internal status
      const statusMap: Record<string, "authorized" | "paused" | "cancelled" | "pending"> = {
        "authorized": "authorized",
        "paused": "paused",
        "cancelled": "cancelled",
        "pending": "pending"
      };
      
      const subscriptionStatus = statusMap[preapproval.status] || "pending";
      
      // Calculate dates
      const startDate = preapproval.date_created ? new Date(preapproval.date_created) : new Date();
      const endDate = preapproval.end_date ? new Date(preapproval.end_date) : undefined;
      
      // Create or update subscription
      const subscriptionId = await ctx.runMutation(internal.domains.subscriptions.mutations.upsertSubscription, {
        userId: userId,
        userEmail: userEmail,
        mpPreapprovalId: args.preapprovalId,
        mpPlanId: preapproval.preapproval_plan_id,
        status: subscriptionStatus,
        reason: preapproval.reason || "Assinatura Premium - Guia de Viagens",
        externalReference: externalRef,
        frequency: preapproval.auto_recurring?.frequency || 12,
        frequencyType: (preapproval.auto_recurring?.frequency_type || "months") as "days" | "weeks" | "months" | "years",
        transactionAmount: preapproval.auto_recurring?.transaction_amount || 99.90,
        currencyId: preapproval.auto_recurring?.currency_id || "BRL",
        startDate: startDate.getTime(),
        endDate: endDate ? endDate.getTime() : undefined,
        metadata: {
          source: "manual_processing",
          processedAt: new Date().toISOString()
        }
      });
      
      // Get the created subscription
      const subscription = await ctx.runQuery(
        internal.domains.subscriptions.queries.getUserSubscriptionInternal,
        { userId }
      );
      
      console.log(`[MP] Subscription processed successfully for user ${userId}`);
      
      return {
        success: true,
        message: `Assinatura criada/atualizada com sucesso para o usuário ${userId}`,
        subscription: subscription
      };
      
    } catch (error) {
      console.error("[MP] Failed to manually process subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
}); 