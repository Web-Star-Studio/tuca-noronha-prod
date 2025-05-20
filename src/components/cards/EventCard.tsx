import { Event } from "@/lib/services/eventService";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users, ExternalLink, RefreshCw } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function EventCard({ event }: { event: Event }) {
  // Format date for display
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Check if event was synced from Sympla
  const isSyncedFromSympla = Boolean(event.symplaId || event.external_id);
  
  // Determine where to link - Sympla URL for synced events, local URL for local events
  const eventUrl = (isSyncedFromSympla && event.symplaUrl) ? event.symplaUrl : `/eventos/${event.id}`;
  const isExternalLink = Boolean(event.symplaUrl);
  
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
          <Image  
            src={event.imageUrl} 
            alt={event.title}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={() => setIsImageLoaded(true)}
            loading="lazy"
          />
          {!isImageLoaded && (
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
          {/* Special badges container */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {/* Featured badge */}
            {event.isFeatured && (
              <div className="bg-yellow-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
                Destaque
              </div>
            )}
            {/* Sympla badge for linked events */}
            {event.symplaUrl && (
              <div className="bg-white shadow-md px-2.5 py-1 rounded-full text-xs font-medium text-blue-600 flex items-center gap-1">
                <img 
                  src="https://www.sympla.com.br/images/public/logo-sympla-new-blue@3x.png" 
                  alt="Sympla" 
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
          {/* Title */}
          <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2 group-hover:text-blue-600">
            {event.title}
          </h3>

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
                Comprar no Sympla <ExternalLink className="h-3 w-3 ml-1" />
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
