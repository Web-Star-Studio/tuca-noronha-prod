import { Button } from "@/components/ui/button";
import { Plus, Store } from "lucide-react";

interface RestaurantsHeaderProps {
  openCreateDialog: () => void;
}

export function RestaurantsHeader({ openCreateDialog }: RestaurantsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
          <Store className="h-7 w-7 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Restaurantes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie e organize os restaurantes disponíveis na plataforma
          </p>
        </div>
      </div>

      <Button 
        onClick={openCreateDialog}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Adicionar Restaurante
      </Button>
    </div>
  );
}
