import type { Restaurant as RestaurantService } from "@/lib/services/restaurantService";
import type { Restaurant as RestaurantStore } from "@/lib/store/restaurantsStore";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuickStats } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";
import Image from "next/image";
import Link from "next/link";
import React, { forwardRef } from "react";
import { Utensils, MapPin, Clock, Star } from "lucide-react";
import { imageEffects } from "@/lib/ui-config";

// Tipo que funciona com ambos os tipos de Restaurant
type RestaurantType = RestaurantService | RestaurantStore;

interface RestaurantCardProps {
  restaurant: RestaurantType;
}

const RestaurantCard = forwardRef<HTMLDivElement, RestaurantCardProps>(
  ({ restaurant }, ref) => {
    const getRestaurantId = (r: RestaurantType): string => {
      if ('_id' in r && r._id) {
        return r._id;
      }
      return r.id || "";
    }
    
    // Get real review stats
    const { data: reviewStats, isLoading: isLoadingReviewStats } = useReviewStats({
      assetType: "restaurant",
      assetId: getRestaurantId(restaurant),
    });
    
    // Get open/closed status
    const getCurrentStatus = () => {
      // Check if restaurant is open now
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Tipo guarda para acessar hours com segurança
      const getHoursForDay = (day: string) => {
        // Verifique se é o formato do restaurantService (com dias específicos)
        if ('Monday' in restaurant.hours) {
          // Faça um cast para o tipo específico
          const typedHours = restaurant.hours as {
            Monday: string[];
            Tuesday: string[];
            Wednesday: string[];
            Thursday: string[];
            Friday: string[];
            Saturday: string[];
            Sunday: string[];
          };
          // Acesse usando indexação com type assertion
          return typedHours[day as keyof typeof typedHours] || [];
        } else {
          // Use o formato do restaurantStore (com índice dinâmico)
          return (restaurant.hours as {[day: string]: string[]})[day] || [];
        }
      };
      
      const hoursForDay = getHoursForDay(day);
      
      if (!hoursForDay || hoursForDay.length === 0) {
        return { isOpen: false, status: "Fechado hoje" };
      }
      
      for (const period of hoursForDay) {
        const [openTime, closeTime] = period.split('-');
        if (currentTime >= openTime && currentTime <= closeTime) {
          return { isOpen: true, status: "Aberto agora" };
        }
      }
      
      return { isOpen: false, status: "Fechado agora" };
    };
    
    const { isOpen, status } = getCurrentStatus();
    
    return (
      <Link href={`/restaurantes/${restaurant.slug}`}>
        <Card 
          ref={ref} 
          variant="interactive"
          className="h-full group relative"
        >
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={restaurant.mainImage}
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover ${imageEffects.hover.scale}`}
            />
            <div className={imageEffects.overlay.dark}></div>
            
            {/* Price badge */}
            <Badge 
              className="absolute top-3 right-3 shadow-sm"
              variant="outline"
            >
              {restaurant.priceRange}
            </Badge>
            
            {/* Open/closed status */}
            <Badge 
              variant={isOpen ? "success" : "secondary"}
              className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Clock className="mr-1 h-3 w-3" /> {status}
            </Badge>
          </div>
          
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {restaurant.name}
                </h3>
                <div className="flex items-center mt-1 text-gray-500 text-sm">
                  <MapPin className="h-3 w-3 mr-1" /> 
                  <span className="line-clamp-1">
                    {restaurant.address.neighborhood}, {restaurant.address.city}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <QuickStats
                  averageRating={!isLoadingReviewStats && reviewStats?.averageRating ? reviewStats.averageRating : restaurant.rating.overall}
                  totalReviews={!isLoadingReviewStats && reviewStats?.totalReviews ? reviewStats.totalReviews : Number(restaurant.rating.totalReviews)}
                  size="sm"
                />
                
                <div className="flex items-center">
                  <Utensils className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-sm text-gray-500 line-clamp-1">
                    {restaurant.cuisine.join(', ')}
                  </span>
                </div>
              </div>
              
              <p className="text-sm line-clamp-2 text-gray-700">
                {restaurant.description}
              </p>
            </div>
          </CardContent>
          
          <CardFooter separator={true}>
            <div className="flex flex-wrap gap-1">
              {restaurant.tags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={`${tag}-${index}`} 
                  variant="outline" 
                  className="bg-blue-50 text-blue-700 text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {restaurant.tags.length > 2 && (
                <Badge 
                  key="more-tags"
                  variant="outline" 
                  className="bg-gray-50 text-gray-600 text-xs"
                >
                  +{restaurant.tags.length - 2}
                </Badge>
              )}
            </div>

            <span className="text-sm font-medium text-blue-600 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalhes <span className="ml-1 group-hover:ml-2 transition-all">→</span>
            </span>
          </CardFooter>
        </Card>
      </Link>
    );
  }
);

RestaurantCard.displayName = "RestaurantCard";

export default RestaurantCard;
