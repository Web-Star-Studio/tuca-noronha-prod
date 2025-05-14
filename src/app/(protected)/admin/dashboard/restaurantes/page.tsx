"use client"

import { useState, useMemo, useEffect } from "react"
import { useRestaurants, useCreateRestaurant, useUpdateRestaurant, useDeleteRestaurant, useToggleFeatured, useToggleActive, type Restaurant } from "@/lib/services/restaurantService"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  RestaurantsHeader, 
  RestaurantsFilter, 
  RestaurantsGrid, 
  RestaurantsPagination, 
  RestaurantForm
} from "@/components/dashboard/restaurants"
import { AnimatePresence, motion } from "framer-motion"

export default function RestaurantsPage() {
  const { restaurants, isLoading } = useRestaurants()
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
  
  // State for filtering and pagination
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
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
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  
  // Handle restaurant operations
  const handleCreateRestaurant = async (restaurantData: Restaurant) => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um restaurante")
      return
    }
    
    try {
      setIsSubmitting(true)
      await createRestaurant(restaurantData, user.id)
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
    if (confirm("Tem certeza que deseja excluir este restaurante?")) {
      try {
        await deleteRestaurant(id)
        toast.success("Restaurante excluído com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir restaurante:", error)
        toast.error("Erro ao excluir restaurante")
      }
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
      className="relative space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50 pointer-events-none -z-10" />
      <div className="fixed top-1/4 right-1/3 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000 pointer-events-none -z-10" />

      {/* Page content */}
      <RestaurantsHeader openCreateDialog={openCreateDialog} />

      {/* Filters and actions */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
        <RestaurantsFilter 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          showMobileFilter={showMobileFilter}
          setShowMobileFilter={setShowMobileFilter}
        />
      </div>

      {/* Restaurants grid */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <RestaurantsGrid
            restaurants={paginatedRestaurants}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onEdit={openEditDialog}
            onDelete={handleDeleteRestaurant}
            onToggleFeatured={handleToggleFeatured}
            onToggleActive={handleToggleActive}
          />
        </AnimatePresence>
      </div>
      
      {/* Pagination */}
      <RestaurantsPagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        handlePageChange={handlePageChange} 
      />

      {/* Create/Edit Restaurant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] bg-white/95 backdrop-blur-md border-none shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold">
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
    </motion.div>
  )
}