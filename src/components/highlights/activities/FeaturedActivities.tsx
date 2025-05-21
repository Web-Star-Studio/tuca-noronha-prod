'use client'

import type { Activity } from "@/lib/store/activitiesStore";
import { useFeaturedActivities } from "@/lib/services/activityService";
import ActivitiesCard from "@/components/cards/ActivitiesCard";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeaturedActivities() {
  // Use Convex hook to get featured activities directly from API
  const { activities: featuredActivities, isLoading } = useFeaturedActivities();

  return (
    <section className="py-24 container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
            Atividades Imperdíveis
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra as experiências mais incríveis de Fernando de Noronha
          </p>
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
            <span className="ml-3 text-gray-600">Carregando atividades em destaque...</span>
          </div>
        ) : featuredActivities && featuredActivities.length > 0 ? (
          featuredActivities.map((activity: Activity, index: number) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="w-full h-full"
            >
              <ActivitiesCard activity={activity} />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-gray-500">
              Nenhuma atividade em destaque encontrada
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
        <Link href="/atividades">
          <Button
            className="rounded-full px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 group"
            size="lg"
          >
            <span className="font-medium">Ver Todas as Atividades</span>
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
