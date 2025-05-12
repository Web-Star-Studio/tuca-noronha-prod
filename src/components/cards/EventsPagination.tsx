"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface EventsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function EventsPagination({
  currentPage,
  totalPages,
  onPageChange
}: EventsPaginationProps) {
  // Se não houver páginas, não mostramos a paginação
  if (totalPages <= 1) return null;

  // Função para criar as páginas mostradas na paginação
  const getPageNumbers = () => {
    const pages = [];
    // Sempre mostrar a primeira página
    pages.push(1);
    
    // Criar um array de páginas ao redor da página atual
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adicionar ellipsis se necessário entre 1 e startPage
    if (startPage > 2) pages.push("...");
    
    // Adicionar as páginas do meio
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Adicionar ellipsis se necessário entre endPage e a última página
    if (endPage < totalPages - 1) pages.push("...");
    
    // Sempre mostrar a última página se totalPages > 1
    if (totalPages > 1) pages.push(totalPages);
    
    return pages;
  };

  return (
    <motion.div 
      className="flex justify-center items-center my-8 gap-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Botão anterior */}
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="border-gray-200 hover:bg-blue-50 hover:text-blue-600"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Números de página */}
      {getPageNumbers().map((page, index) => (
        typeof page === "number" ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={
              currentPage === page
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border-gray-200 hover:bg-blue-50 hover:text-blue-600"
            }
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="text-gray-400 mx-1">...</span>
        )
      ))}
      
      {/* Botão próximo */}
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="border-gray-200 hover:bg-blue-50 hover:text-blue-600"
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}