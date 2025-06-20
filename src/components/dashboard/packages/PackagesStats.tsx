"use client"

import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import type { Id } from "@/../convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Star, 
  Power, 
  Eye, 
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react"

export function PackagesStats() {
  const { user } = useCurrentUser()
  
  const packagesQuery = useQuery(api.packages.getPackages, { 
    filters: user?.role === "partner" ? { partnerId: user._id } : {}
  })

  const packages = packagesQuery?.packages || []
  
  // Calculate statistics
  const totalPackages = packages.length
  const activePackages = packages.filter(pkg => pkg.isActive).length
  const featuredPackages = packages.filter(pkg => pkg.isFeatured).length
  const inactivePackages = totalPackages - activePackages
  
  // Calculate average price
  const averagePrice = packages.length > 0 
    ? packages.reduce((sum, pkg) => sum + Number(pkg.basePrice), 0) / packages.length 
    : 0

  // Get most popular category
  const categories = packages.reduce((acc, pkg) => {
    acc[pkg.category] = (acc[pkg.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const mostPopularCategory = Object.entries(categories)
    .sort(([,a], [,b]) => Number(b) - Number(a))[0]?.[0] || "N/A"

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const stats = [
    {
      title: "Total de Pacotes",
      value: totalPackages,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Pacotes criados"
    },
    {
      title: "Pacotes Ativos",
      value: activePackages,
      icon: Power,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Disponíveis para reserva"
    },
    {
      title: "Pacotes em Destaque",
      value: featuredPackages,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "Destacados na página inicial"
    },
    {
      title: "Pacotes Inativos",
      value: inactivePackages,
      icon: Eye,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      description: "Temporariamente indisponíveis"
    },
    {
      title: "Preço Médio",
      value: formatPrice(averagePrice),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Valor médio dos pacotes"
    },
    {
      title: "Categoria Mais Popular",
      value: mostPopularCategory,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Categoria com mais pacotes"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {stat.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 