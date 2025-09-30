import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

/**
 * Middleware to check if user has an active subscription
 * Redirects to subscription page if not
 */
export async function requireActiveSubscription() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has active subscription using preloadQuery
  const preloaded = await preloadQuery(
    api.domains.subscriptions.queries.hasActiveSubscription,
    {}
  );

  const hasSubscription = preloaded._valueJSON;

  if (!hasSubscription) {
    // Redirect to subscription landing page
    redirect("/meu-painel/guia/assinar");
  }

  return true;
}

/**
 * Hook to check subscription status client-side
 */
export function useSubscriptionCheck() {
  // This would be used in client components
  // Implementation depends on how you want to handle client-side checks
  return {
    isLoading: false,
    hasSubscription: false,
    redirectToSubscription: () => {
      window.location.href = "/meu-painel/guia/assinar";
    }
  };
}
