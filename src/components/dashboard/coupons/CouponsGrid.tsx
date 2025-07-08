"use client";

import { useState } from "react";
import CouponCard from "./CouponCard";
import CouponForm from "./CouponForm";
import CouponFilters from "./CouponFilters";
import CouponStats from "./CouponStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Plus, Search, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface CouponsGridProps {
  partnerId?: string;
  organizationId?: string;
}

export default function CouponsGrid({ partnerId, organizationId }: CouponsGridProps) {
  const { user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [filters, setFilters] = useState({
    isActive: undefined as boolean | undefined,
    type: undefined as string | undefined,
    validOnly: false,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 12;

  // Queries
  const couponsData = useQuery(api.domains.coupons.queries.listCoupons, {
    partnerId: partnerId as any,
    organizationId: organizationId as any,
    isActive: filters.isActive,
    type: filters.type,
    limit: itemsPerPage,
    offset: currentPage * itemsPerPage,
  });

  // Mutations
  const createCoupon = useMutation(api.domains.coupons.mutations.createCoupon);
  const updateCoupon = useMutation(api.domains.coupons.mutations.updateCoupon);
  const deleteCoupon = useMutation(api.domains.coupons.mutations.deleteCoupon);
  const toggleStatus = useMutation(api.domains.coupons.mutations.toggleCouponStatus);

  const coupons = couponsData?.coupons || [];
  const totalCount = couponsData?.totalCount || 0;
  const hasMore = couponsData?.hasMore || false;

  // Filtrar cupons por termo de busca
  const filteredCoupons = coupons.filter(coupon => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      coupon.code.toLowerCase().includes(searchLower) ||
      coupon.name.toLowerCase().includes(searchLower) ||
      coupon.description.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateCoupon = async (data: any) => {
    try {
      await createCoupon(data);
      setIsCreateDialogOpen(false);
      toast({
        title: "Cupom criado",
        description: "O cupom foi criado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o cupom. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateCoupon = async (data: any) => {
    if (!selectedCoupon) return;

    try {
      // Create a new object without the _id field
      const { _id, ...updateData } = data;
      
      await updateCoupon({
        couponId: selectedCoupon._id,
        ...updateData,
      });
      
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      toast({
        title: "Cupom atualizado",
        description: "O cupom foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cupom. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await deleteCoupon({ couponId: couponId as any });
      toast({
        title: "Cupom excluído",
        description: "O cupom foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cupom. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (couponId: string, isActive: boolean) => {
    try {
      await toggleStatus({ couponId: couponId as any, isActive });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do cupom.",
        variant: "destructive",
      });
    }
  };

  const handleEditCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsEditDialogOpen(true);
  };

  const handleViewDetails = (coupon: any) => {
    // Implementar modal de detalhes
    console.log("Ver detalhes:", coupon);
  };

  const handleViewUsage = (coupon: any) => {
    // Implementar modal de histórico de uso
    console.log("Ver uso:", coupon);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (!user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <CouponStats partnerId={partnerId} organizationId={organizationId} />

      {/* Header e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cupons de Desconto</h2>
          <p className="text-muted-foreground">
            {totalCount} cupom(s) encontrado(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cupom
          </Button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar cupons por código, nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <CouponFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({
              isActive: undefined,
              type: undefined,
              validOnly: false,
            })}
          />
        )}
      </div>

      {/* Grid de Cupons */}
      {couponsData === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Nenhum cupom encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || Object.values(filters).some(Boolean)
                  ? "Tente ajustar os filtros ou termo de busca."
                  : "Comece criando seu primeiro cupom de desconto."}
              </p>
              {!searchTerm && !Object.values(filters).some(Boolean) && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Cupom
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <CouponCard
                key={coupon._id}
                coupon={coupon}
                onEdit={handleEditCoupon}
                onDelete={handleDeleteCoupon}
                onToggleStatus={handleToggleStatus}
                onViewDetails={handleViewDetails}
                onViewUsage={handleViewUsage}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                disabled={!hasMore}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialog de Criar Cupom */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Cupom</DialogTitle>
          </DialogHeader>
          <CouponForm
            onSubmit={handleCreateCoupon}
            onCancel={() => setIsCreateDialogOpen(false)}
            title="Criar Cupom"
            description="Configure os detalhes do novo cupom de desconto"
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Cupom */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cupom</DialogTitle>
          </DialogHeader>
          {selectedCoupon && (
            <CouponForm
              initialData={{
                _id: selectedCoupon._id,
                code: selectedCoupon.code,
                name: selectedCoupon.name,
                description: selectedCoupon.description,
                discountType: selectedCoupon.discountType,
                discountValue: selectedCoupon.discountValue,
                maxDiscountAmount: selectedCoupon.maxDiscountAmount,
                minimumOrderValue: selectedCoupon.minimumOrderValue,
                maximumOrderValue: selectedCoupon.maximumOrderValue,
                usageLimit: selectedCoupon.usageLimit,
                userUsageLimit: selectedCoupon.userUsageLimit,
                validFrom: new Date(selectedCoupon.validFrom).toISOString().slice(0, 16),
                validUntil: new Date(selectedCoupon.validUntil).toISOString().slice(0, 16),
                type: selectedCoupon.type,
                isActive: selectedCoupon.isActive,
                isPubliclyVisible: selectedCoupon.isPubliclyVisible,
                stackable: selectedCoupon.stackable,
                autoApply: selectedCoupon.autoApply,
                notifyOnExpiration: selectedCoupon.notifyOnExpiration,
                globalApplication: selectedCoupon.globalApplication,
                applicableAssets: selectedCoupon.applicableAssets,
                allowedUsers: selectedCoupon.allowedUsers,
              }}
              onSubmit={handleUpdateCoupon}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedCoupon(null);
              }}
              title="Editar Cupom"
              description="Atualize os detalhes do cupom de desconto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}