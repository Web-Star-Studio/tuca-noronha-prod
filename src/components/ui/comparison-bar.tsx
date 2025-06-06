'use client'

import { useAuth } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "./button"
import { Badge } from "./badge"
import { GitCompare, X, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function ComparisonBar() {
  const { userId } = useAuth()

  // Get user's comparison
  const comparison = useQuery(
    api.packageComparison.getUserComparison,
    userId ? {} : "skip"
  )

  const removeFromComparison = useMutation(api.packageComparison.removeFromComparison)
  const clearComparison = useMutation(api.packageComparison.clearComparison)

  if (!comparison || comparison.packageIds.length === 0) {
    return null
  }

  const handleRemovePackage = async (packageId: string) => {
    if (!userId) return

    try {
      await removeFromComparison({
        packageId: packageId as any,
      })
      toast({
        title: "Removido da comparação",
        description: "Pacote removido da comparação.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover pacote.",
        variant: "destructive",
      })
    }
  }

  const handleClearComparison = async () => {
    if (!userId) return

    try {
      await clearComparison({})
      toast({
        title: "Comparação limpa",
        description: "Todos os pacotes foram removidos da comparação.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao limpar comparação.",
        variant: "destructive",
      })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[600px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                Comparar Pacotes
              </span>
              <Badge variant="secondary">
                {comparison.packageIds.length}/3
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearComparison}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 mb-4">
            {comparison.packages.map((pkg) => (
              <div
                key={pkg._id}
                className="flex items-center justify-between bg-gray-50 rounded-md p-2"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {pkg.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    R$ {pkg.basePrice.toFixed(2)}
                    {pkg.discountPercentage && (
                      <span className="ml-1 text-green-600">
                        (-{pkg.discountPercentage}%)
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePackage(pkg._id)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Link href="/pacotes/comparacao" className="flex-1">
              <Button className="w-full" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver Comparação
              </Button>
            </Link>
            {comparison.packageIds.length < 3 && (
              <Button variant="outline" size="sm" disabled>
                Adicione mais pacotes
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 