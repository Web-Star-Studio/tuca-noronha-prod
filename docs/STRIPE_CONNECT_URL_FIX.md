# Stripe Connect URL Configuration Fix

## Problem
Stripe Connect Account Links require redirect URLs to begin with HTTP or HTTPS protocol. The error "Redirect urls must begin with HTTP or HTTPS" occurs when the URLs don't include the protocol.

## Solution Applied

1. **Added URL Helper Function**
   - Created `getAbsoluteUrl()` function in `convex/domains/partners/actions.ts`
   - Ensures URLs always have proper protocol (http:// or https://)
   - Handles both development and production environments

2. **Environment Variable Configuration**
   Make sure your `.env.local` file includes the `NEXT_PUBLIC_URL` with protocol:

   ```env
   # Development
   NEXT_PUBLIC_URL=http://localhost:3000

   # Production
   NEXT_PUBLIC_URL=https://yourdomain.com
   ```

3. **How the Helper Works**
   ```typescript
   function getAbsoluteUrl(path: string): string {
     const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
     let url = baseUrl;
     
     // Add protocol if missing
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

## Updated Account Link Creation

Both `createStripeConnectedAccount` and `refreshOnboardingLink` now use:

```typescript
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: getAbsoluteUrl('/admin/dashboard/pagamentos/onboarding?refresh=true'),
  return_url: getAbsoluteUrl('/admin/dashboard/pagamentos/onboarding?success=true'),
  type: "account_onboarding",
  collection_options: {
    fields: "eventually_due",
  },
});
```

## Testing

1. Ensure your `.env.local` has the correct `NEXT_PUBLIC_URL`
2. Restart your development server to reload environment variables
3. Test creating a new Stripe Connect account through the partner dashboard

## Important Notes

- Always include the protocol in `NEXT_PUBLIC_URL`
- In production, use HTTPS for security
- The helper function provides fallback to localhost for development
- Stripe requires complete URLs with protocol for all redirect URLs 