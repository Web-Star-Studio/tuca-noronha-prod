"use node";

/**
 * Guide Purchase Actions
 * 
 * Core functions for guide purchase integration:
 * - createGuidePurchasePreference: Create MP payment preference
 * - processGuidePaymentWebhook: Handle MP webhook notifications
 */

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { mpFetch } from "../mercadoPago/utils";

// Guide configuration
const GUIDE_CONFIG = {
  title: "Guia Exclusivo de Fernando de Noronha",
  description: "Acesso vitalício ao guia completo com roteiros, dicas e contatos",
  amount: 99.90, // One-time payment
  currencyId: "BRL"
};

/**
 * Create a payment preference for guide purchase
 */
export const createGuidePurchasePreference = action({
  args: {
    userId: v.string(), // Clerk user ID
    userEmail: v.string(),
    userName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Build return URLs - Replace localhost with production URL
      const productionUrl = "https://tucanoronha.com.br";
      const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      const baseUrl = (configuredUrl && !configuredUrl.includes("localhost")) 
        ? configuredUrl 
        : productionUrl;
      
      const successUrl = `${baseUrl}/meu-painel/guia/sucesso`;
      const failureUrl = `${baseUrl}/meu-painel/guia/erro`;
      const pendingUrl = successUrl;
      
      console.log("[Guide] Creating payment preference for user:", args.userId);
      console.log("[Guide] URLs:", { success: successUrl, failure: failureUrl });

      // Separate name for better approval rates
      const nameParts = (args.userName || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      // Create payment preference body
      const body = {
        items: [{
          title: GUIDE_CONFIG.title,
          description: GUIDE_CONFIG.description,
          quantity: 1,
          currency_id: GUIDE_CONFIG.currencyId,
          unit_price: GUIDE_CONFIG.amount,
          category_id: "travel", // Category for better approval
        }],
        payer: {
          email: args.userEmail,
          name: args.userName,
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
        statement_descriptor: "TUCA NORONHA GUIA", // Appears on card statement
        notification_url: process.env.CONVEX_SITE_URL ? 
          `${process.env.CONVEX_SITE_URL}/mercadopago/guide-webhook` : 
          undefined,
        metadata: {
          user_id: args.userId,        // MP mantém snake_case
          user_email: args.userEmail,  // MP mantém snake_case
          product_type: "guide",       // MP mantém snake_case
        },
        // purpose: "wallet_purchase", // Removido para permitir guest checkout (sem login)
      };

      console.log("[Guide] Creating preference with MP");

      // X-Idempotency-Key prevents duplicate preference creation
      const preference = await mpFetch<any>("/checkout/preferences", {
        method: "POST",
        headers: {
          "X-Idempotency-Key": `guide-${args.userId}-${Date.now()}`,
        },
        body: JSON.stringify(body),
      });

      console.log("[Guide] Preference created:", preference.id);

      const checkoutUrl = preference.init_point || 
                         preference.sandbox_init_point || 
                         `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preference.id}`;

      return {
        success: true,
        preferenceId: String(preference.id),
        checkoutUrl,
      };
    } catch (error) {
      console.error("[Guide] Failed to create preference:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Process Mercado Pago payment webhook for guide purchases
 * Called from /mercadopago/guide-webhook endpoint
 */
export const processGuidePaymentWebhook = internalAction({
  args: {
    // Formato novo do webhook MP
    id: v.optional(v.union(v.string(), v.number())),
    type: v.optional(v.string()),
    action: v.optional(v.string()),
    data: v.optional(v.any()),
    api_version: v.optional(v.string()),
    date_created: v.optional(v.string()),
    live_mode: v.optional(v.boolean()),
    user_id: v.optional(v.string()),
    // Formato antigo do webhook MP (topic/resource)
    topic: v.optional(v.string()),
    resource: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log(`[Guide] Processing webhook:`, args.type || args.topic);

      // Handle payment notifications (formato novo)
      if (args.type === "payment" && args.data?.id) {
        const paymentId = args.data.id;
        
        try {
          // Fetch payment details from MP
          const payment = await mpFetch<any>(`/v1/payments/${paymentId}`);
          console.log(`[Guide] Fetched payment ${paymentId}:`, {
            status: payment.status,
            metadata: payment.metadata,
          });

          // Check if it's a guide payment (MP envia metadata em snake_case)
          const productType = payment.metadata?.product_type || payment.metadata?.productType;
          const userId = payment.metadata?.user_id || payment.metadata?.userId;
          
          console.log(`[Guide] Metadata check: productType=${productType}, userId=${userId}`);
          
          if (productType === "guide" && userId) {
            console.log(`[Guide] Processing guide payment for user ${userId}`);
            
            // Extract user info from external reference if needed
            let userEmail = payment.metadata?.user_email || payment.metadata?.userEmail || payment.payer?.email || "";
            let userName = payment.payer?.first_name ? 
              `${payment.payer.first_name} ${payment.payer.last_name || ""}`.trim() : 
              undefined;

            // Record/update purchase
            await ctx.runMutation(internal.domains.guide.mutations.recordPurchase, {
              userId,
              userEmail,
              userName,
              mpPaymentId: String(payment.id),
              mpPreferenceId: payment.preference_id,
              amount: payment.transaction_amount || 99.90,
              currency: payment.currency_id || "BRL",
              status: payment.status,
              statusDetail: payment.status_detail,
              paymentMethod: payment.payment_method_id,
              paymentTypeId: payment.payment_type_id,
              approvedAt: payment.date_approved ? new Date(payment.date_approved).getTime() : undefined,
              externalReference: payment.external_reference,
              metadata: payment.metadata,
            });

            console.log(`[Guide] Purchase recorded for user ${userId}, status: ${payment.status}`);
          }
        } catch (error) {
          console.error(`[Guide] Failed to process payment ${paymentId}:`, error);
        }
      }
      
      // Handle payment notifications (formato antigo topic/resource)
      if (args.topic === "payment" && args.resource) {
        const paymentId = args.resource;
        
        try {
          // Fetch payment details from MP
          const payment = await mpFetch<any>(`/v1/payments/${paymentId}`);
          console.log(`[Guide] Fetched payment ${paymentId}:`, {
            status: payment.status,
            metadata: payment.metadata,
          });

          // Check if it's a guide payment (MP envia metadata em snake_case)
          const productType = payment.metadata?.product_type || payment.metadata?.productType;
          const userId = payment.metadata?.user_id || payment.metadata?.userId;
          
          console.log(`[Guide] Metadata check: productType=${productType}, userId=${userId}`);
          
          if (productType === "guide" && userId) {
            console.log(`[Guide] Processing guide payment for user ${userId}`);
            
            // Extract user info from external reference if needed
            let userEmail = payment.metadata?.user_email || payment.metadata?.userEmail || payment.payer?.email || "";
            let userName = payment.payer?.first_name ? 
              `${payment.payer.first_name} ${payment.payer.last_name || ""}`.trim() : 
              undefined;

            // Record/update purchase
            await ctx.runMutation(internal.domains.guide.mutations.recordPurchase, {
              userId,
              userEmail,
              userName,
              mpPaymentId: String(payment.id),
              mpPreferenceId: payment.preference_id,
              amount: payment.transaction_amount || GUIDE_CONFIG.amount,
              currency: payment.currency_id || "BRL",
              status: payment.status,
              statusDetail: payment.status_detail,
              paymentMethod: payment.payment_method_id,
              paymentTypeId: payment.payment_type_id,
              approvedAt: payment.date_approved ? new Date(payment.date_approved).getTime() : undefined,
              externalReference: payment.external_reference,
              metadata: payment.metadata,
            });

            console.log(`[Guide] Purchase recorded for user ${userId}, status: ${payment.status}`);
          }
        } catch (error) {
          console.error(`[Guide] Failed to process payment ${paymentId}:`, error);
        }
      }

      return { success: true, processed: true };
    } catch (error) {
      console.error("[Guide] Failed to process webhook:", error);
      return { 
        success: false, 
        processed: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});
