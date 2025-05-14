import { Restaurant } from "@/lib/services/restaurantService";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import React, { forwardRef } from "react";
import { Utensils, MapPin, Clock, Star } from "lucide-react";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = forwardRef<HTMLDivElement, RestaurantCardProps>(
  ({ restaurant }, ref) => {
    // Get open/closed status
    const getCurrentStatus = () => {
      // Check if restaurant is open now
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof restaurant.hours;
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (!restaurant.hours[day] || restaurant.hours[day].length === 0) {
        return { isOpen: false, status: "Fechado hoje" };
      }
      
      for (const period of restaurant.hours[day]) {
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
          className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg border-gray-100 group relative"
        >
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={restaurant.mainImage}
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Price badge */}
            <Badge 
              className="absolute top-3 right-3 bg-white text-gray-800 border-0 shadow-md"
              variant="outline"
            >
              {restaurant.priceRange}
            </Badge>
            
            {/* Open/closed status */}
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={`absolute bottom-3 left-3 ${isOpen ? 'bg-green-500' : 'bg-gray-200 text-gray-700'} opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md`}
            >
              <Clock className="mr-1 h-3 w-3" /> {status}
            </Badge>
          </div>
          
          <CardContent className="p-4">
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
              
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{restaurant.rating.overall.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({restaurant.rating.totalReviews})</span>
                
                <span className="mx-2 text-gray-300">•</span>
                
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
          
          <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-gray-50">
            <div className="flex flex-wrap gap-1">
              {restaurant.tags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-blue-50 text-blue-700 border-blue-100 text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {restaurant.tags.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="bg-gray-50 text-gray-600 border-gray-100 text-xs"
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
