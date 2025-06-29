# 1. Assets do not track Stripe product/payment link

No asset tables include fields for the Stripe product or payment link, preventing checkout sessions tied directly to each asset.

## Solution

1. In `convex/schema.ts`, add optional fields `stripeProductId` and `stripePaymentLink` to each asset table (`activities`, `events`, `restaurants`, `vehicles`, `accommodations`).
2. Update asset creation mutations in:

   * `convex/domains/activities/mutations.ts`
   * `convex/domains/events/mutations.ts`
   * `convex/domains/restaurants/mutations.ts`
   * `convex/domains/vehicles/mutations.ts`
   * `convex/domains/accommodations/mutations.ts`\
     After inserting the asset, call a new internal action to create the corresponding Stripe product and payment link, then patch the asset with these IDs.
3. Extend asset update mutations to refresh Stripe data when price changes.


# 2. Bookings lack a field for the Stripe PaymentIntent

Reservations track payment status but not the payment intent ID, so later updates/refunds cannot be linked to Stripe.

## Solution

1. Add `stripePaymentIntentId?: string` to each booking table definition in `convex/schema.ts` (`activityBookings`, `eventBookings`, `restaurantReservations`, `vehicleBookings`, `accommodationBookings`).
2. Update booking creation mutations in `convex/domains/bookings/mutations.ts` (and any accommodation-specific booking mutations) to optionally accept and store this ID.
3. Ensure update mutations can patch this field when the webhook confirms payment.

# 3. Missing integration actions for Stripe

There is no Convex module responsible for talking to the Stripe API.

## Solution

1. Create `convex/domains/integrations/stripe.ts`.
2. Implement internal actions using the Stripe SDK:

   * `createProductWithPrice(name: string, amount: number)` returning `{productId, paymentLink}`.
   * `createCheckoutSession(priceId, metadata)` returning the Stripe session URL.
   * `refundPayment(paymentIntentId)` returning refund status.
3. Use `process.env.STRIPE_SECRET_KEY` within these actions; throw descriptive errors when not configured.

# 4. Asset creation should register Stripe product

New assets currently only insert database records.

## Solution

1. In each asset `create` mutation, after inserting the asset:

   * Call `internal.integrations.stripe.createProductWithPrice` with the asset’s name and price.
   * Patch the asset record with returned `stripeProductId` and `stripePaymentLink`.
2. Expose failures clearly (e.g., log and continue if Stripe is misconfigured).