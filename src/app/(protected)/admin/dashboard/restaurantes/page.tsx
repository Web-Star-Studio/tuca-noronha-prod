"use client"

import { useState, useMemo, useEffect } from "react"
import { useRestaurantsWithCreators, useCreateRestaurant, useUpdateRestaurant, useDeleteRestaurant, useToggleFeatured, useToggleActive } from "@/lib/services/restaurantService"
import { Restaurant } from "@/lib/services/restaurantService"
import type { Id } from "@/../convex/_generated/dataModel"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trash2, Store, Plus, Search, Filter } from "lucide-react"
import { 
  RestaurantsHeader, 
  RestaurantsFilter, 
  RestaurantsGrid, 
  RestaurantsPagination, 
  RestaurantForm
} from "@/components/dashboard/restaurants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ui } from "@/lib/ui-config"
import { motion } from "framer-motion"
import { DashboardPageHeader } from "../components"

export default function RestaurantsPage() {
  const { restaurants, isLoading } = useRestaurantsWithCreators()
  const createRestaurant = useCreateRestaurant()
  const updateRestaurant = useUpdateRestaurant()
  const deleteRestaurant = useDeleteRestaurant()
  const toggleFeatured = useToggleFeatured()
  const toggleActive = useToggleActive()
  const { user } = useCurrentUser()
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  
  // State for filtering and pagination
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  
  // Filter restaurants based on filter and search query
  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return []
    
    return restaurants.filter(restaurant => {
      // Filter by status
      if (filter === "active" && !restaurant.isActive) return false
      if (filter === "inactive" && restaurant.isActive) return false
      if (filter === "featured" && !restaurant.isFeatured) return false
      
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        return (
          restaurant.name.toLowerCase().includes(searchLower) ||
          restaurant.description.toLowerCase().includes(searchLower) ||
          restaurant.address?.city?.toLowerCase().includes(searchLower) ||
          restaurant.cuisine.some(cuisine => cuisine.toLowerCase().includes(searchLower)) ||
          restaurant.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }
      
      return true
    })
  }, [restaurants, filter, searchQuery])
  
  // Sort restaurants by name
  const sortedRestaurants = useMemo(() => {
    return [...filteredRestaurants].sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  }, [filteredRestaurants])
  
  // Paginate restaurants
  const totalPages = Math.ceil(sortedRestaurants.length / itemsPerPage)
  const paginatedRestaurants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedRestaurants.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedRestaurants, currentPage])
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!restaurants) return { total: 0, active: 0, featured: 0, inactive: 0 };
    return {
      total: restaurants.length,
      active: restaurants.filter(r => r.isActive).length,
      featured: restaurants.filter(r => r.isFeatured).length,
      inactive: restaurants.filter(r => !r.isActive).length,
    };
  }, [restaurants]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  
  // Handle restaurant operations
  const handleCreateRestaurant = async (restaurantData: Restaurant) => {
    console.log("handleCreateRestaurant called with data:", restaurantData);
    
    if (!user) {
      toast.error("Você precisa estar logado para criar um restaurante")
      return
    }
    
    try {
      setIsSubmitting(true)
      const userId = user._id 
      console.log("Creating restaurant with userId:", userId);
      console.log("Restaurant data:", restaurantData);
      
      await createRestaurant(restaurantData, userId)
      toast.success("Restaurante criado com sucesso!")
      setDialogOpen(false)
      setSelectedRestaurant(null)
    } catch (error) {
      console.error("Erro ao criar restaurante:", error)
      toast.error("Erro ao criar restaurante")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleUpdateRestaurant = async (restaurantData: Restaurant) => {
    try {
      setIsSubmitting(true)
      await updateRestaurant(restaurantData)
      toast.success("Restaurante atualizado com sucesso!")
      setDialogOpen(false)
      setSelectedRestaurant(null)
    } catch (error) {
      console.error("Erro ao atualizar restaurante:", error)
      toast.error("Erro ao atualizar restaurante")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteRestaurant = async (id: string) => {
    try {
      await deleteRestaurant(id)
      toast.success("Restaurante excluído com sucesso!")
      setConfirmDeleteId(null)
    } catch (error) {
      console.error("Erro ao excluir restaurante:", error)
      toast.error("Erro ao excluir restaurante")
    }
  }
  
  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await toggleFeatured(id, featured)
      toast.success(featured ? "Restaurante destacado!" : "Destaque removido!")
    } catch (error) {
      console.error("Erro ao alterar destaque do restaurante:", error)
      toast.error("Erro ao alterar destaque")
    }
  }
  
  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleActive(id, active)
      toast.success(active ? "Restaurante ativado!" : "Restaurante desativado!")
    } catch (error) {
      console.error("Erro ao alterar status do restaurante:", error)
      toast.error("Erro ao alterar status")
    }
  }
  
  // Dialog handlers
  const openCreateDialog = () => {
    setSelectedRestaurant(null)
    setDialogOpen(true)
  }
  
  const openEditDialog = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setDialogOpen(true)
  }
  
  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedRestaurant(null)
  }
  
  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])
  
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header - Design Minimalista */}
      <DashboardPageHeader
        title="Restaurantes"
        description="Gerencie todos os restaurantes da plataforma"
        icon={Store}
        iconBgClassName="bg-orange-50"
        iconColorClassName="text-orange-600"
      >
        <Button
          onClick={openCreateDialog}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Restaurante
        </Button>
      </DashboardPageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Destacados</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar restaurantes por nome, cidade, culinária..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 bg-muted/30"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border-0 bg-muted/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="featured">Destacados</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Restaurants Grid */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <Store className="h-5 w-5 text-orange-600" />
            Lista de Restaurantes
            {filteredRestaurants.length > 0 && (
              <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                {filteredRestaurants.length} {filteredRestaurants.length === 1 ? "restaurante" : "restaurantes"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {searchQuery ? "Nenhum restaurante encontrado" : "Nenhum restaurante ainda"}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed mb-8">
                {searchQuery 
                  ? `Não encontramos restaurantes para "${searchQuery}"`
                  : "Comece adicionando restaurantes para gerenciar a gastronomia da plataforma."
                }
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Restaurante
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Restaurants grid */}
              <RestaurantsGrid
                restaurants={paginatedRestaurants}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onEdit={openEditDialog}
                onDelete={(id) => setConfirmDeleteId(id)}
                onToggleFeatured={handleToggleFeatured}
                onToggleActive={handleToggleActive}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <RestaurantsPagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  handlePageChange={handlePageChange} 
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Restaurant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Store className="h-5 w-5 text-orange-600" />
              {selectedRestaurant ? "Editar Restaurante" : "Adicionar Novo Restaurante"}
            </DialogTitle>
            <DialogDescription>
              {selectedRestaurant 
                ? "Atualize as informações do restaurante conforme necessário." 
                : "Preencha as informações do novo restaurante. Clique em Criar Restaurante quando finalizar."}
            </DialogDescription>
          </DialogHeader>
          <RestaurantForm 
            restaurant={selectedRestaurant} 
            onSubmit={selectedRestaurant ? handleUpdateRestaurant : handleCreateRestaurant}
            onCancel={closeDialog}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir este restaurante?
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-700">
                Ao excluir este restaurante, todos os dados associados também serão removidos.
              </p>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteRestaurant(confirmDeleteId)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  )
}