# Stripe Connect Implementation Fixes Summary

## Issues Fixed

### 1. Redirect URL Protocol Error
**Error**: `Redirect urls must begin with HTTP or HTTPS`

**Cause**: The `process.env.NEXT_PUBLIC_URL` environment variable was either undefined or didn't include the protocol (http:// or https://).

**Solution**: 
- Added `getAbsoluteUrl()` helper function in `convex/domains/partners/actions.ts`
- Function ensures URLs always have proper protocol
- Provides fallback to `http://localhost:3000` for development

### 2. Stripe API Version Format
**Error**: Invalid API version format `2025-05-28.basil`

**Cause**: Using an incorrect/future API version format that doesn't exist.

**Solution**: 
- Updated all Stripe instances to use `apiVersion: "2024-06-20"`
- This is a stable, valid Stripe API version

## Files Updated

### Stripe API Version Updates:
- `convex/domains/partners/actions.ts` - Already had correct version
- `convex/domains/adminReservations/actions.ts`
- `convex/domains/stripe/actions.ts`
- `convex/domains/coupons/actions.ts`
- `convex/domains/subscriptions/actions.ts`
- `scripts/setupGuideSubscription.ts`
- `src/lib/stripe.ts`
- `src/api/stripe-webhook/route.ts`

### URL Helper Function:
- `convex/domains/partners/actions.ts` - Added `getAbsoluteUrl()` function

## Environment Configuration

Make sure your `.env.local` includes:

```env
# Development
NEXT_PUBLIC_URL=http://localhost:3000

# Production
NEXT_PUBLIC_URL=https://yourdomain.com

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## How the URL Helper Works

```typescript
function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  let url = baseUrl;
  
  // Ensure baseUrl has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
    url = protocol + url;
  }
  
  // Clean up URL formatting
  url = url.replace(/\/$/, ''); // Remove trailing slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  return url + path;
}
```

## Stripe Connect Model

Using **Express accounts** with **Direct Charges**:
- Partner receives payment directly
- Platform collects application fee automatically
- Stripe fees paid by partner
- Simplified onboarding managed by Stripe

## Testing

1. Ensure environment variables are set correctly
2. Restart development server to reload environment
3. Test partner onboarding at `/admin/dashboard/pagamentos`
4. Build passes successfully with all fixes applied 