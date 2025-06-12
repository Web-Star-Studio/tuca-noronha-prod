"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CarFront, Plus, Loader2, PenSquare, Trash2, Calendar, DollarSign, MapPin, Users, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import VehicleList from "@/components/dashboard/vehicles/VehicleList";
import VehicleForm from "@/components/dashboard/vehicles/VehicleForm";
import { useVehicleStats, useDeleteVehicle, useVehicle } from "@/lib/services/vehicleService";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function VehiclesPage() {
  // State for UI
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<Id<"vehicles"> | null>(null);
  const [vehicleToRemove, setVehicleToRemove] = useState<Id<"vehicles"> | null>(null);
  // State for filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "all",
    status: "all"
  });

  // Get vehicle statistics
  const { stats, isLoading: isLoadingStats } = useVehicleStats();
  const { vehicle: editingVehicle } = useVehicle(editMode);
  const deleteVehicle = useDeleteVehicle();

  // Functions for handling dialogs
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

  // Function to apply filters
  const applyFilters = () => {
    setAppliedFilters({
      search,
      category: categoryFilter,
      status: statusFilter
    });
  };

  // Function to reset filters
  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setAppliedFilters({
      search: "",
      category: "all",
      status: "all"
    });
  };

  // Function to handle vehicle deletion
  const handleDeleteVehicle = async () => {
    if (!vehicleToRemove) return;

    try {
      setIsLoading(true);
      await deleteVehicle(vehicleToRemove);
      toast.success("Veículo removido com sucesso");
      setConfirmDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover veículo";
      console.error(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Veículos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os veículos disponíveis para aluguel</p>
        </div>
        
        <Button onClick={openAddVehicleDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Veículo
        </Button>
      </div>

      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Veículos</TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Reservas</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Estatísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicles" className="mt-6">
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search" className="mb-2 block">Buscar</Label>
                <Input 
                  id="search" 
                  placeholder="Pesquisar veículos..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-[150px]">
                <Label htmlFor="category" className="mb-2 block">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="economy">Econômico</SelectItem>
                    <SelectItem value="compact">Compacto</SelectItem>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="luxury">Luxo</SelectItem>
                    <SelectItem value="minivan">Minivan</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <Label htmlFor="status" className="mb-2 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="rented">Alugado</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetFilters}>
                  Limpar
                </Button>
                <Button onClick={applyFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </div>
          
          <VehicleList 
            search={appliedFilters.search}
            category={appliedFilters.category}
            status={appliedFilters.status}
            onEdit={openEditVehicleDialog}
            onDelete={openDeleteDialog}
          />
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
                <p className="text-slate-500 text-center max-w-md">
                  A funcionalidade de reservas será implementada em breve. Você poderá visualizar, 
                  aprovar e gerenciar as reservas de veículos nesta seção.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total de Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="animate-pulse h-7 w-12 bg-slate-200 rounded" />
                  ) : (
                    stats.totalVehicles
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Veículos Alugados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="animate-pulse h-7 w-12 bg-slate-200 rounded" />
                  ) : (
                    stats.rentedVehicles
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Receita Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="animate-pulse h-7 w-28 bg-slate-200 rounded" />
                  ) : (
                    formatCurrency(stats.totalRevenue)
                  )}
                </div>
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
                <p className="text-slate-500 text-center max-w-md">
                  As estatísticas detalhadas de aluguel, incluindo gráficos de receita, 
                  taxa de ocupação e categorias mais populares serão implementadas em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar/editar veículo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{editMode ? "Editar Veículo" : "Adicionar Novo Veículo"}</DialogTitle>
          </DialogHeader>
          
          <VehicleForm 
            onSubmit={() => setDialogOpen(false)} 
            onCancel={handleCloseDialog} 
            editMode={editMode} 
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para remover veículo */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Veículo</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja remover este veículo? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVehicle}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 