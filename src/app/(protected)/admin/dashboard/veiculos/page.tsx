"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CarFront, Plus, Loader2, PenSquare, Trash2, Calendar, DollarSign, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import VehicleList from "@/components/dashboard/vehicles/VehicleList";
import VehicleForm from "@/components/dashboard/vehicles/VehicleForm";
import { useVehicleStats, useDeleteVehicle } from "@/lib/services/vehicleService";
import type { Id } from "@/../convex/_generated/dataModel";
import { DashboardPageHeader } from "../components";

export default function VehiclesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<Id<"vehicles"> | null>(null);
  const [vehicleToRemove, setVehicleToRemove] = useState<Id<"vehicles"> | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "all",
    status: "all"
  });

  const { stats, isLoading: isLoadingStats } = useVehicleStats();
  const deleteVehicle = useDeleteVehicle();

  const openAddVehicleDialog = () => {
    setEditMode(null);
    setDialogOpen(true);
  };

  const openEditVehicleDialog = (vehicleId: string) => {
    setEditMode(vehicleId as Id<"vehicles">);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(null);
  };

  const openDeleteDialog = (vehicleId: string) => {
    setVehicleToRemove(vehicleId as Id<"vehicles">);
    setConfirmDialogOpen(true);
  };

  const applyFilters = () => {
    setAppliedFilters({ search, category: categoryFilter, status: statusFilter });
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setAppliedFilters({ search: "", category: "all", status: "all" });
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToRemove) return;
    setIsLoading(true);
    try {
      await deleteVehicle(vehicleToRemove);
      toast.success("Veículo removido com sucesso");
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erro ao remover veículo");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Gerenciamento de Veículos"
        description="Gerencie os veículos disponíveis para aluguel"
        icon={CarFront}
        iconBgClassName="bg-blue-50"
        iconColorClassName="text-blue-600"
      >
        <Button onClick={openAddVehicleDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Veículo
        </Button>
      </DashboardPageHeader>

      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicles" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search" className="mb-2 block">Buscar</Label>
                  <Input id="search" placeholder="Pesquisar veículos..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="w-full sm:w-auto">
                  <Label htmlFor="category" className="mb-2 block">Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category" className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="economy">Econômico</SelectItem>
                      <SelectItem value="compact">Compacto</SelectItem>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="luxury">Luxo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-auto">
                  <Label htmlFor="status" className="mb-2 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status" className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="rented">Alugado</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={resetFilters}>Limpar</Button>
                  <Button onClick={applyFilters}><Filter className="h-4 w-4 mr-2" />Filtrar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <VehicleList search={appliedFilters.search} category={appliedFilters.category} status={appliedFilters.status} onEdit={openEditVehicleDialog} onDelete={openDeleteDialog} />
        </TabsContent>
        
        <TabsContent value="bookings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reservas de Veículos</CardTitle>
              <CardDescription>Visualize e gerencie as reservas de veículos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-md">
                <Calendar className="h-10 w-10 text-slate-400 mb-4" />
                <p className="text-slate-500 text-center max-w-md">A funcionalidade de reservas será implementada em breve.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de Veículos</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? <div className="animate-pulse h-7 w-12 bg-slate-200 rounded" /> : stats.totalVehicles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Veículos Alugados</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? <div className="animate-pulse h-7 w-12 bg-slate-200 rounded" /> : stats.rentedVehicles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita Mensal</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? <div className="animate-pulse h-7 w-28 bg-slate-200 rounded" /> : formatCurrency(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Aluguel</CardTitle>
              <CardDescription>Visualize estatísticas sobre os aluguéis de veículos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-md">
                <DollarSign className="h-10 w-10 text-slate-400 mb-4" />
                <p className="text-slate-500 text-center max-w-md">As estatísticas detalhadas de aluguel serão implementadas em breve.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CarFront className="h-5 w-5" />
              {editMode ? "Editar Veículo" : "Adicionar Novo Veículo"}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm onSubmit={() => setDialogOpen(false)} onCancel={handleCloseDialog} editMode={editMode} />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Remover Veículo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 leading-relaxed">Tem certeza que deseja remover este veículo? Esta ação é irreversível.</p>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={isLoading} className="min-w-[100px]">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 