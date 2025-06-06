'use client'

import { useState } from "react"
import { GitCompare } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "./button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ComparisonButtonProps {
  packageId: string
  variant?: "default" | "outline" | "ghost" | "icon"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function ComparisonButton({
  packageId,
  variant = "outline",
  size = "sm",
  className,
  showText = true,
}: ComparisonButtonProps) {
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Check if package is in comparison
  const isInComparison = useQuery(
    api.packageComparison.isInComparison,
    userId ? {
      packageId: packageId as any,
    } : "skip"
  )

  // Get comparison count
  const comparisonCount = useQuery(
    api.packageComparison.getComparisonCount,
    userId ? {} : "skip"
  )

  // Mutations
  const addToComparison = useMutation(api.packageComparison.addToComparison)
  const removeFromComparison = useMutation(api.packageComparison.removeFromComparison)

  const handleToggleComparison = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Faça login para comparar pacotes.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isInComparison) {
        await removeFromComparison({
          packageId: packageId as any,
        })
        toast({
          title: "Removido da comparação",
          description: "Pacote removido da sua lista de comparação.",
        })
      } else {
        // Check if comparison is full (max 3 packages)
        if (comparisonCount && comparisonCount >= 3) {
          toast({
            title: "Limite atingido",
            description: "Você pode comparar no máximo 3 pacotes. Remova um para adicionar outro.",
            variant: "destructive",
          })
          return
        }

        await addToComparison({
          packageId: packageId as any,
        })
        toast({
          title: "Adicionado à comparação",
          description: "Pacote adicionado à sua lista de comparação.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar comparação.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleComparison}
      disabled={isLoading}
      className={cn("flex items-center gap-2", className)}
    >
      <GitCompare
        className={cn(
          "h-4 w-4 transition-colors",
          isInComparison 
            ? "text-blue-600" 
            : "text-gray-600"
        )}
      />
      {showText && (variant !== "icon" && size !== "icon") && (
        <span>
          {isLoading 
            ? "..." 
            : isInComparison 
              ? "Na comparação" 
              : "Comparar"
          }
        </span>
      )}
    </Button>
  )
} 