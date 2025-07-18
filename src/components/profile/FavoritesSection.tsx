'use client'

import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Calendar, Star, Users, Car, Utensils, Camera, Package, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { WishlistButton } from "@/components/ui/wishlist-button"

interface FavoritesSectionProps {
  showTitle?: boolean
  maxItems?: number
  showViewAll?: boolean
}

export default function FavoritesSection({ 
  showTitle = true, 
  maxItems = 6,
  showViewAll = true 
}: FavoritesSectionProps) {
  const wishlistItems = useQuery(api.wishlist.getUserWishlist, {})

  const getItemIcon = (type: string) => {
    const icons = {
      package: Package,
      accommodation: MapPin,
      activity: Camera,
      restaurant: Utensils,
      event: Calendar,
      vehicle: Car,
    }
    const Icon = icons[type as keyof typeof icons] || Package
    return <Icon className="h-4 w-4" />
  }

  const getItemLink = (item: any) => {
    const links = {
      package: `/pacotes/${item.item.slug}`,
      accommodation: `/hospedagens/${item.item.slug}`,
      activity: `/atividades/${item.item._id}`,
      restaurant: `/restaurantes/${item.item.slug}`,
      event: `/eventos/${item.item._id}`,
      vehicle: `/veiculos/${item.item._id}`,
    }
    return links[item.itemType as keyof typeof links] || '#'
  }

  const getItemTypeName = (type: string) => {
    const names = {
      package: 'Pacote',
      accommodation: 'Hospedagem', 
      activity: 'Atividade',
      restaurant: 'Restaurante',
      event: 'Evento',
      vehicle: 'Veículo'
    }
    return names[type as keyof typeof names] || type
  }

  if (!wishlistItems) {
    return (
      <div className="space-y-6">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Meus Favoritos</h2>
            <div className="animate-pulse h-4 w-8 bg-gray-200 rounded"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const displayItems = maxItems ? wishlistItems.slice(0, maxItems) : wishlistItems

  if (wishlistItems.length === 0) {
    return (
      <div className="space-y-6">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Meus Favoritos</h2>
            <Badge variant="secondary">0 itens</Badge>
          </div>
        )}
        <Card className="text-center py-8">
          <CardContent>
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum favorito encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Explore nossos pacotes, hospedagens e atividades para adicionar aos seus favoritos.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/">
                <Button size="sm">Voltar para a home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Meus Favoritos</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{wishlistItems.length} itens</Badge>
            {showViewAll && wishlistItems.length > maxItems && (
              <Link href="/wishlist">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayItems.map((item) => (
          <Card key={`${item.itemType}-${item.itemId}`} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getItemIcon(item.itemType)}
                  <Badge variant="secondary" className="text-xs">
                    {getItemTypeName(item.itemType)}
                  </Badge>
                </div>
                <WishlistButton
                  itemType={item.itemType}
                  itemId={item.itemId}
                  variant="ghost"
                  size="icon"
                  showText={false}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                />
              </div>
              <CardTitle className="text-base line-clamp-2">
                {item.item?.name || item.item?.title || 'Item sem nome'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {item.item?.images && item.item.images.length > 0 && (
                  <div className="aspect-video relative overflow-hidden rounded-md">
                    <img
                      src={item.item.images[0]}
                      alt={item.item.name || item.item.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                
                {item.item?.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{item.item.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {item.item?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{item.item.location}</span>
                      </div>
                    )}
                    {item.item?.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>
                          {typeof item.item.rating === 'object' 
                            ? item.item.rating.overall?.toFixed(1) || '0.0'
                            : Number(item.item.rating).toFixed(1)
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {item.item?.price && (
                    <div className="text-right">
                      <div className="font-semibold text-green-600 text-sm">
                        {formatCurrency(item.item.price)}
                      </div>
                    </div>
                  )}
                </div>

                {item.itemType === 'event' && item.item?.date && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.item.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}

                {item.itemType === 'vehicle' && (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {item.item?.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{item.item.capacity} pessoas</span>
                      </div>
                    )}
                    {item.item?.year && (
                      <span>{item.item.year}</span>
                    )}
                  </div>
                )}

                <Link href={getItemLink(item)}>
                  <Button className="w-full" variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showViewAll && wishlistItems.length > maxItems && (
        <div className="text-center">
          <Link href="/wishlist">
            <Button variant="outline">
              Ver todos os {wishlistItems.length} favoritos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
} 