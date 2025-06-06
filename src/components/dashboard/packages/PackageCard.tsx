"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Star, 
  MapPin, 
  Calendar, 
  Users, 
  Eye,
  Edit, 
  Trash2, 
  Power,
  Copy,
  MoreVertical,
  Bed,
  Car,
  Utensils,
  Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PackageCardProps {
  package: any
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: (isActive: boolean) => void
  onToggleFeatured: (isFeatured: boolean) => void
  onDuplicate: () => void
}

export function PackageCard({
  package: pkg,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onDuplicate
}: PackageCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {!imageError ? (
            <img
              src={pkg.mainImage || '/images/placeholder-package.jpg'}
              alt={pkg.name}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Camera className="h-12 w-12 text-purple-300" />
            </div>
          )}

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {pkg.isFeatured && (
              <Badge className="bg-yellow-500 text-white border-0">
                <Star className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
            <Badge 
              variant={pkg.isActive ? "default" : "secondary"}
              className={pkg.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}
            >
              {pkg.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {/* Price */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 text-purple-700 border-0 text-sm font-semibold">
              {formatPrice(pkg.basePrice)}
            </Badge>
          </div>

          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                {pkg.name}
              </h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                {pkg.description}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onToggleStatus(!pkg.isActive)}
                  className={pkg.isActive ? "text-orange-600" : "text-green-600"}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {pkg.isActive ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleFeatured(!pkg.isFeatured)}
                  className={pkg.isFeatured ? "text-gray-600" : "text-yellow-600"}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {pkg.isFeatured ? "Remover destaque" : "Destacar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="py-3">
          {/* Package Info */}
          <div className="space-y-3">
            {/* Duration and Guests */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{pkg.duration} dias</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Até {pkg.maxGuests} pessoas</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <Badge variant="outline" className="text-xs">
                {pkg.category}
              </Badge>
            </div>

            {/* Included services */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {pkg.accommodationId && (
                <div className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  <span>Hospedagem</span>
                </div>
              )}
              {pkg.vehicleId && (
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  <span>Veículo</span>
                </div>
              )}
              {(pkg.includedActivityIds?.length > 0 || 
                pkg.includedRestaurantIds?.length > 0 || 
                pkg.includedEventIds?.length > 0) && (
                <div className="flex items-center gap-1">
                  <Utensils className="h-3 w-3" />
                  <span>Extras</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {pkg.tags && pkg.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pkg.tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {pkg.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{pkg.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between w-full text-xs text-gray-500">
            <span>Criado em {formatDate(pkg._creationTime)}</span>
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>ID: {pkg._id.slice(-6)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
} 