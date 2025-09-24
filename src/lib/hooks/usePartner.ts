import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

export function usePartner() {
  const { user } = useUser();
  
  // Get current user from Convex (with role)
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);
  
  // Use the user ID from Convex if available, fallback to publicMetadata
  const userId = (currentUser?._id || user?.publicMetadata?.userId) as Id<"users"> | undefined;

  // Query partner data
  const partner = useQuery(
    api.domains.partners.queries.getPartnerByUserId,
    userId ? { userId } : "skip"
  );

  // Actions
  // Mutations
  const updatePartnerFee = useMutation(api.domains.partners.mutations.updatePartnerFee);
  const togglePartnerActive = useMutation(api.domains.partners.mutations.togglePartnerActive);

  // Helper to check if user can be partner - using role from Convex
  const canBePartner = currentUser?.role === "partner" || currentUser?.role === "admin" || currentUser?.role === "master";

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
    updatePartnerFee,
    togglePartnerActive,
    currentUser, // Expor também o usuário atual para debug
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
