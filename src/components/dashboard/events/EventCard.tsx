"use client";

import { Event } from "@/lib/services/eventService";
import { cn } from "@/lib/utils";
import { Calendar, Clock, ExternalLink, MapPin, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

type EventCardProps = {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
};

export function EventCard({ 
  event, 
  onEdit, 
  onDelete, 
  onToggleFeatured, 
  onToggleActive 
}: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <div
        className={cn(
          "group overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col",
          !event.isActive && "opacity-75 hover:opacity-90"
        )}
        onClick={() => onEdit(event)}
      >
        <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
          <Image
            src={event.imageUrl || "/placeholder-event.jpg"}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Badge de categoria */}
          <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
            {event.category}
          </div>
          
          {/* Badge de preço */}
          <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md">
            R$ {event.price.toFixed(2)}
          </div>
          
          {event.isFeatured && (
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 shadow-md px-2.5 py-1 rounded-full text-xs font-medium text-black flex items-center gap-1">
                <Star className="h-3 w-3 fill-black" /> Destaque
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col grow p-5">
          <div className="mb-2 flex justify-between items-start">
            <h3 className="text-lg font-medium line-clamp-1">{event.title}</h3>
            <div className="flex gap-1.5">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-50 hover:bg-amber-100 transition-colors duration-200 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFeatured(event.id, !event.isFeatured);
                }}
              >
                <Star className={`h-4 w-4 ${event.isFeatured ? "fill-amber-500 text-amber-500" : "text-amber-400"}`} />
                <span className="sr-only">{event.isFeatured ? "Remover destaque" : "Destacar"}</span>
              </motion.button>
              
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href={`/eventos/${event.id}`} 
                  target="_blank"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200 shadow-sm"
                >
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                  <span className="sr-only">Ver página</span>
                </Link>
              </motion.div>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 transition-colors duration-200 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(event.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Excluir</span>
              </motion.button>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {event.shortDescription}
          </p>
          
          <div className="mt-auto space-y-3">
            <div className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{event.time}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 line-clamp-1">{event.location}</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all ${
                  event.isActive 
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(event.id, !event.isActive);
                }}
              >
                {event.isActive ? "Ativo" : "Inativo"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}