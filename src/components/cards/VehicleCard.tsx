
import Link from "next/link";
import { Users, Fuel, Calendar, Car } from "lucide-react";
import { QuickStats } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { parseMediaEntry } from "@/lib/media";
import { SmartMedia } from "@/components/ui/smart-media";
import { getCategoryLabel } from "@/lib/constants/vehicleCategories";

interface VehicleCardProps {
  vehicle: {
    _id: string;
    name: string;
    brand: string;
    model: string;
    category: string;
    year: number;
    color: string;
    seats: number;
    fuelType: string;
    transmission: string;
    estimatedPricePerDay: number;
    imageUrl?: string;
    adminRating?: number;
  };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  // Buscar estatísticas de review
  const { data: reviewStats, isLoading: isLoadingReviewStats } = useReviewStats({
    assetId: vehicle._id,
    assetType: 'vehicle'
  });

  const coverEntry = parseMediaEntry(vehicle.imageUrl ?? "");
  const hasCover = coverEntry.url && coverEntry.url.trim() !== "";

  return (
    <div className="group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl flex flex-col h-full w-full bg-white">
      <Link href={`/veiculos/${vehicle._id}`} className="flex flex-col h-full">
        {/* Imagem */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          {hasCover ? (
            <SmartMedia
              entry={coverEntry}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              imageProps={{
                fill: true,
                sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
              }}
              videoProps={{
                muted: true,
                loop: true,
                playsInline: true,
                controls: false,
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Car className="w-16 h-16 text-gray-300" />
            </div>
          )}
          
          {/* Badge de categoria */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
              {getCategoryLabel(vehicle.category)}
            </span>
          </div>
          
          {/* Wishlist button */}
          <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
            <WishlistButton
              itemType="vehicle"
              itemId={vehicle._id}
              variant="outline"
              size="icon"
              className="bg-white/90 border-white/20 text-gray-700 hover:bg-white h-8 w-8 rounded-full shadow-sm"
              showText={false}
            />
          </div>
          
          {/* Preço */}
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
            <p className="text-xs text-gray-600 mb-0.5">A partir de</p>
            <p className="text-lg font-bold text-gray-900">R$ {(vehicle.estimatedPricePerDay ?? 0).toFixed(2)}/dia</p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Nome e avaliação */}
          <div className="mb-2 flex justify-between items-start">
            <h3 className="text-lg font-medium line-clamp-1">
              {vehicle.brand} {vehicle.model}
            </h3>
            
            {/* Review Stats - prioriza adminRating, depois reviews */}
            {(() => {
              // Priority: adminRating > reviewStats
              const hasAdminRating = vehicle.adminRating !== undefined && vehicle.adminRating > 0;
              const hasReviewData = !isLoadingReviewStats && reviewStats?.averageRating && reviewStats.averageRating > 0;
              
              const finalRating = hasAdminRating 
                ? vehicle.adminRating 
                : (hasReviewData ? reviewStats.averageRating : 0);
              const finalReviews = hasReviewData ? reviewStats.totalReviews : undefined;
              
              return (
                <QuickStats
                  averageRating={finalRating}
                  totalReviews={finalReviews}
                  recommendationPercentage={!isLoadingReviewStats && reviewStats?.recommendationPercentage ? reviewStats.recommendationPercentage : undefined}
                  className="text-sm"
                />
              );
            })()}
          </div>
          
          {/* Ano e cor */}
          <p className="text-gray-500 text-sm mb-2">
            {vehicle.year} • {vehicle.color}
          </p>
          
          {/* Descrição do veículo */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {vehicle.name || `${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          </p>
          
          {/* Informações adicionais */}
          <div className="mt-auto space-y-2">
            <div className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{vehicle.seats} lugares</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fuel className="h-4 w-4 text-gray-400" />
                <span>{vehicle.fuelType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{vehicle.year}</span>
              </div>
            </div>
            
            {/* CTA */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Disponível</span>
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
