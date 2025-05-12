"use client";

import { Event } from "@/lib/services/eventService";
import { EventCard } from "./EventCard";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type EventsGridProps = {
  events: Event[];
  isLoading: boolean;
  searchQuery: string;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
};

export function EventsGrid({
  events,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleActive
}: EventsGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
          <CardTitle className="text-xl font-medium mb-2">Nenhum evento encontrado</CardTitle>
          <CardDescription>
            {searchQuery 
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Clique em 'Novo Evento' para criar o primeiro evento."}
          </CardDescription>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFeatured={onToggleFeatured}
            onToggleActive={onToggleActive}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}