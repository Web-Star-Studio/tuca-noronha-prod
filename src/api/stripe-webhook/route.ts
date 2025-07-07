import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { internal, api } from '../../../convex/_generated/api';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
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
    
    // Send confirmation notification if userId is available
    if (metadata.userId) {
      try {
        await convex.action(internal.domains.notifications.actions.sendBookingConfirmationNotification, {
          userId: metadata.userId,
          bookingId: metadata.bookingId,
          bookingType: metadata.assetType,
        });
        console.log('✅ Confirmation notification sent');
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't throw - notification failure shouldn't fail the payment update
      }
    }
    
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
    // Check if this is a captured payment or just authorized
    const isCapturing = paymentIntent.status === 'succeeded' && paymentIntent.amount_received > 0;
    const assetType = metadata.assetType;
    
    // For activities and events, only mark as 'paid' when authorized, 'succeeded' when captured
    if (assetType === 'activity' || assetType === 'event') {
      const paymentStatus = isCapturing ? 'succeeded' : 'paid';
      
      await convex.mutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
        bookingId: metadata.bookingId,
        paymentStatus: paymentStatus,
        stripePaymentIntentId: paymentIntent.id,
      });
      
      // Only update booking to confirmed if payment was actually captured
      if (isCapturing) {
        await convex.mutation(internal.domains.bookings.mutations.updateBookingPaymentSuccess, {
          stripePaymentIntentId: paymentIntent.id,
          bookingId: metadata.bookingId,
          bookingType: assetType,
        });
        console.log('✅ Activity/Event booking payment captured and confirmed');
      } else {
        console.log('✅ Activity/Event booking payment authorized - awaiting admin confirmation');
      }
    } else {
      // For other asset types, proceed as before
      await convex.mutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
        bookingId: metadata.bookingId,
        paymentStatus: 'succeeded',
        stripePaymentIntentId: paymentIntent.id,
      });
      console.log('✅ Booking updated with payment intent');
    }
    
  } catch (error) {
    console.error('Error updating booking with payment intent:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment intent failed:', paymentIntent.id);
  
  const { metadata } = paymentIntent;
  
  if (!metadata?.bookingId) {
    console.log('No booking metadata found in payment intent');
    return;
  }
  
  try {
    // Update booking payment status to failed
    await convex.mutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: 'failed',
      stripePaymentIntentId: paymentIntent.id,
    });
    
    console.log('✅ Booking marked as payment failed');
  } catch (error) {
    console.error('Error updating booking payment status:', error);
    throw error;
  }
} 