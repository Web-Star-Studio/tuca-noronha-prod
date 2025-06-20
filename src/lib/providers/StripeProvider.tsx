'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PropsWithChildren } from 'react';

// Validate that the Stripe publishable key is available
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não está definida. Funcionalidades de pagamento não estarão disponíveis.');
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

export default function StripeProvider({ children }: PropsWithChildren) {
  if (!stripePublishableKey) {
    // Return children without Stripe provider if key is not available
    return <>{children}</>;
  }
  
  return <Elements stripe={stripePromise}>{children}</Elements>;
} 