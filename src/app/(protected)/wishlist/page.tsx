'use client'

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MapPin, Calendar, Star, Users, Car, Utensils, Camera, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

export default function WishlistPage() {
  const [activeTab, setActiveTab] = useState("all")
  const wishlistItems = useQuery(api.wishlist.getUserWishlist, {})
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist)

  const handleRemoveFromWishlist = async (itemType: string, itemId: string) => {
    try {
      await removeFromWishlist({ itemType, itemId })
      toast.success("Removido dos favoritos")
    } catch {
      toast.error("Não foi possível remover o item dos favoritos.")
    }
  }

  if (!wishlistItems) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const filterItemsByType = (type: string) => {
    if (type === "all") return wishlistItems
    return wishlistItems.filter(item => item.itemType === type)
  }

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

  const renderItemCard = (item: any) => {
    return (
      <Card key={`${item.itemType}-${item.itemId}`} className="group hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {getItemIcon(item.itemType)}
              <Badge variant="secondary" className="text-xs">
                {item.itemType === 'package' ? 'Pacote' : 
                 item.itemType === 'accommodation' ? 'Hospedagem' :
                 item.itemType === 'activity' ? 'Atividade' :
                 item.itemType === 'restaurant' ? 'Restaurante' :
                 item.itemType === 'event' ? 'Evento' : 'Veículo'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFromWishlist(item.itemType, item.itemId)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Heart className="h-4 w-4 fill-current" />
            </Button>
          </div>
          <CardTitle className="text-lg line-clamp-2">{item.item.name || item.item.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {item.item.images && item.item.images.length > 0 && (
              <div className="aspect-video relative overflow-hidden rounded-md">
                <Image
                  src={item.item.images[0]}
                  alt={item.item.name || item.item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            
            {item.item.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{item.item.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {item.item.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{item.item.location}</span>
                  </div>
                )}
                {item.item.rating && (
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
              
              {item.item.price && (
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(item.item.price)}
                  </div>
                  {item.item.duration && (
                    <div className="text-xs text-gray-500">
                      {item.item.duration} dias
                    </div>
                  )}
                </div>
              )}
            </div>

            {item.itemType === 'package' && item.item.includes && (
              <div className="flex flex-wrap gap-1">
                {item.item.includes.slice(0, 3).map((include: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {include}
                  </Badge>
                ))}
                {item.item.includes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.item.includes.length - 3} mais
                  </Badge>
                )}
              </div>
            )}

            {item.itemType === 'event' && item.item.date && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{new Date(item.item.date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}

            {item.itemType === 'vehicle' && (
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {item.item.capacity && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{item.item.capacity} pessoas</span>
                  </div>
                )}
                {item.item.year && (
                  <span>{item.item.year}</span>
                )}
              </div>
            )}

            <Link href={getItemLink(item)}>
              <Button className="w-full" variant="outline">
                Ver Detalhes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const itemCounts = {
    all: wishlistItems.length,
    package: wishlistItems.filter(item => item.itemType === 'package').length,
    accommodation: wishlistItems.filter(item => item.itemType === 'accommodation').length,
    activity: wishlistItems.filter(item => item.itemType === 'activity').length,
    restaurant: wishlistItems.filter(item => item.itemType === 'restaurant').length,
    event: wishlistItems.filter(item => item.itemType === 'event').length,
    vehicle: wishlistItems.filter(item => item.itemType === 'vehicle').length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meus Favoritos</h1>
        <p className="text-gray-600">
          {wishlistItems.length === 0 
            ? "Você ainda não adicionou nenhum item aos favoritos."
            : `${wishlistItems.length} ${wishlistItems.length === 1 ? 'item favoritado' : 'itens favoritados'}`
          }
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhum favorito encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            Explore nossos pacotes, hospedagens e atividades para adicionar aos seus favoritos.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button>Voltar para a home</Button>
            </Link>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">
              Todos ({itemCounts.all})
            </TabsTrigger>
            <TabsTrigger value="package">
              Pacotes ({itemCounts.package})
            </TabsTrigger>
            <TabsTrigger value="accommodation">
              Hospedagens ({itemCounts.accommodation})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Atividades ({itemCounts.activity})
            </TabsTrigger>
            <TabsTrigger value="restaurant">
              Restaurantes ({itemCounts.restaurant})
            </TabsTrigger>
            <TabsTrigger value="event">
              Eventos ({itemCounts.event})
            </TabsTrigger>
            <TabsTrigger value="vehicle">
              Veículos ({itemCounts.vehicle})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItemsByType("all").map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="package" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItemsByType("package").map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="accommodation" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItemsByType("accommodation").map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItemsByType("activity").map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="restaurant" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItemsByType("restaurant").map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="event" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItemsByType("event").map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="vehicle" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterItemsByType("vehicle").map(renderItemCard)}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}