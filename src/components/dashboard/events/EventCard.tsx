"use client";

import { Event } from "@/lib/services/eventService";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        className={cn(
          "overflow-hidden transition-all hover:shadow-md group cursor-pointer h-full flex flex-col",
          !event.isActive && "opacity-70"
        )}
        onClick={() => onEdit(event)}
      >
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.imageUrl || "/placeholder-event.jpg"}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
          {event.isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-amber-400 to-yellow-500 shadow-md hover:shadow-lg border-none text-black"
              >
                <Star className="h-3 w-3 mr-1 fill-black" /> Destaque
              </Badge>
            </div>
          )}
        </div>
        <CardHeader className="pb-2 pt-3 flex-none">
          <CardTitle className="flex justify-between items-center">
            <span className="line-clamp-1 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {event.title}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-amber-100/80 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click event
                  onToggleFeatured(event.id, !event.isFeatured);
                }}
              >
                <Star className={`h-4 w-4 ${event.isFeatured ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                <span className="sr-only">{event.isFeatured ? "Remover destaque" : "Destacar"}</span>
              </Button>
              <Link 
                href={`/eventos/${event.id}`} 
                target="_blank"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-100/80 transition-colors duration-200"
              >
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span className="sr-only">Ver página</span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-red-100/80 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click event
                  onDelete(event.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Excluir</span>
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-1 text-slate-600">
            {event.shortDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pb-2 flex-grow">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
              {event.category}
            </Badge>
            <div className="text-sm font-medium px-2 py-1 rounded-md bg-green-50/80 text-green-700">
              R$ {event.price.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500 gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{event.time}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2 pb-2 border-t border-slate-100 flex-none">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-500 line-clamp-1">{event.location}</span>
          </div>
          <Button
            variant={event.isActive ? "outline" : "default"}
            size="sm"
            className={`text-xs ${event.isActive ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              onToggleActive(event.id, !event.isActive);
            }}
          >
            {event.isActive ? "Ativo" : "Inativo"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}