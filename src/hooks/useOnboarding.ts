"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface OnboardingData {
  fullName: string
  dateOfBirth: string
  phoneNumber: string
}

export function useOnboarding() {
  const router = useRouter()

  // Queries
  const onboardingStatus = useQuery(api.domains.users.queries.getOnboardingStatus)
  const userProfile = useQuery(api.domains.users.queries.getUserProfile)
  const shouldRedirect = useQuery(api.domains.users.queries.shouldRedirectToOnboarding)

  // Mutations
  const completeOnboardingMutation = useMutation(api.domains.users.mutations.completeOnboarding)
  const updateProfileMutation = useMutation(api.domains.users.mutations.updateUserProfile)

  // Computed values
  const isCompleted = onboardingStatus?.isCompleted || false
  const needsOnboarding = onboardingStatus?.needsOnboarding || false
  const userRole = onboardingStatus?.userRole

  const completeOnboarding = async (data: OnboardingData) => {
    try {
      const result = await completeOnboardingMutation(data)

      if (result.success) {
        toast.success("Perfil completo!", {
          description: "Seu onboarding foi concluído com sucesso",
        })
        return { success: true }
      } else {
        toast.error("Erro", {
          description: result.message,
        })
        return { success: false, error: result.message }
      }
    } catch (error: any) {
      const message = error.message || "Erro ao completar onboarding"
      toast.error("Erro ao completar perfil", {
        description: message,
      })
      return { success: false, error: message }
    }
  }

  const updateProfile = async (data: Partial<Pick<OnboardingData, "fullName" | "phoneNumber">>) => {
    try {
      const result = await updateProfileMutation(data)

      if (result.success) {
        toast.success("Perfil atualizado!", {
          description: result.message,
        })
        return { success: true }
      } else {
        toast.error("Erro", {
          description: result.message,
        })
        return { success: false, error: result.message }
      }
    } catch (error: any) {
      const message = error.message || "Erro ao atualizar perfil"
      toast.error("Erro ao atualizar perfil", {
        description: message,
      })
      return { success: false, error: message }
    }
  }

  const redirectToOnboarding = () => {
    router.push("/onboarding")
  }

  const redirectToHome = () => {
    router.push("/")
  }

  return {
    // Estado
    isCompleted,
    needsOnboarding,
    shouldRedirect,
    userRole,
    onboardingStatus,
    userProfile,
    
    // Ações
    completeOnboarding,
    updateProfile,
    redirectToOnboarding,
    redirectToHome,
    
    // Helpers
    isTraveler: userRole === "traveler",
    isPartner: userRole === "partner",
    isEmployee: userRole === "employee",
    isMaster: userRole === "master",
  }
} 