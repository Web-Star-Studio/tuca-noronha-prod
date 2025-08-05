"use client";

import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AdminReviewCard } from "@/components/admin/AdminReviewCard";
import { ReviewsStatsCards } from "@/components/admin/ReviewsStatsCards";
import { ReviewsFilters } from "@/components/admin/ReviewsFilters";

import { Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";

interface ReviewFilters {
  itemType?: string;
  isApproved?: boolean;
  rating?: { min?: number; max?: number };
  dateRange?: { start?: number; end?: number };
  searchTerm?: string;
  partnerId?: string;
}

export default function AdminReviewsPage() {
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Carregar estatísticas
  const stats = useQuery(api.domains.reviews.queries.getReviewsStats, {});
  
  // Carregar reviews com paginação
  const {
    results: reviews,
    status,
    loadMore
  } = usePaginatedQuery(
    api.domains.reviews.queries.listAllReviewsAdmin,
    { filters },
    { initialNumItems: 20 }
  );

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
  };

  const handleExportReviews = () => {
    toast.info("Exportação de reviews será implementada em breve");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Reviews</h1>
          <p className="text-muted-foreground">
            Visualize e modere todas as avaliações do sistema
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={handleExportReviews}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <ReviewsStatsCards stats={stats} />

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewsFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Busca rápida */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por título ou comentário..."
              value={filters.searchTerm || ""}
              onChange={(e) => handleFiltersChange({ ...filters, searchTerm: e.target.value || undefined })}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews ({reviews?.length || 0})</span>
            {status === "LoadingFirstPage" && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "LoadingFirstPage" && reviews?.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reviews?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhuma review encontrada com os filtros aplicados.
              </p>
              <Button
                variant="outline"
                onClick={() => setFilters({})}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reviews?.map((review) => (
                  <AdminReviewCard 
                    key={review._id} 
                    review={review}
                    onStatusChange={() => {
                      // A paginação reativa do Convex irá atualizar automaticamente
                      toast.success("Review atualizada com sucesso!");
                    }}
                  />
                ))}
              </div>
              
              {status === "CanLoadMore" && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => loadMore(20)}
                    disabled={status === "LoadingMore"}
                    variant="outline"
                  >
                    {status === "LoadingMore" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Carregando...
                      </>
                    ) : (
                      "Carregar Mais"
                    )}
                  </Button>
                </div>
              )}
              
              {status === "Exhausted" && reviews.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    Todas as reviews foram carregadas
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 