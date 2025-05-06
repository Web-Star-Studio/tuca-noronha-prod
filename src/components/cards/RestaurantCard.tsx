import { Restaurant } from "@/lib/store/restaurantsStore";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import React, { forwardRef } from "react";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = forwardRef<HTMLDivElement, RestaurantCardProps>(
  ({ restaurant }, ref) => {
    return (
      <Link href={`/restaurantes/${restaurant.slug}`}>
        <Card ref={ref} className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg border-gray-100">
          <div className="relative h-52 w-full">
            <Image
              src={restaurant.mainImage}
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
              {restaurant.priceRange}
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg line-clamp-1 mb-1">{restaurant.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{restaurant.address.neighborhood}</p>
            <p className="text-sm line-clamp-2 text-gray-700">{restaurant.description}</p>
            
            <div className="flex flex-wrap gap-1 mt-3">
              {restaurant.cuisine.slice(0, 2).map((type, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {type}
                </span>
              ))}
              {restaurant.cuisine.length > 2 && (
                <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full">
                  +{restaurant.cuisine.length - 2}
                </span>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <div className="text-yellow-500">⭐</div>
              <span className="text-sm font-medium">{restaurant.rating.overall.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({restaurant.rating.totalReviews})</span>
            </div>
            <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:underline transition-colors">
              Ver detalhes →
            </span>
          </CardFooter>
        </Card>
      </Link>
    );
  }
);

RestaurantCard.displayName = "RestaurantCard";

export default RestaurantCard;
