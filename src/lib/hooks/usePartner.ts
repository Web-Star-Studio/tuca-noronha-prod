import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

export function usePartner() {
  const { user } = useUser();
  const userId = user?.publicMetadata?.userId as Id<"users"> | undefined;

  // Query partner data
  const partner = useQuery(
    api.domains.partners.queries.getPartnerByUserId,
    userId ? { userId } : "skip"
  );

  // Actions
  const createStripeAccount = useAction(api.domains.partners.actions.createStripeConnectedAccount);
  const refreshOnboardingLink = useAction(api.domains.partners.actions.refreshOnboardingLink);
  const createDashboardLink = useAction(api.domains.partners.actions.createDashboardLink);

  // Mutations
  const updatePartnerFee = useMutation(api.domains.partners.mutations.updatePartnerFee);
  const togglePartnerActive = useMutation(api.domains.partners.mutations.togglePartnerActive);

  // Helper to check if user can be partner
  const canBePartner = user?.publicMetadata?.role === "partner" || user?.publicMetadata?.role === "admin";

  // Helper to check onboarding status
  const isOnboardingComplete = partner?.onboardingStatus === "completed";
  const isOnboardingInProgress = partner?.onboardingStatus === "in_progress";
  const needsOnboarding = !partner || partner.onboardingStatus === "pending";

  return {
    partner,
    canBePartner,
    isOnboardingComplete,
    isOnboardingInProgress,
    needsOnboarding,
    createStripeAccount,
    refreshOnboardingLink,
    createDashboardLink,
    updatePartnerFee,
    togglePartnerActive,
  };
}

// Hook para transações do partner
export function usePartnerTransactions(partnerId?: Id<"partners">) {
  const transactions = useQuery(
    api.domains.partners.queries.getPartnerTransactions,
    partnerId ? { 
      partnerId,
      paginationOpts: { numItems: 10, cursor: null }
    } : "skip"
  );

  return transactions;
}

// Hook para analytics do partner
export function usePartnerAnalytics(partnerId?: Id<"partners">) {
  const analytics = useQuery(
    api.domains.partners.queries.getPartnerAnalytics,
    partnerId ? { partnerId } : "skip"
  );

  return analytics;
}

// Hook para histórico de taxas
export function usePartnerFeeHistory(partnerId?: Id<"partners">) {
  const feeHistory = useQuery(
    api.domains.partners.queries.getPartnerFeeHistory,
    partnerId ? { partnerId } : "skip"
  );

  return feeHistory;
} 