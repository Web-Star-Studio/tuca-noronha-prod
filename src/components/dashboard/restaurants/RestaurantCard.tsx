import { Restaurant } from "@/lib/services/restaurantService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Menu } from "lucide-react";
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
      <Card variant="interactive" className="h-full relative group">
        {/* Card header with image */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          <Image
            src={restaurant.mainImage || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover ${imageEffects.hover.scale}`}
          />

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <Badge 
              variant={restaurant.isActive ? "success" : "outline"}
            >
              {restaurant.isActive ? "Ativo" : "Inativo"}
            </Badge>
            
            {restaurant.isFeatured && (
              <Badge variant="warning">
                Destacado
              </Badge>
            )}
          </div>

          {/* Price range badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-gray-900 font-bold">
              {restaurant.priceRange}
            </Badge>
          </div>

          {/* Action menu */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(restaurant)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = `/admin/dashboard/restaurantes/${restaurant._id}/cardapio-mesas`}>
                  Cardápio & Mesas
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
          
          <div className={imageEffects.overlay.dark}></div>
        </div>

        {/* Card content */}
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{restaurant.name}</h3>
            
            <div className="flex items-center text-sm text-gray-500">
              <span>{restaurant.address?.neighborhood}, {restaurant.address?.city} - {restaurant.address?.state}</span>
            </div>

            <p className="text-sm text-gray-700 line-clamp-2">{restaurant.description}</p>

            <div className="flex flex-wrap gap-1 pt-2">
              {restaurant.cuisine.slice(0, 3).map((type, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                  {type}
                </Badge>
              ))}
              {restaurant.cuisine.length > 3 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 cursor-help">
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

        <CardFooter separator={true}>
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{restaurant.rating?.overall.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({restaurant.rating?.totalReviews})</span>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs text-blue-700 hover:bg-blue-50"
              onClick={() => window.location.href = `/admin/dashboard/restaurantes/${restaurant._id}/cardapio-mesas`}
            >
              Cardápio & Mesas
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => onEdit(restaurant)}
            >
              Editar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
