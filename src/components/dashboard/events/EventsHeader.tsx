"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { buttonStyles, typography, transitionEffects } from "@/lib/ui-config";

type EventsHeaderProps = {
  openCreateDialog: () => void;
};

export function EventsHeader({ openCreateDialog }: EventsHeaderProps) {
  return (
    <motion.div 
      className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 ${transitionEffects.appear.fadeInDown}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className={`text-3xl font-bold tracking-tight ${typography.title.cool}`}>
          Gerenciamento de Eventos
        </h1>
        <p className="text-slate-600 mt-1">
          Crie, edite e gerencie os eventos disponíveis na plataforma.
        </p>
      </div>
      <Button 
        onClick={openCreateDialog} 
        className={`self-start md:self-center ${buttonStyles.variant.gradient} shadow-md hover:shadow-lg`}
      >
        <Plus className="mr-2 h-4 w-4" /> Novo Evento
      </Button>
    </motion.div>
  );
}