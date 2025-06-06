'use client'

import { useState } from "react"
import { GitCompare } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "./button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ComparisonButtonProps {
  packageId: string
  variant?: "default" | "outline" | "ghost"
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
      toast.error("Faça login para comparar pacotes.")
      return
    }

    setIsLoading(true)

    try {
      if (isInComparison) {
        await removeFromComparison({
          packageId: packageId as any,
        })
        toast.success("Pacote removido da comparação.")
      } else {
        // Check if comparison is full (max 3 packages)
        if (comparisonCount && comparisonCount >= 3) {
          toast.error("Você pode comparar no máximo 3 pacotes. Remova um para adicionar outro.")
          return
        }

        await addToComparison({
          packageId: packageId as any,
        })
        toast.success("Pacote adicionado à comparação.")
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar comparação.")
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
      {showText && size !== "icon" && (
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