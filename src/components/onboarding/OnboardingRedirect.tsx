"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

interface OnboardingRedirectProps {
  children: React.ReactNode
  excludePaths?: string[] // Paths que não devem ser redirecionados
}

export function OnboardingRedirect({ 
  children, 
  excludePaths = ["/onboarding", "/sign-in", "/sign-up", "/api"] 
}: OnboardingRedirectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useUser()
  
  const shouldRedirect = useQuery(
    api.domains.users.queries.shouldRedirectToOnboarding,
    isSignedIn ? undefined : "skip"
  )

  useEffect(() => {
    // Não fazer nada se ainda estiver carregando
    if (!isLoaded) return

    // Não redirecionar se não estiver logado
    if (!isSignedIn) return

    // Não redirecionar se já estiver em um path excluído
    const isExcludedPath = excludePaths.some(path => 
      pathname.startsWith(path)
    )
    if (isExcludedPath) return

    // Redirecionar para onboarding se necessário
    if (shouldRedirect === true) {
      router.push("/onboarding")
    }
  }, [isLoaded, isSignedIn, shouldRedirect, pathname, router, excludePaths])

  // Mostrar loading enquanto verifica
  if (!isLoaded || (isSignedIn && shouldRedirect === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se deve redirecionar, mostrar loading (o redirect acontecerá no useEffect)
  if (isSignedIn && shouldRedirect === true && !excludePaths.some(path => pathname.startsWith(path))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecionando para completar seu perfil...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 