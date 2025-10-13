"use node";

/**
 * Mercado Pago Actions - Simplified Implementation
 * 
 * Core functions for Mercado Pago integration:
 * - createCheckoutPreference: Create MP checkout preference
 * - createCheckoutPreferenceForBooking: Public action for booking checkout
 * - capturePayment: Capture authorized payment
 * - cancelPayment: Cancel authorized payment
 * - refundPayment: Refund captured payment
 * - approveBookingAndCapturePayment: Admin approve booking
 * - rejectBookingAndCancelPayment: Admin reject booking
 * - processWebhookEvent: Handle MP webhook notifications
 */

import { internalAction, action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { mpFetch } from "./utils";

const assetTypeValidator = v.union(
  v.literal("activity"),
  v.literal("event"),
  v.literal("restaurant"),
  v.literal("vehicle"),
  v.literal("package")
);

/**
 * Create a Checkout Preference for Mercado Pago
 * Called by createCheckoutPreferenceForBooking
 */
export const createCheckoutPreference = internalAction({
  args: {
    bookingId: v.string(),
    assetType: assetTypeValidator,
    title: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    currency: v.optional(v.string()),
    backUrls: v.object({
      success: v.string(),
      pending: v.string(),
      failure: v.string(),
    }),
    notificationUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    captureMode: v.optional(v.union(v.literal("automatic"), v.literal("manual"))),
  },
  handler: async (ctx, args) => {
    try {
      // Validate back_urls
      if (!args.backUrls || !args.backUrls.success) {
        throw new Error("back_urls.success is required for Mercado Pago preference");
      }

      // Build Mercado Pago preference body
      const body: any = {
        items: [
          {
            title: args.title,
            quantity: args.quantity,
            currency_id: args.currency || "BRL",
            unit_price: args.unitPrice,
          },
        ],
        back_urls: args.backUrls,
        auto_return: "approved",
        notification_url: args.notificationUrl,
        metadata: {
          bookingId: args.bookingId,
          assetType: args.assetType,
          captureMode: args.captureMode || "manual", // Default to manual capture
          ...(args.metadata || {}),
        },
        payment_methods: {
          installments: 1,
        },
      };

      // Configure capture mode for authorization without automatic capture
      if (args.captureMode === "manual") {
        // For manual capture, use binary_mode false to allow authorization without capture
        body.binary_mode = false;
        body.additional_info = {
          capture: false // Don't capture automatically
        };
        // Log that we're using manual capture mode
        console.log("[MP] Using MANUAL capture mode - payment will be AUTHORIZED only, requiring admin approval to capture");
      } else {
        // For automatic capture (default MP behavior)
        body.binary_mode = true;
        console.log("[MP] Using AUTOMATIC capture mode - payment will be captured immediately");
      }

      console.log("[MP] Sending preference to API:", {
        back_urls: body.back_urls,
        auto_return: body.auto_return,
      });

      // Create preference via Mercado Pago API
      // X-Idempotency-Key prevents duplicate preference creation on retries
      const preference = await mpFetch<any>("/checkout/preferences", {
        method: "POST",
        headers: {
          "X-Idempotency-Key": `booking-pref-${args.bookingId}-${Date.now()}`,
        },
        body: JSON.stringify(body),
      });

      // Store preference ID in booking
      await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingMpInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        mpPreferenceId: String(preference.id),
        paymentStatus: "pending",
      });

      return {
        success: true,
        id: String(preference.id),
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      };
    } catch (error) {
      console.error("[MP] Failed to create preference:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Public Action: Create a Checkout Preference for a booking
 * Called from frontend booking forms
 */
export const createCheckoutPreferenceForBooking = action({
  args: {
    bookingId: v.string(),
    assetType: assetTypeValidator,
    originalAmount: v.optional(v.number()),
    finalAmount: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    couponCode: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.string(),
    preferenceUrl: v.string(),
    initPoint: v.optional(v.string()),
    sandboxInitPoint: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get booking details
      const booking = await ctx.runQuery(internal.domains.bookings.checkout.getBookingForCheckout, {
        bookingId: args.bookingId,
        assetType: args.assetType,
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Calculate amounts
      const finalAmount = args.finalAmount ?? booking.totalPrice;

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
      
      // Log what we're using
      console.log("[MP] Final URLs:", {
        original: { success: args.successUrl, cancel: args.cancelUrl },
        final: { success: successUrl, failure: failureUrl, pending: pendingUrl }
      });

      // Webhook URL
      const siteUrl = process.env.CONVEX_SITE_URL || "";
      const notificationUrl = siteUrl ? `${siteUrl}/mercadopago/webhook` : undefined;

      // Log URLs for debugging
      console.log("[MP] Creating preference with URLs:", {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl,
      });

      // Create preference with MANUAL capture mode (authorization only)
      const result = await ctx.runAction(internal.domains.mercadoPago.actions.createCheckoutPreference, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        title: booking.assetName,
        quantity: 1,
        unitPrice: finalAmount,
        currency: args.currency || "BRL",
        backUrls: {
          success: successUrl,
          pending: pendingUrl,
          failure: failureUrl,
        },
        notificationUrl,
        captureMode: "manual", // Always use manual capture - require admin approval
        metadata: {
          assetId: String(booking.assetId),
          userId: String(booking.userId),
          bookingId: String(args.bookingId),
          confirmationCode: booking.confirmationCode,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create preference");
      }

      // Return preference URL for redirect
      const checkoutUrl = result.initPoint || 
                         result.sandboxInitPoint || 
                         `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${result.id}`;

      return {
        success: true,
        preferenceId: result.id || "",
        preferenceUrl: checkoutUrl,
        initPoint: result.initPoint,
        sandboxInitPoint: result.sandboxInitPoint,
      };
    } catch (error) {
      console.error("[MP] Failed to create checkout preference:", error);
      return {
        success: false,
        preferenceId: "",
        preferenceUrl: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a direct payment with manual capture (authorization only)
 * This is the CORRECT way to implement manual capture with Mercado Pago
 * Uses the Payments API with capture=false parameter
 */
export const createPaymentWithManualCapture = action({
  args: {
    bookingId: v.string(),
    assetType: assetTypeValidator,
    token: v.optional(v.string()),
    paymentMethodId: v.optional(v.string()), // Optional - MP Brick doesn't always provide it initially
    issuerId: v.optional(v.string()),
    amount: v.number(),
    installments: v.number(),
    payer: v.optional(v.object({
      email: v.string(),
      identification: v.optional(v.object({
        type: v.string(),
        number: v.string()
      }))
    })),
    description: v.string(),
    metadata: v.optional(v.any())
  },
  returns: v.object({
    success: v.boolean(),
    paymentId: v.optional(v.string()),
    status: v.optional(v.string()),
    statusDetail: v.optional(v.string()),
    requiresManualCapture: v.optional(v.boolean()),
    pixQrCode: v.optional(v.string()),
    pixQrCodeBase64: v.optional(v.string()),
    boletoUrl: v.optional(v.string()),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    try {
      console.log("[MP] Creating payment with MANUAL capture for booking:", args.bookingId);
      console.log("[MP] Args received:", {
        paymentMethodId: args.paymentMethodId,
        token: args.token ? "present" : "missing",
        payer: args.payer ? "present" : "missing"
      });

      // Validate required fields for MP API
      if (!args.paymentMethodId) {
        console.error("[MP] Missing paymentMethodId - cannot proceed");
        return {
          success: false,
          error: "Método de pagamento não identificado. Por favor, selecione um método de pagamento válido.",
          status: "error"
        };
      }

      // Determine if this payment method supports manual capture
      // Only credit cards support capture=false (authorization)
      // PIX, boleto, bank transfers require immediate capture
      const creditCardMethods = ['visa', 'master', 'amex', 'elo', 'hipercard', 'diners', 'discover'];
      const isCreditCard = creditCardMethods.includes(args.paymentMethodId.toLowerCase());
      
      // Create payment body
      const paymentBody: any = {
        transaction_amount: args.amount,
        payment_method_id: args.paymentMethodId,
        installments: args.installments,
        description: args.description,
        metadata: {
          bookingId: args.bookingId,
          assetType: args.assetType,
          ...(args.metadata || {})
        }
      };

      // Only add capture=false for credit cards (manual capture)
      // Other methods (PIX, boleto, etc) don't support it
      if (isCreditCard) {
        paymentBody.capture = false;  // Manual capture for credit cards
        console.log("[MP] Using MANUAL capture (authorization only) for credit card");
      } else {
        console.log("[MP] Using IMMEDIATE capture for", args.paymentMethodId);
      }

      // Add optional fields if provided
      if (args.token) {
        paymentBody.token = args.token;
      }
      
      if (args.payer) {
        paymentBody.payer = args.payer;
      }

      // Add issuer if provided (required for some payment methods)
      if (args.issuerId) {
        paymentBody.issuer_id = args.issuerId;
      }

      console.log("[MP] Payment body prepared:", {
        ...paymentBody,
        token: paymentBody.token ? "***" : undefined
      });

      // Generate idempotency key to prevent duplicate payments
      const idempotencyKey = `${args.bookingId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log("[MP] Generated idempotency key:", idempotencyKey);

      if (!idempotencyKey) {
        throw new Error("Failed to generate idempotency key");
      }

      // Call Mercado Pago Payments API
      const payment = await mpFetch<any>('/v1/payments', {
        method: 'POST',
        headers: {
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(paymentBody)
      });

      console.log("[MP] Payment created:", {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        captured: payment.captured,
        isCreditCard: isCreditCard,
        paymentMethodId: args.paymentMethodId,
        hasTransactionData: !!payment.point_of_interaction?.transaction_data
      });

      // Extract PIX/boleto specific data
      let pixQrCode = undefined;
      let pixQrCodeBase64 = undefined;
      let boletoUrl = undefined;
      
      if (payment.point_of_interaction?.transaction_data) {
        const transactionData = payment.point_of_interaction.transaction_data;
        
        // PIX data
        if (transactionData.qr_code) {
          pixQrCode = transactionData.qr_code;
          console.log("[MP] PIX QR code generated");
        }
        if (transactionData.qr_code_base64) {
          pixQrCodeBase64 = transactionData.qr_code_base64;
          console.log("[MP] PIX QR code base64 generated");
        }
        
        // Boleto URL
        if (transactionData.ticket_url) {
          boletoUrl = transactionData.ticket_url;
          console.log("[MP] Boleto URL generated:", boletoUrl);
        }
      }

      // Map MP status to our internal status
      // For credit cards with manual capture: authorized -> needs admin approval
      // For PIX/boleto/etc with immediate capture: approved -> paid immediately
      const statusMap: Record<string, string> = {
        authorized: "authorized",  // Credit card - awaiting capture
        approved: isCreditCard ? "paid" : "paid",  // Approved and captured
        in_process: "processing",  // Payment being processed
        pending: "pending",        // PIX waiting payment, boleto generated
        rejected: "failed",
        cancelled: "cancelled"
      };

      const paymentStatus = statusMap[payment.status] || payment.status;

      // Update booking with payment info
      await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingMpInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        mpPaymentId: String(payment.id),
        paymentStatus: paymentStatus
      });

      // Update booking status based on payment result
      if (payment.status === "authorized") {
        // Credit card authorized - awaiting admin approval
        await ctx.runMutation(internal.domains.bookings.mutations.updateBookingStatusInternal, {
          bookingId: args.bookingId,
          assetType: args.assetType,
          status: "awaiting_confirmation",
          paymentStatus: "authorized"
        });
      } else if (payment.status === "approved") {
        // Payment approved immediately (PIX paid, card captured, etc)
        await ctx.runMutation(internal.domains.bookings.mutations.updateBookingStatusInternal, {
          bookingId: args.bookingId,
          assetType: args.assetType,
          status: "confirmed",
          paymentStatus: "paid"
        });
      }

      return {
        success: true,
        paymentId: String(payment.id),
        status: payment.status,
        statusDetail: payment.status_detail,
        requiresManualCapture: isCreditCard && payment.status === "authorized",
        pixQrCode: pixQrCode,
        pixQrCodeBase64: pixQrCodeBase64,
        boletoUrl: boletoUrl
      };

    } catch (error) {
      console.error("[MP] Failed to create payment with manual capture:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
});


/**
 * Capture an authorized payment and update booking status
 */
export const capturePayment = internalAction({
  args: {
    paymentId: v.string(),
    amount: v.optional(v.number()),
    bookingId: v.optional(v.union(
      v.id("activityBookings"),
      v.id("eventBookings"),
      v.id("restaurantReservations"),
      v.id("vehicleBookings")
    )),
    assetType: v.optional(v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle")
    )),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log(`[MP CAPTURE] Capturing payment ${args.paymentId}`);
      
      const body: any = { capture: true };
      if (args.amount) {
        body.transaction_amount = args.amount;
      }
      
      // X-Idempotency-Key prevents duplicate capture attempts
      const res = await mpFetch<any>(`/v1/payments/${args.paymentId}`, {
        method: "PUT",
        headers: {
          "X-Idempotency-Key": `capture-${args.paymentId}-${Date.now()}`,
        },
        body: JSON.stringify(body),
      });
      
      console.log(`[MP CAPTURE] Payment captured successfully, status: ${res.status}`);
      
      // Update booking payment status to paid if bookingId provided
      if (args.bookingId && args.assetType) {
        const tableName = 
          args.assetType === "activity" ? "activityBookings" :
          args.assetType === "event" ? "eventBookings" :
          args.assetType === "restaurant" ? "restaurantReservations" :
          "vehicleBookings";
        
        await ctx.runMutation(internal.domains.bookings.mutations.updateBookingStatusInternal, {
          bookingId: args.bookingId,
          assetType: args.assetType,
          paymentStatus: "paid",
        });
        
        console.log(`[MP CAPTURE] Updated ${args.assetType} booking ${args.bookingId} to paid`);
      }
      
      return { success: true, status: res.status };
    } catch (error) {
      console.error("[MP] Failed to capture payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Cancel a payment
 */
export const cancelPayment = internalAction({
  args: {
    paymentId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    try {
      // X-Idempotency-Key prevents duplicate cancellation attempts
      const res = await mpFetch<any>(`/v1/payments/${args.paymentId}`, {
        method: "PUT",
        headers: {
          "X-Idempotency-Key": `cancel-${args.paymentId}-${Date.now()}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      return { success: true, status: res.status };
    } catch (error) {
      console.error("[MP] Failed to cancel payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Refund a payment
 */
export const refundPayment = internalAction({
  args: {
    paymentId: v.string(),
    amount: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    refundId: v.optional(v.union(v.string(), v.number())),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // X-Idempotency-Key prevents duplicate refund creation
      const res = await mpFetch<any>(`/v1/payments/${args.paymentId}/refunds`, {
        method: "POST",
        headers: {
          "X-Idempotency-Key": `refund-${args.paymentId}-${Date.now()}`,
        },
        body: JSON.stringify({ 
          amount: args.amount, 
          reason: args.reason 
        }),
      });

      if (res.metadata?.bookingId) {
        await ctx.runMutation(internal.domains.mercadoPago.mutations.addRefundToBooking, {
          bookingId: String(res.metadata.bookingId),
          refundId: res.id,
          amount: res.amount || args.amount || 0,
          reason: args.reason,
          status: res.status || "succeeded",
        });
      }

      return { success: true, refundId: res.id };
    } catch (error) {
      console.error("[MP] Failed to refund payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});


/**
 * Approve a booking and capture payment
 */
export const approveBookingAndCapturePayment = action({
  args: {
    bookingId: v.string(),
    assetType: assetTypeValidator,
    partnerNotes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // First, get the booking to find the payment info
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "vehicleBookings",
      "packageBookings"
    ];

    let booking: any;
    for (const tableName of tables) {
      booking = await ctx.runQuery(internal.domains.bookings.queries.getBookingByIdInternal, {
        bookingId: args.bookingId,
        tableName: tableName,
      });
      if (booking) break;
    }

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    try {
      let finalPaymentStatus = booking.paymentStatus;

      // Capturar pagamento Mercado Pago autorizado
      if (booking.mpPaymentId) {
        // Verificar se é um pagamento que precisa de captura (autorizado)
        if (booking.paymentStatus === "authorized" || booking.paymentStatus === "pending") {
          console.log(`Capturing MP payment ${booking.mpPaymentId} for booking ${args.bookingId}`);
          
          const captureResult = await ctx.runAction(internal.domains.mercadoPago.actions.capturePayment, {
            paymentId: booking.mpPaymentId,
          });

          if (!captureResult.success) {
            console.error(`Failed to capture payment ${booking.mpPaymentId}:`, captureResult.error);
            return { success: false, error: `Falha ao capturar pagamento: ${captureResult.error}` };
          }
          
          finalPaymentStatus = "paid";
          console.log(`Payment ${booking.mpPaymentId} captured successfully`);
        } else if (booking.paymentStatus === "paid") {
          // Pagamento já foi capturado anteriormente
          finalPaymentStatus = "paid";
        } else {
          return { success: false, error: `Status de pagamento inválido para captura: ${booking.paymentStatus}` };
        }
      }

      // Atualizar status da reserva para confirmado APENAS após captura bem-sucedida
      await ctx.runMutation(internal.domains.bookings.mutations.updateBookingStatusInternal, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        status: "confirmed",
        paymentStatus: finalPaymentStatus,
        partnerNotes: args.partnerNotes,
      });

      // Generate voucher for confirmed booking
      try {
        await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucherInternal, {
          bookingId: args.bookingId,
          bookingType: args.assetType,
        });
      } catch (voucherError) {
        console.error("Failed to generate voucher:", voucherError);
      }

      // Send confirmation email ONLY after admin approval and successful payment capture
      try {
        console.log(`[MP] Sending confirmation email for approved booking ${args.bookingId}`);
        await ctx.runAction(internal.domains.email.actions.sendBookingConfirmationEmailById, {
          bookingId: args.bookingId,
          bookingType: args.assetType,
        });
        console.log(`[MP] Confirmation email sent successfully for booking ${args.bookingId}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the entire approval if email fails
      }

      return { success: true };
    } catch (error) {
      console.error("Error approving booking:", error);
      return { success: false, error: "Failed to approve booking" };
    }
  },
});

/**
 * Reject a booking and cancel/refund payment
 */
export const rejectBookingAndCancelPayment = action({
  args: {
    bookingId: v.string(),
    assetType: assetTypeValidator,
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // First, get the booking to find the payment info
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "vehicleBookings",
      "packageBookings"
    ];

    let booking: any;
    for (const tableName of tables) {
      booking = await ctx.runQuery(internal.domains.bookings.queries.getBookingByIdInternal, {
        bookingId: args.bookingId,
        tableName: tableName,
      });
      if (booking) break;
    }

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    try {
      // Processar cancelamento/estorno do pagamento Mercado Pago
      if (booking.mpPaymentId) {
        if (booking.paymentStatus === "authorized" || booking.paymentStatus === "pending") {
          // Cancelar pagamento autorizado (libera valor no cartão sem cobrança)
          console.log(`Canceling authorized payment ${booking.mpPaymentId} for booking ${args.bookingId}`);
          
          const cancelResult = await ctx.runAction(internal.domains.mercadoPago.actions.cancelPayment, {
            paymentId: booking.mpPaymentId,
          });

          if (!cancelResult.success) {
            console.error("Failed to cancel authorized payment:", cancelResult.error);
          } else {
            console.log(`Authorized payment ${booking.mpPaymentId} cancelled successfully`);
          }
        } else if (booking.paymentStatus === "paid" || booking.paymentStatus === "succeeded") {
          // Refund the payment
          const refundResult = await ctx.runAction(internal.domains.mercadoPago.actions.refundPayment, {
            paymentId: booking.mpPaymentId,
          });

          if (!refundResult.success) {
            console.error("Failed to refund payment:", refundResult.error);
          }
        }
      }

      // Update booking status to canceled
      await ctx.runMutation(internal.domains.bookings.mutations.updateBookingStatusInternal, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        status: "canceled",
        paymentStatus: "refunded",
        partnerNotes: args.reason,
      });

      // Send cancellation email
      try {
        await ctx.runAction(internal.domains.email.actions.sendBookingCancelledEmail, {
          bookingId: args.bookingId,
          bookingType: args.assetType,
          reason: args.reason,
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }

      return { success: true };
    } catch (error) {
      console.error("Error rejecting booking:", error);
      return { success: false, error: "Failed to reject booking" };
    }
  },
});

/**
 * Process Mercado Pago webhook events
 */
export const processWebhookEvent = internalAction({
  args: {
    id: v.optional(v.union(v.string(), v.number())),
    type: v.optional(v.string()),
    action: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const eventId = args.id != null ? String(args.id) : undefined;

      if (eventId == null) {
        return { success: false, processed: false, error: "Missing event id" };
      }

      // Idempotency check
      const existing = await ctx.runQuery(internal.domains.mercadoPago.queries.getWebhookEvent, {
        mpEventId: eventId!,
      });
      if (existing && existing.processed) {
        return { success: true, processed: true };
      }

      // Store event minimally
      await ctx.runMutation(internal.domains.mercadoPago.mutations.storeWebhookEvent, {
        mpEventId: eventId!,
        type: args.type,
        action: args.action,
        eventData: args.data || {},
      });

      // If payment notification, fetch full payment details
      // Following MP best practices: first acknowledge receipt, then fetch payment details
      if ((args.type === "payment" || args.action?.startsWith("payment.")) && args.data && args.data.id) {
        const paymentId = args.data.id;
        
        console.log(`[MP] Processing payment notification for payment ID: ${paymentId}`);
        
        // Handle test payments gracefully - they may not exist in MP API
        let payment: any = null;
        try {
          payment = await mpFetch<any>(`/v1/payments/${paymentId}`);
          console.log(`[MP] Payment ${paymentId} fetched successfully, status: ${payment.status}`);
        } catch (error) {
          console.warn(`[MP] Payment ${paymentId} not found (likely test payment):`, error instanceof Error ? error.message : String(error));
          // For test payments or non-existent payments, still mark webhook as processed
          return { success: true, processed: true };
        }

        const bookingId = payment.metadata?.bookingId;
        const assetType = payment.metadata?.assetType as any;
        const assetId = payment.metadata?.assetId ? String(payment.metadata.assetId) : undefined;

        if (bookingId) {
          console.log(`[MP] Updating booking ${bookingId} with payment status: ${payment.status}`);
          
          await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingPaymentStatus, {
            bookingId: String(bookingId),
            paymentStatus: payment.status,
            paymentId: String(payment.id),
            receiptUrl: payment.receipt_url || undefined,
          });

          if (assetType) {
            await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingMpInfo, {
              bookingId: String(bookingId),
              assetType,
              mpPaymentId: String(payment.id),
            });
          }

          // Enrich stored webhook event with relations for easier querying
          await ctx.runMutation(internal.domains.mercadoPago.mutations.updateWebhookEventRelations, {
            mpEventId: String(eventId),
            relatedBookingId: String(bookingId),
            relatedAssetType: assetType ? String(assetType) : undefined,
            relatedAssetId: assetId,
          });
          
          console.log(`[MP] Booking ${bookingId} updated successfully`);
        } else {
          console.warn(`[MP] Payment ${paymentId} has no associated bookingId in metadata`);
        }
      }

      await ctx.runMutation(internal.domains.mercadoPago.mutations.markWebhookEventProcessed, {
        mpEventId: eventId!,
      });

      return { success: true, processed: true };
    } catch (error) {
      console.error("[MP] Failed to process webhook:", error);
      if (args.id != null) {
        await ctx.runMutation(internal.domains.mercadoPago.mutations.addWebhookEventError, {
          mpEventId: String(args.id),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return { success: false, processed: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});
