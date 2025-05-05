import { Event } from "@/lib/store/eventsStore";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function EventCard({ event }: { event: Event }) {
  // Format date for display
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);
  
  return (
    <div className="group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl flex flex-col h-full w-full bg-white">
      <Link href={`/eventos/${event.id}`} className="flex flex-col h-full w-full">
        {/* Main image - no padding at top */}
        <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
          <Image  
            src={event.image_url} 
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Price badge */}
          <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
            {event.price > 0 ? `R$ ${event.price.toFixed(2)}` : 'Gratuito'}
          </div>
          {/* Category badge */}
          <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
            {event.category}
          </div>
          {/* Featured badge */}
          {event.featured && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
              Destaque
            </div>
          )}
        </div>
        
        {/* Card content */}
        <div className="flex flex-col grow p-5">
          {/* Title */}
          <div className="mb-2">
            <h3 className="text-lg font-medium line-clamp-1">{event.name}</h3>
          </div>
          
          {/* Short description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {event.short_description || event.description.substring(0, 120) + '...'}
          </p>
          
          {/* Additional information */}
          <div className="mt-auto space-y-2">
            <div className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{event.start_time}</span>
              </div>
            </div>
            
            <div className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{event.available_spots} vagas</span>
              </div>
            </div>
            
            {/* CTA */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{event.status === "scheduled" ? "Inscreva-se!" : event.status === "completed" ? "Encerrado" : "Em andamento"}</span>
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
