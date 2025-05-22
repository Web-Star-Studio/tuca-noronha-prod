import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenSquare, Trash2, CarFront, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useVehicles } from "@/lib/services/vehicleService";
import type { Vehicle } from "@/lib/services/vehicleService";
import { toast } from "sonner";

type VehicleListProps = {
  onEdit?: (vehicleId: string) => void;
  onDelete?: (vehicleId: string) => void;
  search?: string;
  category?: string;
  status?: string;
};

export default function VehicleList({
  onEdit,
  onDelete,
  search,
  category,
  status,
}: VehicleListProps) {
  // Use our custom hook to fetch vehicles from Convex
  const { vehicles, isLoading } = useVehicles(search, category, status);

  // Handle edit action
  const handleEditVehicle = (vehicleId: string) => {
    if (onEdit) {
      onEdit(vehicleId);
    } else {
      console.log("Edit vehicle:", vehicleId);
    }
  };

  // Handle delete action
  const handleDeleteVehicle = (vehicleId: string) => {
    if (onDelete) {
      onDelete(vehicleId);
    } else {
      console.log("Delete vehicle:", vehicleId);
    }
  };

  // Function to determine status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Disponível</Badge>;
      case 'rented':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Alugado</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Manutenção</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // When loading or when there are no vehicles
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-lg text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">Nenhum veículo encontrado</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {search || category || status 
            ? "Não encontramos veículos com os filtros aplicados. Tente ajustar os filtros."
            : "Você ainda não cadastrou nenhum veículo. Adicione seu primeiro veículo para começar a gerenciar sua frota."}
        </p>
      </div>
    );
  }

  // If we have data, show the vehicles
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <Card key={vehicle._id} className="overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="relative w-full h-48">
            <Image
              src={vehicle.imageUrl || "https://placehold.co/800x600/e2e8f0/64748b?text=Sem+Imagem"}
              alt={vehicle.name}
              fill
              className="object-cover"
            />
            {vehicle.status === "maintenance" && (
              <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs font-semibold py-1 px-3 text-center">
                Em manutenção
              </div>
            )}
          </div>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.brand} | {vehicle.year}</p>
              </div>
              {getStatusBadge(vehicle.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
              <div className="flex items-center">
                <span className="text-muted-foreground">Placa:</span>
                <span className="ml-2 font-medium">{vehicle.licensePlate}</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground">Categoria:</span>
                <span className="ml-2 font-medium capitalize">{vehicle.category}</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground">Combustível:</span>
                <span className="ml-2 font-medium">{vehicle.fuelType}</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground">Câmbio:</span>
                <span className="ml-2 font-medium">{vehicle.transmission}</span>
              </div>
            </div>
            
            <div className="flex items-baseline justify-between pt-3 border-t">
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(vehicle.pricePerDay)}
                <span className="text-xs font-normal text-muted-foreground ml-1">/dia</span>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => handleEditVehicle(vehicle._id)}
                >
                  <PenSquare className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteVehicle(vehicle._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 