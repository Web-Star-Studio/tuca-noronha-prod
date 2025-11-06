"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

import ActivitiesCard from "@/components/cards/ActivitiesCard";
import EventCard from "@/components/cards/EventCard";
import RestaurantCard from "@/components/cards/RestaurantCard";
import VehicleCard from "@/components/cards/VehicleCard";
import { useFeaturedActivities } from "@/lib/services/activityService";
import { useFeaturedEvents } from "@/lib/services/eventService";
import { useFeaturedRestaurants } from "@/lib/services/restaurantService";
import { useFeaturedVehicles } from "@/lib/services/vehicleService";
import type { Activity } from "@/lib/store/activitiesStore";
import type { Event } from "@/lib/services/eventService";
import type { Restaurant as RestaurantType } from "@/lib/services/restaurantService";
import type { Vehicle } from "@/lib/services/vehicleService";

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

type SpotlightItemConfig = {
  key: string;
  title: string;
  href: string;
  isLoading: boolean;
  hasData: boolean;
  content: ReactNode;
  emptyMessage: string;
};

export default function HomeSpotlight() {
  const { activities, isLoading: loadingActivities } = useFeaturedActivities();
  const { events, isLoading: loadingEvents } = useFeaturedEvents();
  const { restaurants, isLoading: loadingRestaurants } = useFeaturedRestaurants();
  const { vehicles, isLoading: loadingVehicles } = useFeaturedVehicles();

  const activity = (activities?.[0] as Activity | undefined) ?? undefined;
  const event = (events?.[0] as Event | undefined) ?? undefined;
  const restaurant = (restaurants?.[0] as RestaurantType | undefined) ?? undefined;
  const vehicle = (vehicles?.[0] as Vehicle | undefined) ?? undefined;

  const items: SpotlightItemConfig[] = [
    {
      key: "activity",
      title: "Atividade em Destaque",
      href: "/atividades",
      isLoading: loadingActivities,
      hasData: Boolean(activity),
      content: activity ? <ActivitiesCard activity={activity} /> : null,
      emptyMessage: "Em breve novas atividades em destaque.",
    },
    {
      key: "event",
      title: "Evento em Destaque",
      href: "/eventos",
      isLoading: loadingEvents,
      hasData: Boolean(event),
      content: event ? <EventCard event={event} /> : null,
      emptyMessage: "Ainda não temos eventos em destaque disponíveis.",
    },
    {
      key: "restaurant",
      title: "Restaurante em Destaque",
      href: "/restaurantes",
      isLoading: loadingRestaurants,
      hasData: Boolean(restaurant),
      content: restaurant ? <RestaurantCard restaurant={restaurant} /> : null,
      emptyMessage: "Nenhum restaurante em destaque por enquanto.",
    },
    {
      key: "vehicle",
      title: "Veículo em Destaque",
      href: "/veiculos",
      isLoading: loadingVehicles,
      hasData: Boolean(vehicle),
      content: vehicle ? <VehicleCard vehicle={vehicle} /> : null,
      emptyMessage: "Veículos em destaque retornarão em breve.",
    },
  ];

  return (
    <section className="py-20 md:py-24 bg-slate-50/60">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-blue-500">
            curadoria tuca noronha
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
            Destaques Selecionados Para Você
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Explore o melhor de atividades, eventos, gastronomia e mobilidade com uma seleção exclusiva.
          </p>
        </motion.div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4"
        >
          {items.map((item) => (
            <motion.div key={item.key} variants={cardVariants} className="flex h-full">
              <SpotlightTile {...item} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

type SpotlightTileProps = SpotlightItemConfig;

function SpotlightTile({ title, href, isLoading, hasData, content, emptyMessage }: SpotlightTileProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
          {title}
        </span>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          Ver tudo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex-1">
        {isLoading ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 px-6 text-sm text-muted-foreground">Carregando {title.toLowerCase()}...</p>
          </div>
        ) : hasData ? (
          <div className="h-full">
            {content}
          </div>
        ) : (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 text-center">
            <p className="mb-2 text-base font-medium text-gray-900">{title}</p>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
