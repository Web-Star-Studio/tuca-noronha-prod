import { Event } from "@/lib/services/eventService";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users, ExternalLink, RefreshCw } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { QuickStats } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { parseMediaEntry } from "@/lib/media";
import { SmartMedia } from "@/components/ui/smart-media";

export default function EventCard({ event }: { event: Event }) {
  // Format date for display
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const coverEntry = parseMediaEntry(event.imageUrl ?? "");
  const hasCover = coverEntry.url && coverEntry.url.trim() !== "";
  const coverIsLikelyImage = Boolean(coverEntry.type?.startsWith("image/"));

  useEffect(() => {
    setIsImageLoaded(false);
  }, [coverEntry.url]);

  // Get real review stats
  const { data: reviewStats, isLoading: isLoadingReviewStats } = useReviewStats({
    assetId: event.id,
    assetType: 'event'
  });
  
  // Check if event was synced from Sympla
  const isSyncedFromSympla = Boolean(event.symplaId || event.external_id);
  
  // Determine where to link - Priority: externalBookingUrl > Sympla URL > local URL
  const eventUrl = event.externalBookingUrl 
    ? event.externalBookingUrl 
    : (isSyncedFromSympla && event.symplaUrl) 
      ? event.symplaUrl 
      : `/eventos/${event.id}`;
  const isExternalLink = Boolean(event.externalBookingUrl || event.symplaUrl);
  
  return (
    <div className="group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl flex flex-col h-full w-full bg-white">
      <Link 
        href={eventUrl} 
        className="flex flex-col h-full w-full"
        target={isExternalLink ? "_blank" : undefined}
        rel={isExternalLink ? "noopener noreferrer" : undefined}
      >
        {/* Main image - no padding at top */}
        <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
          {hasCover ? (
            <SmartMedia
              entry={coverEntry}
              alt={event.title}
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${coverIsLikelyImage ? (isImageLoaded ? 'opacity-100' : 'opacity-0') : 'opacity-100'}`}
              imageProps={{
                fill: true,
                sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
                loading: "lazy",
                onLoad: () => setIsImageLoaded(true),
                onLoadingComplete: () => setIsImageLoaded(true),
              }}
              videoProps={{
                muted: true,
                loop: true,
                playsInline: true,
                controls: false,
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
          )}
          {coverIsLikelyImage && hasCover && !isImageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}
          {/* Price badge */}
          <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md">
            {event.price > 0 ? formatCurrency(event.price) : 'Gratuito'}
          </div>
          {/* Category badge */}
          <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
            {event.category}
          </div>
          {/* Wishlist button */}
          <div className="absolute bottom-3 left-3" onClick={(e) => e.preventDefault()}>
            <WishlistButton
              itemType="event"
              itemId={event.id}
              variant="outline"
              size="icon"
              className="bg-white/90 border-white/20 text-gray-700 hover:bg-white h-8 w-8 rounded-full shadow-sm"
              showText={false}
            />
          </div>
          {/* Special badges container */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {/* Featured badge */}
            {event.isFeatured && (
              <div className="bg-yellow-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
                Destaque
              </div>
            )}
            {/* External link badge */}
            {event.externalBookingUrl && !event.symplaUrl && (
              <div className="bg-white shadow-md px-2.5 py-1 rounded-full text-xs font-medium text-blue-600 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Link Externo
              </div>
            )}
            {/* Sympla badge for linked events */}
            {event.symplaUrl && (
              <div className="bg-white shadow-md px-2.5 py-1 rounded-full text-xs font-medium text-blue-600 flex items-center gap-1">
                <Image 
                  src="https://www.sympla.com.br/images/public/logo-sympla-new-blue@3x.png" 
                  alt="Sympla" 
                  width={20}
                  height={10}
                  className="h-2.5"
                />
                Sympla
              </div>
            )}
            {/* Sympla sync badge */}
            {isSyncedFromSympla && (
              <div className="bg-indigo-50 shadow-md px-2.5 py-1 rounded-full text-xs font-medium text-indigo-700 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Integrado
              </div>
            )}
          </div>
        </div>

        {/* Content with padding */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title and Rating */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-800 line-clamp-2 group-hover:text-blue-600 flex-1 mr-2">
              {event.title}
            </h3>
            
            {/* Review Stats - com fallback para dados estáticos */}
            <QuickStats
              averageRating={!isLoadingReviewStats && reviewStats?.averageRating ? reviewStats.averageRating : 0}
              totalReviews={!isLoadingReviewStats && reviewStats?.totalReviews ? reviewStats.totalReviews : undefined}
              recommendationPercentage={!isLoadingReviewStats && reviewStats?.recommendationPercentage ? reviewStats.recommendationPercentage : undefined}
              className="text-sm flex-shrink-0"
            />
          </div>

          {/* Description */}
          <div className="mb-4 flex-grow">
            <p className="text-gray-600 text-sm line-clamp-3">
              {event.shortDescription}
            </p>
          </div>

          {/* Event details */}
          <div className="mt-auto">
            <div className="flex items-center text-gray-500 mb-2 text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center text-gray-500 mb-2 text-sm">
              <Clock className="h-4 w-4 mr-2" />
              <span>{event.time}</span>
            </div>

            <div className="flex items-center text-gray-500 mb-2 text-sm">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="line-clamp-1">{event.location}</span>
            </div>

            {/* Available spots */}
            <div className="flex items-center text-gray-500 text-sm">
              <Users className="h-4 w-4 mr-2" />
              <span>{event.maxParticipants > 0 ? `${event.maxParticipants} vagas` : 'Vagas ilimitadas'}</span>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`w-full py-2 text-center text-sm font-medium ${
          isExternalLink 
            ? 'bg-blue-100 text-blue-800 shadow-inner' 
            : event.isActive 
              ? 'bg-green-100 text-green-800 shadow-inner' 
              : 'bg-red-100 text-red-800 shadow-inner'
        }`}>
          {isExternalLink 
            ? (
              <span className="flex items-center justify-center gap-1">
                {event.symplaUrl ? 'Comprar no Sympla' : 'Reservar Externamente'} 
                <ExternalLink className="h-3 w-3 ml-1" />
              </span>
            ) 
            : event.isActive 
              ? 'Inscrições abertas' 
              : 'Inscrições encerradas'
          }
        </div>
      </Link>
    </div>
  );
}
