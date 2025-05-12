"use client";

import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/cards/EventCard";
import { Event } from "@/lib/services/eventService";

interface EventsGridProps {
  events: Event[];
  isLoading: boolean;
  resetFilters: () => void;
}

export default function EventsGrid({ events, isLoading, resetFilters }: EventsGridProps) {
  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando eventos...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="events-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {events.length > 0 ? (
              events.map((event) => (
                <motion.div 
                  key={event.id} 
                  className="w-full h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="col-span-full text-center py-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-lg text-gray-500">
                  Nenhum evento encontrado com os filtros atuais.
                </p>
                <Button 
                  variant="outline" 
                  onClick={resetFilters} 
                  className="mt-4"
                >
                  Limpar filtros
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}