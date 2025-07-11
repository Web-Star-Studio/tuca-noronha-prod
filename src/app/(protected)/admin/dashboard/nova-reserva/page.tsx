import { AdminReservationCreationForm } from "@/components/dashboard/AdminReservationCreationForm";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Suspense } from "react";

export default function NovaReservaPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Nova Reserva"
        description="Crie uma nova reserva manual para um viajante, selecionando os serviços e configurando os detalhes."
      />
      <Suspense fallback={<AdminReservationCreationFormSkeleton />}>
        <AdminReservationCreationForm />
      </Suspense>
    </div>
  );
}

function AdminReservationCreationFormSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      <div className="grid md:grid-cols-[200px_1fr] gap-10">
        {/* Skeleton for Stepper */}
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Skeleton for Form Content */}
        <div className="space-y-6">
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="mt-6 space-y-4">
            <div className="h-10 w-full rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
            <div className="h-24 w-full rounded bg-muted" />
          </div>
          <div className="flex justify-end pt-4">
             <div className="h-10 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}