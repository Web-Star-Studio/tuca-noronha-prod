import { Hosting } from "@/lib/store/hostingsStore";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import React, { forwardRef } from "react";
import { BedDouble, Users } from "lucide-react";
import { QuickStats } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";

interface HostingCardProps {
  hosting: Hosting;
}

const HostingCard = forwardRef<HTMLDivElement, HostingCardProps>(
  ({ hosting }, ref) => {
    // Get real review stats
    const { data: reviewStats, isLoading: isLoadingReviewStats } = useReviewStats({
      assetId: hosting.slug, // Using slug as ID since no _id is available
      assetType: 'accommodation'
    });
    
    // Formatar o preço com a moeda
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: hosting.currency
    }).format(hosting.pricePerNight);

    return (
      <Link href={`/hospedagens/${hosting.slug}`}>
        <Card ref={ref} className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg border-gray-100">
          <div className="relative h-52 w-full">
            <Image
              src={hosting.mainImage}
              alt={hosting.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
              {hosting.type}
            </div>
            {hosting.discountPercentage && hosting.discountPercentage > 0 && (
              <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                {hosting.discountPercentage}% OFF
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg line-clamp-1 mb-1">{hosting.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{hosting.address.neighborhood}</p>
            <p className="text-sm line-clamp-2 text-gray-700">{hosting.description}</p>
            
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-gray-600">
                <BedDouble className="h-4 w-4" />
                <span className="text-xs">{hosting.bedrooms} quarto{hosting.bedrooms !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-4 w-4" />
                <span className="text-xs">até {hosting.maxGuests} hóspedes</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-3">
              {hosting.tags && hosting.tags.slice(0, 2).map((tag, index) => (
                <span 
                  key={`${tag}-${index}`} 
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {hosting.tags && hosting.tags.length > 2 && (
                <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full">
                  +{hosting.tags.length - 2}
                </span>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div>
              <QuickStats
                averageRating={!isLoadingReviewStats && reviewStats?.averageRating ? reviewStats.averageRating : hosting.rating.overall}
                totalReviews={!isLoadingReviewStats && reviewStats?.totalReviews ? reviewStats.totalReviews : hosting.rating.totalReviews}
                recommendationPercentage={!isLoadingReviewStats && reviewStats?.recommendationPercentage ? reviewStats.recommendationPercentage : undefined}
                className="text-sm mb-2"
              />
              <div className="text-base font-semibold text-blue-700">
                {formattedPrice} <span className="text-xs text-gray-500">/ noite</span>
              </div>
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

HostingCard.displayName = "HostingCard";

export default HostingCard;
