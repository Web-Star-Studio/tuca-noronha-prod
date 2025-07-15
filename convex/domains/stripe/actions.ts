"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "../../_generated/api";

import {
  createStripeProductValidator,
  createCheckoutSessionValidator,
  createRefundValidator,
  processWebhookValidator,
  createStripeCustomerValidator,
  createPaymentLinkValidator,
} from "./types";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

/**
 * Create a Stripe product for an asset
 * Called when a new asset is created or when enabling Stripe payments
 */
export const createStripeProduct = internalAction({
  args: createStripeProductValidator,
  returns: v.object({
    productId: v.string(),
    priceId: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: args.name,
        description: args.description,
        images: args.imageUrl ? [args.imageUrl] : undefined,
        metadata: {
          assetId: args.assetId,
          assetType: args.assetType,
          partnerId: args.metadata?.partnerId || "",
          convexOrigin: "true",
        },
      });

      // Create price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: args.unitAmount,
        currency: args.currency || "brl",
        metadata: {
          assetId: args.assetId,
          assetType: args.assetType,
        },
      });

      return {
        productId: product.id,
        priceId: price.id,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create Stripe product:", error);
      return {
        productId: "",
        priceId: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a Stripe Payment Link for an asset
 */
export const createStripePaymentLink = internalAction({
  args: createPaymentLinkValidator,
  returns: v.object({
    paymentLinkId: v.string(),
    paymentLinkUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      let stripePriceId = args.stripePriceId;
      
      // If no price ID provided, get from asset
      if (!stripePriceId) {
        const asset = await ctx.runQuery(internal.domains.stripe.queries.getAssetStripeInfo, {
          assetId: args.assetId,
          assetType: args.assetType,
        });

        if (!asset?.stripePriceId) {
          throw new Error("Asset does not have a Stripe price configured and no price ID provided");
        }
        
        stripePriceId = asset.stripePriceId;
      }

      // Final check to ensure stripePriceId is not undefined
      if (!stripePriceId) {
        throw new Error("Unable to determine Stripe price ID for payment link creation");
      }

      // Create payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        after_completion: args.afterCompletion || {
          type: "redirect",
          redirect: {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
          },
        },
        metadata: {
          assetId: args.assetId,
          assetType: args.assetType,
          convexOrigin: "true",
        },
      });

      return {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create Stripe payment link:", error);
      return {
        paymentLinkId: "",
        paymentLinkUrl: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a Stripe Checkout Session for a booking
 */
export const createCheckoutSession = action({
  args: createCheckoutSessionValidator,
  returns: v.object({
    sessionId: v.string(),
    sessionUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get booking details to determine pricing
      const booking = await ctx.runQuery(internal.domains.stripe.queries.getBookingForCheckout, {
        bookingId: args.bookingId,
        assetType: args.assetType,
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Get or create Stripe customer
      const customer = await ctx.runAction(internal.domains.stripe.actions.getOrCreateStripeCustomer, {
        userId: booking.userId,
        email: args.customerEmail || booking.customerInfo.email,
        name: booking.customerInfo.name,
      });

      // Determine final pricing with coupon consideration
      const originalAmount = args.originalAmount || booking.totalPrice;
      const finalAmount = args.finalAmount || booking.totalPrice;
      const discountAmount = args.discountAmount || 0;
      const hasCoupon = args.couponCode && discountAmount > 0;

      // Get partner information for Direct Charges
      let stripeAccountId: string | undefined;
      let applicationFeeAmount: number | undefined;
      
      // Get asset owner ID based on asset type
      let assetOwnerId: string | undefined;
      
      switch (args.assetType) {
        case "activity":
        case "event":
        case "restaurant":
        case "accommodation":
        case "package":
          assetOwnerId = booking.asset?.partnerId;
          break;
        case "vehicle":
          assetOwnerId = booking.asset?.ownerId;
          break;
      }

      if (assetOwnerId) {
        // Look up partner information
        const partner = await ctx.runQuery(internal.domains.partners.queries.getPartnerByUserId, {
          userId: assetOwnerId,
        });

        if (partner && partner.stripeAccountId && partner.onboardingStatus === "completed") {
          stripeAccountId = partner.stripeAccountId;
          
          // Calculate application fee based on partner's fee percentage
          applicationFeeAmount = Math.floor(finalAmount * (partner.feePercentage / 100));
          
          console.log(`🔍 Using Direct Charge for partner:`, {
            partnerId: partner._id,
            stripeAccountId,
            feePercentage: partner.feePercentage,
            applicationFeeAmount,
            finalAmount,
          });
        } else {
          console.log(`⚠️ Partner not found or not onboarded for asset owner:`, assetOwnerId);
        }
      }

      // Create checkout session
      console.log(`🔍 Creating checkout session for ${args.assetType}:`, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        originalAmount,
        finalAmount,
        discountAmount,
        couponCode: args.couponCode,
        assetName: booking.assetName,
        userId: booking.userId,
        assetId: booking.assetId,
        stripeAccountId,
        applicationFeeAmount,
      });

      // Create product and price in Stripe
      const productName = `${booking.assetName || "Service"} - ${args.assetType}`;
      const productDescription = hasCoupon ? 
        `Reserva com desconto aplicado (Cupom: ${args.couponCode})` :
        `Reserva ${args.assetType}`;

      const product = await stripe.products.create({
        name: productName,
        description: productDescription,
        metadata: {
          bookingId: args.bookingId,
          assetType: args.assetType,
          assetId: booking.assetId,
          convexOrigin: "true",
        },
      }, stripeAccountId ? { stripeAccount: stripeAccountId } : {});

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: finalAmount,
        currency: args.currency || "brl",
      }, stripeAccountId ? { stripeAccount: stripeAccountId } : {});

      const lineItems = [{
        price: price.id,
        quantity: 1,
      }];

      // If there's a coupon, add it to metadata but don't create separate line item
      // Stripe will handle the discount through the adjusted unit_amount above
      
      const sessionParams: any = {
        customer: customer.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        allow_promotion_codes: args.allowPromotionCodes || false,
        metadata: {
          bookingId: args.bookingId,
          userId: booking.userId,
          assetType: args.assetType,
          assetId: booking.assetId,
          convexOrigin: "true",
          ...(hasCoupon && {
            couponCode: args.couponCode,
            originalAmount: originalAmount.toString(),
            discountAmount: discountAmount.toString(),
            finalAmount: finalAmount.toString(),
          }),
          ...(stripeAccountId && {
            partnerId: assetOwnerId,
            partnerStripeAccountId: stripeAccountId,
          }),
        },
        payment_intent_data: {
          capture_method: 'manual',
          metadata: {
            bookingId: args.bookingId,
            assetType: args.assetType,
            ...(hasCoupon && {
              couponCode: args.couponCode,
              discountAmount: discountAmount.toString(),
            }),
            ...(stripeAccountId && {
              partnerId: assetOwnerId,
              partnerStripeAccountId: stripeAccountId,
            }),
          },
        },
      };

      // Add Direct Charge configuration if partner is onboarded
      if (stripeAccountId && applicationFeeAmount) {
        sessionParams.payment_intent_data.application_fee_amount = applicationFeeAmount;
        sessionParams.payment_intent_data.on_behalf_of = stripeAccountId;
        sessionParams.payment_intent_data.transfer_data = {
          destination: stripeAccountId,
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      console.log(`✅ Checkout session created for ${args.assetType}:`, {
        sessionId: session.id,
        sessionUrl: session.url,
        metadata: session.metadata,
        isDirectCharge: !!stripeAccountId,
      });

      // Update booking with checkout session ID
      console.log(`🔍 Updating booking Stripe info for ${args.assetType}:`, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: customer.stripeCustomerId,
        paymentStatus: "requires_capture"
      });
      
      await ctx.runMutation(internal.domains.stripe.mutations.updateBookingStripeInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: customer.stripeCustomerId,
        paymentStatus: "requires_capture",
      });
      
      console.log(`✅ Successfully updated booking Stripe info for ${args.assetType}`);
      
      // For debugging: Let's also check the booking status after checkout session creation
      try {
        const updatedBooking = await ctx.runQuery(internal.domains.stripe.queries.getBookingForCheckout, {
          bookingId: args.bookingId,
          assetType: args.assetType,
        });
        
        console.log(`📝 Booking status after checkout session creation:`, {
          bookingId: args.bookingId,
          assetType: args.assetType,
          paymentStatus: updatedBooking?.paymentStatus
        });
      } catch (debugError) {
        console.error(`❌ Error getting booking for debug:`, debugError);
      }

      return {
        sessionId: session.id,
        sessionUrl: session.url || "",
        success: true,
      };
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      return {
        sessionId: "",
        sessionUrl: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Get or create a Stripe customer for a user
 */
export const getOrCreateStripeCustomer = internalAction({
  args: createStripeCustomerValidator,
  returns: v.object({
    stripeCustomerId: v.string(),
    isNew: v.boolean(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check if customer already exists in our database
      const existingCustomer = await ctx.runQuery(internal.domains.stripe.queries.getStripeCustomerByUserId, {
        userId: args.userId,
      });

      if (existingCustomer) {
        return {
          stripeCustomerId: existingCustomer.stripeCustomerId,
          isNew: false,
          success: true,
        };
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: args.email,
        name: args.name,
        phone: args.phone,
        metadata: {
          userId: args.userId,
          source: args.metadata?.source || "convex_app",
          userRole: args.metadata?.userRole || "traveler",
        },
      });

      // Store customer in our database
      await ctx.runMutation(internal.domains.stripe.mutations.createStripeCustomer, {
        userId: args.userId,
        stripeCustomerId: customer.id,
        email: args.email,
        name: args.name,
        phone: args.phone,
        metadata: args.metadata,
      });

      return {
        stripeCustomerId: customer.id,
        isNew: true,
        success: true,
      };
    } catch (error) {
      console.error("Failed to get or create Stripe customer:", error);
      return {
        stripeCustomerId: "",
        isNew: false,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a refund for a booking
 */
export const createRefund = internalAction({
  args: createRefundValidator,
  returns: v.object({
    refundId: v.string(),
    amount: v.number(),
    status: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get booking payment information
      const bookingPayment = await ctx.runQuery(internal.domains.stripe.queries.getBookingPaymentInfo, {
        bookingId: args.bookingId,
      });

      if (!bookingPayment?.stripePaymentIntentId) {
        throw new Error("No payment intent found for this booking");
      }

      // Map reason to valid Stripe reasons
      let stripeReason: "duplicate" | "fraudulent" | "requested_by_customer" | undefined;
      switch (args.reason) {
        case "duplicate":
          stripeReason = "duplicate";
          break;
        case "fraudulent":
          stripeReason = "fraudulent";
          break;
        case "partner_cancelled":
        case "requested_by_customer":
          stripeReason = "requested_by_customer";
          break;
        default:
          stripeReason = undefined; // Let Stripe determine
      }

      // Create refund
      const refund = await stripe.refunds.create({
        payment_intent: bookingPayment.stripePaymentIntentId,
        amount: args.amount, // If undefined, Stripe will refund the full amount
        reason: stripeReason,
        metadata: {
          bookingId: args.bookingId,
          cancelledBy: args.metadata?.cancelledBy || "system",
          cancellationReason: args.metadata?.cancellationReason || args.reason,
        },
      });

      // Update booking with refund information
      await ctx.runMutation(internal.domains.stripe.mutations.addRefundToBooking, {
        bookingId: args.bookingId,
        refundId: refund.id,
        amount: refund.amount,
        reason: args.reason,
        status: refund.status || "pending", // Ensure status is never null
      });

      // Process partner transaction refund if applicable
      if (bookingPayment.stripePaymentIntentId) {
        try {
          await ctx.runMutation(internal.domains.partners.mutations.processPartnerTransactionRefund, {
            stripePaymentIntentId: bookingPayment.stripePaymentIntentId,
            refundAmount: refund.amount,
            refundId: refund.id,
            reason: args.reason,
          });
          console.log("✅ Partner transaction refund processed successfully");
        } catch (error) {
          console.error("Failed to process partner transaction refund:", error);
          // Don't fail the main refund if partner transaction update fails
        }
      }

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status || "pending", // Ensure status is never null
        success: true,
      };
    } catch (error) {
      console.error("Failed to create refund:", error);
      return {
        refundId: "",
        amount: 0,
        status: "failed",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Process Stripe webhook events
 */
export const processWebhookEvent = internalAction({
  args: processWebhookValidator,
  returns: v.object({
    success: v.boolean(),
    processed: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check if event was already processed (idempotency)
      const existingEvent = await ctx.runQuery(internal.domains.stripe.queries.getWebhookEvent, {
        eventId: args.eventId,
      });

      if (existingEvent && existingEvent.processed) {
        return {
          success: true,
          processed: true,
        };
      }

      // Store webhook event
      await ctx.runMutation(internal.domains.stripe.mutations.storeWebhookEvent, {
        eventId: args.eventId,
        eventType: args.eventType,
        livemode: args.livemode,
        eventData: args.data,
      });

      // Process event based on type
      switch (args.eventType) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(ctx, args.data);
          break;
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(ctx, args.data);
          break;
        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(ctx, args.data);
          break;
        case "payment_intent.canceled":
          await handlePaymentIntentCanceled(ctx, args.data);
          break;
        case "payment_intent.requires_action":
          await handlePaymentIntentRequiresAction(ctx, args.data);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionEvent(ctx, args.eventType, args.data);
          break;
        case "invoice.paid":
        case "invoice.payment_succeeded":
        case "invoice.payment_failed":
          await handleInvoiceEvent(ctx, args.eventType, args.data);
          break;
        // Stripe Connect events
        case "account.updated":
        case "account.application.deauthorized":
        case "application_fee.created":
        case "transfer.created":
        case "transfer.updated":
          await handleConnectEvent(ctx, args.eventType, args.data);
          break;
        default:
          console.log(`Unhandled webhook event type: ${args.eventType}`);
      }

      // Mark event as processed
      await ctx.runMutation(internal.domains.stripe.mutations.markWebhookEventProcessed, {
        eventId: args.eventId,
      });

      return {
        success: true,
        processed: true,
      };
    } catch (error) {
      console.error("Failed to process webhook event:", error);
      
      // Store error for debugging
      await ctx.runMutation(internal.domains.stripe.mutations.addWebhookEventError, {
        eventId: args.eventId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Helper functions for webhook processing
async function handleCheckoutSessionCompleted(ctx: any, sessionData: any) {
  const { metadata } = sessionData;
  
  // Handle guide subscription checkout
  if (metadata?.type === "guide_subscription") {
    console.log("Processing guide subscription checkout:", sessionData.id);
    
    // Get subscription ID from the session
    const subscription = sessionData.subscription;
    if (subscription) {
      // Fetch full subscription details from Stripe
      const stripe = new (require("stripe"))(process.env.STRIPE_SECRET_KEY);
      const subscriptionData = await stripe.subscriptions.retrieve(subscription);
      
      // Process subscription creation
      await ctx.runAction(internal.domains.subscriptions.actions.processSubscriptionWebhook, {
        eventType: "customer.subscription.created",
        subscription: subscriptionData,
      });
      
      // Also process the initial invoice payment
      if (sessionData.invoice) {
        const invoiceData = await stripe.invoices.retrieve(sessionData.invoice);
        await ctx.runAction(internal.domains.subscriptions.actions.processInvoiceWebhook, {
          eventType: "invoice.paid",
          invoice: invoiceData,
        });
      }
    }
    
    console.log("Guide subscription checkout processed successfully");
  }
  // Handle booking checkout
  else if (metadata?.bookingId) {
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "succeeded",
      stripePaymentIntentId: sessionData.payment_intent,
      receiptUrl: sessionData.receipt_url,
    });

    // Get booking details for notification
    const booking = await ctx.runQuery(internal["domains/stripe/bookingQueries"].getBookingById, {
      bookingId: metadata.bookingId,
      tableName: `${metadata.assetType}Bookings`,
    });

    if (booking) {
      // Get asset name for notification
      let assetName = "Serviço";
      try {
        switch (metadata.assetType) {
          case "activity":
            if (booking.activityId) {
              const activity = await ctx.runQuery(internal.domains.activities.queries.getById, {
                id: booking.activityId,
              });
              assetName = activity?.title || "Atividade";
            }
            break;
          case "event":
            if (booking.eventId) {
              const event = await ctx.runQuery(internal.domains.events.queries.getById, {
                id: booking.eventId,
              });
              assetName = event?.title || "Evento";
            }
            break;
          case "restaurant":
            if (booking.restaurantId) {
              const restaurant = await ctx.runQuery(internal.domains.restaurants.queries.getById, {
                id: booking.restaurantId,
              });
              assetName = restaurant?.name || "Restaurante";
            }
            break;
          case "vehicle":
            if (booking.vehicleId) {
              const vehicle = await ctx.runQuery(internal.domains.vehicles.queries.getById, {
                id: booking.vehicleId,
              });
              assetName = vehicle?.name || "Veículo";
            }
            break;
          case "accommodation":
            if (booking.accommodationId) {
              const accommodation = await ctx.runQuery(internal.domains.accommodations.queries.getById, {
                id: booking.accommodationId,
              });
              assetName = accommodation?.name || "Hospedagem";
            }
            break;
          case "package":
            if (booking.packageId) {
              const packageData = await ctx.runQuery(internal.domains.packages.queries.getById, {
                id: booking.packageId,
              });
              assetName = packageData?.name || "Pacote";
            }
            break;
        }
      } catch (error) {
        console.error("Error getting asset name for notification:", error);
      }

      // Send confirmation email to the customer
      await ctx.runAction(internal.domains.email.actions.sendBookingConfirmationEmail, {
        customerEmail: booking.customerInfo?.email || booking.email || "",
        customerName: booking.customerInfo?.name || booking.name || "",
        assetName,
        bookingType: metadata.assetType,
        confirmationCode: booking.confirmationCode || "",
        bookingDate: booking.date,
        totalPrice: booking.totalPrice,
        bookingDetails: {
          bookingId: metadata.bookingId,
          assetId: metadata.assetId,
          participants: booking.participants,
          date: booking.date,
          specialRequests: booking.specialRequests,
        },
      });
      
      // Send confirmation email to the partner
      if (booking.partnerId) {
        const partner = await ctx.runQuery(internal.domains.users.queries.get, { id: booking.partnerId });
        if (partner && partner.email) {
          await ctx.runAction(internal.domains.email.actions.sendPartnerNewBookingEmail, {
            partnerEmail: partner.email,
            partnerName: partner.name || "Parceiro",
            customerName: booking.customerInfo?.name || booking.name || "",
            customerEmail: booking.customerInfo?.email || booking.email || "",
            customerPhone: booking.customerInfo?.phone || booking.phone || "",
            assetName,
            bookingType: metadata.assetType,
            confirmationCode: booking.confirmationCode || "",
            bookingDate: booking.date,
            totalPrice: booking.totalPrice,
            bookingDetails: {
              bookingId: metadata.bookingId,
              assetId: metadata.assetId,
              participants: booking.participants,
              date: booking.date,
              specialRequests: booking.specialRequests,
            },
          });
        }
      }

      // Send confirmation email to master admins
      const masterAdmins = await ctx.runQuery(internal.domains.users.queries.listByRole, { role: "master" });
      // Get partner info for master admin notification
      const partnerForAdmin = booking.partnerId ? await ctx.runQuery(internal.domains.users.queries.get, { id: booking.partnerId }) : null;
      for (const admin of masterAdmins) {
        if (admin.email) {
          await ctx.runAction(internal.domains.email.actions.sendPartnerNewBookingEmail, {
            partnerEmail: admin.email,
            partnerName: "Admin Master",
            customerName: booking.customerInfo?.name || booking.name || "",
            customerEmail: booking.customerInfo?.email || booking.email || "",
            customerPhone: booking.customerInfo?.phone || booking.phone || "",
            assetName: `[${metadata.assetType.toUpperCase()}] ${assetName}`,
            bookingType: metadata.assetType,
            confirmationCode: booking.confirmationCode || "",
            bookingDate: booking.date,
            totalPrice: booking.totalPrice,
            bookingDetails: {
              bookingId: metadata.bookingId,
              assetId: metadata.assetId,
              partnerId: booking.partnerId,
              partnerName: partnerForAdmin?.name,
              participants: booking.participants,
              date: booking.date,
              specialRequests: booking.specialRequests,
            },
          });
        }
      }
    }
  }
}

async function handlePaymentIntentSucceeded(ctx: any, paymentIntentData: any) {
  const { metadata } = paymentIntentData;
  
  if (metadata?.bookingId) {
    // Check if this is a captured payment or just authorized
    const paymentStatus = paymentIntentData.status === 'succeeded' && paymentIntentData.amount_received > 0 
      ? "succeeded" 
      : "requires_capture";

    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: paymentStatus,
      stripePaymentIntentId: paymentIntentData.id,
    });

    // Only update booking to confirmed if payment was actually captured
    if (paymentStatus === "succeeded") {
      await ctx.runMutation(internal["domains/bookings/mutations"].updateBookingPaymentSuccess, {
        stripePaymentIntentId: paymentIntentData.id,
        bookingId: metadata.bookingId,
        bookingType: metadata.assetType,
      });
      
      // Update partner transaction if this is a Direct Charge
      if (metadata.partnerId) {
        try {
          const updatedTransactionId = await ctx.runMutation(
            internal.domains.partners.mutations.updatePartnerTransactionStatus, 
            {
              stripePaymentIntentId: paymentIntentData.id,
              status: 'completed',
              stripeTransferId: paymentIntentData.transfer_data?.destination as string | undefined,
            }
          );
          
          // Notify partner about the new transaction
          if (updatedTransactionId) {
            await ctx.runMutation(
              internal.domains.partners.mutations.notifyPartnerNewTransaction,
              {
                transactionId: updatedTransactionId,
              }
            );
          }
        } catch (error) {
          console.error('Error updating partner transaction:', error);
          // Don't fail the webhook - log error for investigation
        }
      }
    }
  }
}

async function handlePaymentIntentFailed(ctx: any, paymentIntentData: any) {
  const { metadata } = paymentIntentData;
  
  if (metadata?.bookingId) {
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "failed",
      stripePaymentIntentId: paymentIntentData.id,
    });
    
    // Handle partner transaction error if applicable
    if (metadata.partnerId) {
      try {
        const transactions = await ctx.runQuery(
          internal.domains.partners.queries.getPartnerTransactionsByPaymentIntent,
          {
            stripePaymentIntentId: paymentIntentData.id,
          }
        );
        
        if (transactions && transactions.length > 0) {
          await ctx.runMutation(
            internal.domains.partners.mutations.handlePartnerTransactionError,
            {
              transactionId: transactions[0]._id,
              error: paymentIntentData.last_payment_error?.message || 'Payment failed',
              shouldReverse: true,
            }
          );
        }
      } catch (error) {
        console.error('Error handling partner transaction failure:', error);
      }
    }
  }
}

async function handlePaymentIntentCanceled(ctx: any, paymentIntentData: any) {
  const { metadata } = paymentIntentData;
  
  if (metadata?.bookingId) {
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "canceled",
      stripePaymentIntentId: paymentIntentData.id,
    });
  }
}

async function handlePaymentIntentRequiresAction(ctx: any, paymentIntentData: any) {
  const { metadata } = paymentIntentData;
  
  if (metadata?.bookingId) {
    // Payment is authorized but requires capture
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "requires_capture",
      stripePaymentIntentId: paymentIntentData.id,
    });
  }
}

async function handleSubscriptionEvent(ctx: any, eventType: string, subscriptionData: any) {
  // Process subscription events for guide subscription
  if (subscriptionData.metadata?.type === "guide_subscription") {
    await ctx.runAction(internal.domains.subscriptions.actions.processSubscriptionWebhook, {
      eventType,
      subscription: subscriptionData,
    });
  }
}

async function handleInvoiceEvent(ctx: any, eventType: string, invoiceData: any) {
  // Process invoice events for guide subscription
  if (invoiceData.subscription) {
    await ctx.runAction(internal.domains.subscriptions.actions.processInvoiceWebhook, {
      eventType,
      invoice: invoiceData,
    });
  }
}

/**
 * Handle Stripe Connect webhook events
 */
async function handleConnectEvent(ctx: any, eventType: string, eventData: any) {
  try {
    // Delegar para o processamento específico de Connect
    await ctx.runAction(internal.domains.partners.actions.processStripeConnectWebhook, {
      event: {
        type: eventType,
        data: {
          object: eventData
        },
        // Se for um evento de conta conectada, o account ID virá no eventData
        account: eventData.id?.startsWith('acct_') ? eventData.id : undefined,
      }
    });
  } catch (error) {
    console.error(`Erro ao processar evento Connect ${eventType}:`, error);
    throw error;
  }
}

/**
 * Capture a payment intent (manual capture)
 * Called when admin approves a booking
 */
export const capturePaymentIntent = internalAction({
  args: {
    paymentIntentId: v.string(),
    amountToCapture: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    paymentIntent: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    try {
      // First, retrieve the payment intent to check if it's a Direct Charge
      const paymentIntent = await stripe.paymentIntents.retrieve(args.paymentIntentId);
      
      const captureParams: any = {};
      if (args.amountToCapture) {
        captureParams.amount_to_capture = args.amountToCapture;
      }

      // If this is a Direct Charge (has transfer_data), handle it appropriately
      let capturedPaymentIntent;
      if (paymentIntent.transfer_data?.destination) {
        console.log(`🔍 Capturing Direct Charge payment intent:`, {
          paymentIntentId: args.paymentIntentId,
          destination: paymentIntent.transfer_data.destination,
          applicationFee: paymentIntent.application_fee_amount,
        });
        
        // For Direct Charges, we need to capture on the platform account
        capturedPaymentIntent = await stripe.paymentIntents.capture(
          args.paymentIntentId,
          captureParams
        );
        
        // Update partner transaction status
        await ctx.runMutation(internal.domains.partners.mutations.updatePartnerTransactionStatus, {
          stripePaymentIntentId: args.paymentIntentId,
          status: 'completed',
        });
      } else {
        // Standard capture for non-Direct Charge payments
        capturedPaymentIntent = await stripe.paymentIntents.capture(
          args.paymentIntentId,
          captureParams
        );
      }

      return {
        success: true,
        paymentIntent: capturedPaymentIntent,
      };
    } catch (error) {
      console.error("Failed to capture payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Cancel a payment intent (manual capture)
 * Called when admin rejects a booking
 */
export const cancelPaymentIntent = internalAction({
  args: {
    paymentIntentId: v.string(),
    cancellationReason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    paymentIntent: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    try {
      // Cancel the payment intent
      const paymentIntent = await stripe.paymentIntents.cancel(
        args.paymentIntentId,
        {
          cancellation_reason: (args.cancellationReason as "duplicate" | "fraudulent" | "requested_by_customer" | "abandoned") || 'requested_by_customer',
        }
      );

      return {
        success: true,
        paymentIntent: paymentIntent,
      };
    } catch (error) {
      console.error("Failed to cancel payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a Payment Link for a specific booking
 * Used when customer wants to pay for an existing booking
 */
export const createPaymentLinkForBooking = action({
  args: v.object({
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("accommodation"),
      v.literal("vehicle")
    ),
    assetId: v.string(),
    totalAmount: v.number(),
    currency: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  }),
  returns: v.object({
    paymentLinkId: v.string(),
    paymentLinkUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log("🔄 createPaymentLinkForBooking started with args:", args);

      // Get booking details
      const booking = await ctx.runQuery(internal.domains.stripe.queries.getBookingForCheckout, {
        bookingId: args.bookingId,
        assetType: args.assetType,
      });

      console.log("📋 Booking details:", booking);

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.paymentStatus === "succeeded") {
        throw new Error("Booking already paid");
      }

      // Get or create Stripe customer
      console.log("👤 Creating/getting Stripe customer for:", {
        userId: booking.userId,
        email: booking.customerInfo.email,
        name: booking.customerInfo.name,
      });

      const customer = await ctx.runAction(internal.domains.stripe.actions.getOrCreateStripeCustomer, {
        userId: booking.userId,
        email: booking.customerInfo.email,
        name: booking.customerInfo.name,
      });

      console.log("👤 Stripe customer result:", customer);

      // Get asset Stripe information to use existing price ID
      console.log("🏷️ Getting asset Stripe info for:", {
        assetId: args.assetId,
        assetType: args.assetType,
      });

      const assetStripeInfo = await ctx.runQuery(internal.domains.stripe.queries.getAssetStripeInfo, {
        assetId: args.assetId,
        assetType: args.assetType,
      });

      console.log("🏷️ Asset Stripe info result:", assetStripeInfo);

      if (!assetStripeInfo?.stripePriceId) {
        throw new Error("Asset does not have Stripe price configured. Please run the backfill script first.");
      }

      // Calculate quantity based on total amount and asset price
      // For activities, the price per person is stored in the asset
      // The total amount is already calculated based on participants
      let quantity = 1;
      if (args.assetType === "activity") {
        // Get the activity to find base price using a query
        console.log("🎯 Getting activity details for price calculation...");
        const activity = await ctx.runQuery(internal["domains/activities/queries"].getById, {
          id: args.assetId,
        });
        
        console.log("🎯 Activity details:", activity);
        
        if (activity && activity.price > 0) {
          quantity = Math.round(args.totalAmount / activity.price);
          console.log("🔢 Calculated quantity:", { totalAmount: args.totalAmount, basePrice: activity.price, quantity });
        }
      }

      console.log("💳 Creating Stripe payment link with:", {
        stripePriceId: assetStripeInfo.stripePriceId,
        quantity: quantity,
        successUrl: args.successUrl,
        cancelUrl: args.cancelUrl,
      });

      // Create payment link using existing price ID
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: assetStripeInfo.stripePriceId,
            quantity: quantity,
          },
        ],
        after_completion: {
          type: "redirect",
          redirect: {
            url: args.successUrl,
          },
        },
        automatic_tax: {
          enabled: false,
        },
        allow_promotion_codes: false,
        metadata: {
          bookingId: args.bookingId,
          userId: booking.userId,
          assetType: args.assetType,
          assetId: args.assetId,
          convexOrigin: "true",
        },
        payment_intent_data: {
          capture_method: 'manual',
          metadata: {
            bookingId: args.bookingId,
            assetType: args.assetType,
            assetId: args.assetId,
          },
        },
      });

      console.log("✅ Payment link created successfully:", {
        id: paymentLink.id,
        url: paymentLink.url,
      });

      // Update booking with payment link info
      console.log("📝 Updating booking with payment link info...");
      await ctx.runMutation(internal.domains.stripe.mutations.updateBookingStripeInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        stripeCustomerId: customer.stripeCustomerId,
        paymentStatus: "requires_capture",
        stripePaymentLinkId: paymentLink.id,
      });

      console.log("🎉 createPaymentLinkForBooking completed successfully");

      return {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        success: true,
      };
    } catch (error) {
      console.error("💥 ERRO ao criar payment link:", error);
      console.error("💥 Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      console.error("💥 Args que causaram o erro:", args);
      
      return {
        paymentLinkId: "",
        paymentLinkUrl: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
}); 