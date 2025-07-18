import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { internal, api } from '../../../convex/_generated/api';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any,
});

// Create a Convex client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * Stripe webhook handler
 * Docs: https://stripe.com/docs/webhooks
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('Missing Stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  let payload: string;
  let event: Stripe.Event;
  
  try {
    payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  console.log(`Processing Stripe webhook: ${event.type}`);
  
  try {
    // Process the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', {
          id: session.id,
          mode: session.mode,
          metadata: session.metadata,
          subscription: session.subscription,
        });
        
        // For subscription mode, delegate to Convex webhook handler
        if (session.mode === 'subscription' && session.metadata?.type === 'guide_subscription') {
          console.log('Processing guide subscription checkout via Convex webhook');
          await convex.action(internal.domains.stripe.actions.processWebhookEvent, {
            eventId: event.id,
            eventType: event.type,
            livemode: event.livemode,
            data: session,
          });
        } else {
          await handleCheckoutSessionCompleted(session);
        }
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      // Stripe Connect events
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
        
      case 'account.external_account.created':
        await handleExternalAccountCreated(event.data.object as Stripe.BankAccount | Stripe.Card);
        break;
        
      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        console.log(`Processing subscription/invoice event: ${event.type}`);
        await convex.action(internal.domains.stripe.actions.processWebhookEvent, {
          eventId: event.id,
          eventType: event.type,
          livemode: event.livemode,
          data: event.data.object,
        });
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout session completed:', session.id);
  console.log('Metadata:', session.metadata);
  
  const { metadata } = session;
  
  if (!metadata?.bookingId || !metadata?.assetType) {
    console.error('Missing booking metadata in checkout session');
    return;
  }
  
  try {
    // Create partner transaction record if this is a Destination Charge
    if (metadata.partnerId && metadata.partnerStripeAccountId && session.payment_intent) {
      console.log('🔄 Creating partner transaction record for Destination Charge');
      
      // Get payment intent details to calculate amounts
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
      const amount = paymentIntent.amount; // Total amount in cents
      const applicationFeeAmount = paymentIntent.application_fee_amount || 0; // Platform fee in cents
      const partnerAmount = amount - applicationFeeAmount; // Partner receives total minus platform fee
      
      // Get partner record
      const partner = await convex.query(internal.domains.partners.queries.getPartnerByUserId, {
        userId: metadata.partnerId,
      });
      
      if (partner) {
        await convex.mutation(internal.domains.partners.mutations.createPartnerTransaction, {
          partnerId: partner._id,
          bookingId: metadata.bookingId,
          bookingType: metadata.assetType as any,
          stripePaymentIntentId: session.payment_intent as string,
          amount: amount,
          platformFee: applicationFeeAmount,
          partnerAmount: partnerAmount,
          currency: paymentIntent.currency,
          status: 'pending', // Will be updated when payment is captured
          metadata: {
            sessionId: session.id,
            customerId: session.customer,
          },
        });
        
        console.log('✅ Partner transaction created successfully');
      }
    }
    
    // For activities and events, payment should be authorized but not captured until admin approval
    // For other types (restaurants, vehicles, accommodations), proceed with immediate confirmation
    if (metadata.assetType === 'activity' || metadata.assetType === 'event') {
      console.log(`🔍 Processing ${metadata.assetType} booking:`, {
        bookingId: metadata.bookingId,
        assetType: metadata.assetType,
        sessionId: session.id,
        paymentIntentId: session.payment_intent
      });
      
      // Only update payment status to 'paid' but keep booking awaiting confirmation
      await convex.mutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
        bookingId: metadata.bookingId,
        paymentStatus: 'paid',
        stripePaymentIntentId: session.payment_intent as string,
      });
      
      console.log(`✅ Updated ${metadata.assetType} payment status to 'paid'`);
      
      // Update booking to awaiting confirmation status (but don't auto-confirm)
      await convex.mutation(internal.domains.bookings.mutations.updateBookingStatus, {
        bookingId: metadata.bookingId,
        bookingType: metadata.assetType,
        status: 'awaiting_confirmation',
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
      });
      
      console.log(`✅ Updated ${metadata.assetType} booking status to 'awaiting_confirmation'`);
      console.log('✅ Activity/Event booking payment authorized - awaiting admin confirmation');
    } else {
      // For other asset types, proceed with full confirmation
      await convex.mutation(internal.domains.bookings.mutations.updateBookingPaymentSuccess, {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        bookingId: metadata.bookingId,
        bookingType: metadata.assetType,
      });
      
      console.log('✅ Booking payment status updated successfully');
    }
    
    // Note: Notification is handled by updateBookingPaymentSuccess function
    // which calls sendBookingPaymentConfirmationEmails with complete booking data
    console.log('✅ Booking payment updated - confirmation emails will be sent via updateBookingPaymentSuccess');
    
  } catch (error) {
    console.error('Error updating booking payment status:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Payment intent succeeded:', paymentIntent.id);
  
  const { metadata } = paymentIntent;
  
  if (!metadata?.bookingId) {
    console.log('No booking metadata found in payment intent');
    return;
  }
  
  try {
    // Update partner transaction status to completed
    if (metadata.partnerId) {
      try {
        const updatedTransactionId = await convex.mutation(internal.domains.partners.mutations.updatePartnerTransactionStatus, {
          stripePaymentIntentId: paymentIntent.id,
          status: 'completed',
          stripeTransferId: paymentIntent.transfer_data?.destination as string | undefined,
        });
        
        console.log('✅ Partner transaction status updated to completed');
        
        // Notify partner about the new transaction
        if (updatedTransactionId) {
          await convex.mutation(internal.domains.partners.mutations.notifyPartnerNewTransaction, {
            transactionId: updatedTransactionId,
          });
          console.log('✅ Partner notified about new transaction');
        }
      } catch (error) {
        console.error('Error updating partner transaction:', error);
        // Log error but don't fail the webhook
      }
    }
    
    console.log('✅ Payment intent processed successfully');
  } catch (error) {
    console.error('Error processing payment intent succeeded:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment intent failed:', paymentIntent.id);
  
  const { metadata } = paymentIntent;
  
  if (!metadata?.bookingId || !metadata?.assetType) {
    console.log('No booking metadata found in payment intent');
    return;
  }
  
  try {
    // Update booking payment status
    await convex.mutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: 'failed',
      stripePaymentIntentId: paymentIntent.id,
    });
    
    // Handle partner transaction error if applicable
    if (metadata.partnerId) {
      try {
        // Find the transaction
        const partnerTransactions = await convex.query(internal.domains.partners.queries.getPartnerTransactionsByPaymentIntent, {
          stripePaymentIntentId: paymentIntent.id,
        });
        
        if (partnerTransactions && partnerTransactions.length > 0) {
          const transaction = partnerTransactions[0];
          await convex.mutation(internal.domains.partners.mutations.handlePartnerTransactionError, {
            transactionId: transaction._id,
            error: paymentIntent.last_payment_error?.message || 'Payment failed',
            shouldReverse: true,
          });
          console.log('✅ Partner transaction error handled');
        }
      } catch (error) {
        console.error('Error handling partner transaction error:', error);
      }
    }
    
    console.log('✅ Payment failure handled successfully');
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}

/**
 * Handle account.updated event for Stripe Connect
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log('🔄 Stripe Connect account updated:', account.id);
  
  try {
    // Determine onboarding status based on account state
    let onboardingStatus: 'pending' | 'in_progress' | 'completed' | 'rejected' = 'pending';
    
    if (account.charges_enabled && account.payouts_enabled) {
      onboardingStatus = 'completed';
    } else if (account.details_submitted) {
      onboardingStatus = 'in_progress';
    } else if (account.requirements?.disabled_reason) {
      onboardingStatus = 'rejected';
    }
    
    // Update partner status
    await convex.mutation(internal.domains.partners.mutations.updateOnboardingStatus, {
      stripeAccountId: account.id,
      status: onboardingStatus,
      capabilities: {
        cardPayments: account.capabilities?.card_payments === 'active',
        transfers: account.capabilities?.transfers === 'active',
      },
    });
    
    console.log(`✅ Partner onboarding status updated to: ${onboardingStatus}`);
  } catch (error) {
    console.error('Error updating partner onboarding status:', error);
    throw error;
  }
}

/**
 * Handle account.external_account.created event for Stripe Connect
 */
async function handleExternalAccountCreated(externalAccount: Stripe.BankAccount | Stripe.Card) {
  console.log('💳 External account created for connected account:', externalAccount.account);
  
  // This event confirms that the partner has added a bank account
  // The account.updated event will handle the actual status update
  console.log('✅ External account creation acknowledged');
} 