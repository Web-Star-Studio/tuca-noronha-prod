"use client";

import UserBookingsList from "@/components/bookings/UserBookingsList";
import { Separator } from "@/components/ui/separator";

export default function ReservasPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
          Minhas Reservas
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Visualize e gerencie todas as suas reservas de atividades, eventos e serviços.
        </p>
      </div>
      <Separator className="mb-8 bg-slate-200 dark:bg-slate-700" />
      <UserBookingsList />
    </div>
  );
}