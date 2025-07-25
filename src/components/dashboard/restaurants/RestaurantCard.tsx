import { Restaurant } from "@/lib/services/restaurantService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Menu, Trash2 } from "lucide-react";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { imageEffects } from "@/lib/ui-config";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export function RestaurantCard({
  restaurant,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleActive,
}: RestaurantCardProps) {
  // Get restaurant ID from _id or id
  const restaurantId = restaurant._id?.toString() || restaurant.id || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card variant="interactive" className="h-full relative group overflow-hidden">
        {/* Card header with image - Sem padding, ocupando toda a largura */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          <Image
            src={restaurant.mainImage || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover ${imageEffects.hover.scale}`}
          />

          {/* Overlay escuro sempre presente para melhor contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>

          {/* Badges overlay com melhor contraste */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
            <Badge 
              variant={restaurant.isActive ? "success" : "outline"}
              className={restaurant.isActive 
                ? "bg-green-600 text-white border-green-600 shadow-lg" 
                : "bg-white/90 text-gray-900 border-white/90 backdrop-blur-sm shadow-lg"
              }
            >
              {restaurant.isActive ? "Ativo" : "Inativo"}
            </Badge>
            
            {restaurant.isFeatured && (
              <Badge 
                variant="warning"
                className="bg-amber-500 text-white border-amber-500 shadow-lg"
              >
                ⭐ Destacado
              </Badge>
            )}
          </div>

          {/* Price range badge com melhor contraste */}
          <div className="absolute top-3 right-3 z-20">
            <Badge variant="outline" className="bg-white/95 backdrop-blur-sm text-gray-900 font-bold border-white/95 shadow-lg">
              {restaurant.priceRange}
            </Badge>
          </div>

          {/* Informações que aparecem no hover com texto branco */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 flex flex-col justify-between p-4 z-10">
            {/* Informações superiores */}
            <div className="flex mt-5 justify-between items-start">
              <div className="text-white space-y-1">
                <h4 className="font-semibold text-lg text-white drop-shadow-lg">{restaurant.name}</h4>
                <p className="text-sm text-white/90 drop-shadow">
                  {restaurant.address?.neighborhood}, {restaurant.address?.city}
                </p>
              </div>
            </div>

            {/* Informações inferiores */}
            <div className="flex justify-between items-end">
              <div className="text-white">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 drop-shadow">★</span>
                  <span className="font-medium text-white drop-shadow">{restaurant.rating?.overall.toFixed(1)}</span>
                  <span className="text-white/80 text-sm drop-shadow">({restaurant.rating?.totalReviews})</span>
                </div>
              </div>

              {/* Action menu com melhor visibilidade */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg">
                    <Menu className="h-4 w-4 text-gray-900" />
                    <span className="sr-only">Ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(restaurant)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = `/admin/dashboard/restaurantes/${restaurant._id}/cardapio-mesas`}>
                    Gestão de Mesas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleFeatured(restaurantId, !restaurant.isFeatured)}>
                    {restaurant.isFeatured ? "Remover destaque" : "Destacar"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleActive(restaurantId, !restaurant.isActive)}>
                    {restaurant.isActive ? "Desativar" : "Ativar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-700" 
                    onClick={() => onDelete(restaurantId)}
                  >
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Card content - padding otimizado */}
        <CardContent className="p-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg leading-tight">{restaurant.name}</h3>
            
            <div className="flex items-center text-sm text-gray-500">
              <span>{restaurant.address?.neighborhood}, {restaurant.address?.city} - {restaurant.address?.state}</span>
            </div>

            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{restaurant.description}</p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {restaurant.cuisine.slice(0, 3).map((type, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                  {type}
                </Badge>
              ))}
              {restaurant.cuisine.length > 3 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 cursor-help text-xs">
                      +{restaurant.cuisine.length - 3}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {restaurant.cuisine.slice(3).join(", ")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter separator={true} className="px-4 py-3 bg-gray-50/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{restaurant.rating?.overall.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">({restaurant.rating?.totalReviews})</span>
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => onEdit(restaurant)}
              >
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(restaurantId);
                }}
                title="Excluir restaurante"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
