import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

interface RestaurantsHeaderProps {
  openCreateDialog: () => void;
}

export function RestaurantsHeader({ openCreateDialog }: RestaurantsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent pb-1">
          Restaurantes
        </h1>
        <p className="text-gray-600">
          Gerencie e organize os restaurantes disponíveis na plataforma.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button 
          onClick={openCreateDialog}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Restaurante
        </Button>
      </motion.div>
    </div>
  );
}
