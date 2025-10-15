"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useForceModalCleanup } from "@/hooks/use-modal-cleanup";
import { toast } from "@/hooks/use-toast";

interface ModalCleanupButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  children?: React.ReactNode;
}

/**
 * Componente de botão para forçar limpeza de modais órfãos
 * Útil para desenvolvimento e casos extremos onde modais ficam "travados"
 */
export function ModalCleanupButton({ 
  variant = "outline", 
  size = "sm", 
  className,
  showIcon = true,
  children 
}: ModalCleanupButtonProps) {
  const { forceCleanup } = useForceModalCleanup();

  const handleCleanup = () => {
    try {
      forceCleanup();
      toast({
        title: "Limpeza realizada",
        description: "Modais órfãos foram removidos com sucesso.",
      });
    } catch (error) {
      console.error("Error cleaning up modals:", error);
      toast({
        title: "Erro na limpeza",
        description: "Ocorreu um erro ao limpar os modais. Tente recarregar a página.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCleanup}
      className={className}
      title="Forçar limpeza de modais órfãos"
    >
      {showIcon && <Trash2 className="h-4 w-4 mr-1" />}
      {children || "Limpar Modais"}
    </Button>
  );
}

/**
 * Versão de emergência do botão com aviso visual
 */
export function EmergencyModalCleanupButton() {
  const { forceCleanup } = useForceModalCleanup();

  const handleEmergencyCleanup = () => {
    try {
      forceCleanup();
      toast({
        title: "🚨 Limpeza de emergência realizada",
        description: "Todos os overlays e modais órfãos foram removidos.",
      });
    } catch (error) {
      console.error("Error during emergency modal cleanup:", error);
      toast({
        title: "Erro na limpeza de emergência",
        description: "Recarregue a página se o problema persistir.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleEmergencyCleanup}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Limpeza de Emergência
    </Button>
  );
} 