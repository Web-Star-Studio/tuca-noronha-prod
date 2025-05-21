"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type EventsPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function EventsPagination({
  currentPage,
  totalPages,
  onPageChange
}: EventsPaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisiblePages) {
      // If we have fewer pages than our max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the start
      if (currentPage <= 2) {
        endPage = 4;
      }
      
      // Adjust if we're at the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis at start if needed
      if (startPage > 2) {
        pages.push('ellipsis_start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis at end if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis_end');
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <motion.div 
      className="flex items-center justify-center mt-8 gap-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-9 w-9 p-0 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((page) => 
        typeof page === 'number' ? (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
            className={`h-9 w-9 p-0 ${currentPage === page 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-gray-100'} transition-colors`}
          >
            {page}
          </Button>
        ) : (
          <span key={`ellipsis-${page}-${currentPage}`} className="w-9 text-center text-gray-500">...</span>
        )
      )}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-9 w-9 p-0 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}