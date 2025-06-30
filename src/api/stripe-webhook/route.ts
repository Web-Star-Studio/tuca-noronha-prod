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
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
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
    // Update booking payment status to succeeded
    await convex.mutation(internal.domains.bookings.mutations.updateBookingPaymentSuccess, {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      bookingId: metadata.bookingId,
      bookingType: metadata.assetType,
    });
    
    console.log('✅ Booking payment status updated successfully');
    
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
    // Update booking with payment intent details
    await convex.mutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: 'succeeded',
      stripePaymentIntentId: paymentIntent.id,
    });
    
    console.log('✅ Booking updated with payment intent');
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