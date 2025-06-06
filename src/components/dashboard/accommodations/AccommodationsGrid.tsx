import { Accommodation } from "@/lib/services/accommodationService";
import { AccommodationCard } from "./AccommodationCard";
import { Search, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AccommodationsGridProps {
  accommodations: Accommodation[];
  isLoading: boolean;
  searchQuery?: string;
  onEdit: (accommodation: Accommodation) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export function AccommodationsGrid({
  accommodations,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleActive,
}: AccommodationsGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!accommodations || accommodations.length === 0) {
    if (searchQuery) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-60 text-center"
        >
          <Search className="h-12 w-12 text-gray-300 mb-2" />
          <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
          <p className="text-gray-500 max-w-md mt-1">
            Não encontramos acomodações para &quot;{searchQuery}&quot;. Tente ajustar os critérios de busca.
          </p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-60 text-center"
      >
        <h3 className="text-lg font-medium">Nenhuma acomodação cadastrada</h3>
        <p className="text-gray-500 max-w-md mt-1">
          Comece adicionando sua primeira acomodação com o botão &quot;Adicionar Acomodação&quot;.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {accommodations.map((accommodation) => (
          <AccommodationCard
            key={accommodation._id?.toString() || accommodation.id}
            accommodation={accommodation}
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