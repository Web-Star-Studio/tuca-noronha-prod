import type { Restaurant as RestaurantService } from "@/lib/services/restaurantService";
import type { Restaurant as RestaurantStore } from "@/lib/store/restaurantsStore";
import { QuickStats } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";
import Image from "next/image";
import Link from "next/link";
import React, { forwardRef } from "react";
import { Utensils, MapPin, Clock } from "lucide-react";

// Tipo que funciona com ambos os tipos de Restaurant
type RestaurantType = RestaurantService | RestaurantStore;

interface RestaurantCardProps {
  restaurant: RestaurantType;
}

const RestaurantCard = forwardRef<HTMLDivElement, RestaurantCardProps>(
  ({ restaurant }, ref) => {
    // Buscar estatísticas de review
    const restaurantId = 'id' in restaurant ? restaurant.id : restaurant._id;
    const { data: reviewStats, isLoading: isLoadingReviewStats } = useReviewStats({
      assetId: restaurantId || '',
      assetType: 'restaurant'
    });
    
    // Determinar se está aberto
    const getCurrentStatus = () => {
      // Verificar se openingHours existe (apenas RestaurantService tem)
      if (!('openingHours' in restaurant) || !restaurant.openingHours || restaurant.openingHours.length === 0) {
        return { isOpen: false, status: "Horário indisponível" };
      }
      
      const openingHours = restaurant.openingHours;
      const now = new Date();
      const currentDay = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const todayHours = openingHours.find(h => h.day.toLowerCase() === currentDay);
      
      if (!todayHours || !todayHours.open || !todayHours.hours.length) {
        return { isOpen: false, status: "Fechado hoje" };
      }
      
      // Caso especial para fechado o dia todo
      if (todayHours.hours.length === 1 && todayHours.hours[0] === 'Fechado') {
        return { isOpen: false, status: "Fechado hoje" };
      }
      
      // Verificar se está dentro do horário de funcionamento
      const hoursForDay = todayHours.hours
        .filter(h => h !== 'Fechado')
        .map(h => {
          const parts = h.split(' - ');
          if (parts.length === 2) {
            return parts.join('-');
          }
          // Handle multiple periods like "11:30-15:00 e 18:30-23:00"
          const periods = h.split(' e ');
          return periods.map(p => p.replace(' - ', '-'));
        })
        .flat();
      
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
      <div ref={ref} className="group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl flex flex-col h-full w-full bg-white">
        <Link href={`/restaurantes/${restaurant.slug}`} className="flex flex-col h-full w-full">
          {/* Imagem principal - sem padding no topo */}
          <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
            {restaurant.mainImage && restaurant.mainImage.trim() !== '' ? (
              <Image
                src={restaurant.mainImage}
                alt={restaurant.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Utensils className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {/* Badge de preço */}
            <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
              {restaurant.priceRange}
            </div>
            {/* Badge de categoria - tipo de cozinha */}
            <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
              {restaurant.cuisine[0] || 'Restaurante'}
            </div>
            {/* Badge de status - aberto/fechado */}
            {isOpen && (
              <div className="absolute top-3 right-3 bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Aberto
              </div>
            )}
          </div>
          
          {/* Conteúdo do card */}
          <div className="flex flex-col grow p-5">
            {/* Título e avaliação */}
            <div className="mb-2 flex justify-between items-start">
              <h3 className="text-lg font-medium line-clamp-1">{restaurant.name}</h3>
              
              {/* Review Stats */}
              {(() => {
                // Get rating from reviews system or fallback to restaurant static data
                const hasReviewData = !isLoadingReviewStats && reviewStats?.averageRating && reviewStats.averageRating > 0;
                const finalRating = hasReviewData ? reviewStats.averageRating : (restaurant.rating?.overall || 0);
                
                // Ensure rating is valid
                const validRating = typeof finalRating === 'number' && !isNaN(finalRating) && isFinite(finalRating) ? finalRating : 0;
                
                return (
                  <QuickStats
                    averageRating={validRating}
                    recommendationPercentage={!isLoadingReviewStats && reviewStats?.recommendationPercentage ? reviewStats.recommendationPercentage : undefined}
                    className="text-sm"
                  />
                );
              })()}
            </div>
            
            {/* Localização */}
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">
                {restaurant.address.neighborhood}, {restaurant.address.city}
              </span>
            </div>
            
            {/* Descrição curta */}
            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
              {restaurant.description}
            </p>
            
            {/* Informações adicionais e CTA */}
            <div className="mt-auto space-y-2">
              {/* Tags de cozinha */}
              <div className="flex gap-2 flex-wrap">
                {restaurant.cuisine.slice(0, 2).map((cuisineType, index) => (
                  <span 
                    key={`${cuisineType}-${index}`}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                  >
                    {cuisineType}
                  </span>
                ))}
                {restaurant.cuisine.length > 2 && (
                  <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full">
                    +{restaurant.cuisine.length - 2}
                  </span>
                )}
              </div>
              
              {/* CTA */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">{status}</span>
                <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:underline transition-colors">
                  Ver detalhes →
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }
);

RestaurantCard.displayName = "RestaurantCard";

export default RestaurantCard;
