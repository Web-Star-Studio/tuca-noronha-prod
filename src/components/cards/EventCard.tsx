import { Event } from "@/lib/services/eventService";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function EventCard({ event }: { event: Event }) {
  // Format date for display
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  return (
    <div className="group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl flex flex-col h-full w-full bg-white">
      <Link 
        href={`/eventos/${event.id}`} 
        className="flex flex-col h-full w-full">
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
          <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
            {event.price > 0 ? formatCurrency(event.price) : 'Gratuito'}
          </div>
          {/* Category badge */}
          <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
            {event.category}
          </div>
          {/* Special badge for featured events */}
          {event.isFeatured && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
              Destaque
            </div>
          )}
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
        <div className={`w-full py-2 text-center text-sm font-medium ${event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {event.isActive ? 'Inscrições abertas' : 'Inscrições encerradas'}
        </div>
      </Link>
    </div>
  );
}
