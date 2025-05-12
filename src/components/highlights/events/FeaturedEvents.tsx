'use client'

import { Event, useFeaturedEvents } from "@/lib/services/eventService";
import EventCard from "@/components/cards/EventCard";
import { ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function FeaturedEvents() {
  // Use Convex hook to get featured events
  const { events: featuredEvents, isLoading } = useFeaturedEvents();
  
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background design elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <CalendarDays className="w-72 h-72 text-blue-200" />
      </div>
      <div className="absolute bottom-20 left-10 -z-10 opacity-5">
        <Image 
          src="/images/bg-pattern.png" 
          alt="Pattern" 
          width={500} 
          height={500} 
          className="opacity-20"
        />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
              Eventos em Destaque
            </h2>
            <p className="text-xl text-muted-foreground">
              Participe dos eventos mais esperados de Fernando de Noronha
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 md:mt-0"
          >
            <Link href="/eventos" className="text-blue-600 font-medium flex items-center group hover:underline">
              Ver todos os eventos
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando eventos em destaque...</span>
            </div>
          ) : featuredEvents && featuredEvents.length > 0 ? (
            featuredEvents.slice(0, 5).map((event: Event, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="w-full h-full"
              >
                <EventCard event={event} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-500">
                Nenhum evento em destaque encontrado
              </p>
            </div>
          )}
        </motion.div>

        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Link href="/eventos">
            <Button
              className="rounded-full px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 group"
              size="lg"
            >
              <span className="font-medium">Ver Todos os Eventos</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}