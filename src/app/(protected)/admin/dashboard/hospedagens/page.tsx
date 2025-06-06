"use client"

import { useState, useMemo, useEffect } from "react"
import { useAllAccommodations, useCreateAccommodation, useUpdateAccommodation, useDeleteAccommodation, useToggleFeatured, useToggleActive } from "@/lib/services/accommodationService"
import { Accommodation } from "@/lib/services/accommodationService"
import type { Id } from "@/../convex/_generated/dataModel"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  AccommodationsHeader, 
  AccommodationsFilter, 
  AccommodationsGrid, 
  AccommodationsPagination, 
  AccommodationForm
} from "@/components/dashboard/accommodations"
import { AnimatePresence, motion } from "framer-motion"

export default function AccommodationsPage() {
  const { accommodations, isLoading } = useAllAccommodations()
  const createAccommodation = useCreateAccommodation()
  const updateAccommodation = useUpdateAccommodation()
  const deleteAccommodation = useDeleteAccommodation()
  const toggleFeatured = useToggleFeatured()
  const toggleActive = useToggleActive()
  const { user } = useCurrentUser()
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for filtering and pagination
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const itemsPerPage = 6
  
  // Filter accommodations based on filter and search query
  const filteredAccommodations = useMemo(() => {
    if (!accommodations) return []
    
    return accommodations.filter(accommodation => {
      // Filter by status
      if (filter === "active" && !accommodation.isActive) return false
      if (filter === "inactive" && accommodation.isActive) return false
      if (filter === "featured" && !accommodation.isFeatured) return false
      
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        return (
          accommodation.name.toLowerCase().includes(searchLower) ||
          accommodation.description.toLowerCase().includes(searchLower) ||
          accommodation.address?.city?.toLowerCase().includes(searchLower) ||
          accommodation.type.toLowerCase().includes(searchLower) ||
          accommodation.amenities.some(amenity => amenity.toLowerCase().includes(searchLower))
        )
      }
      
      return true
    })
  }, [accommodations, filter, searchQuery])
  
  // Sort accommodations by name
  const sortedAccommodations = useMemo(() => {
    return [...filteredAccommodations].sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  }, [filteredAccommodations])
  
  // Paginate accommodations
  const totalPages = Math.ceil(sortedAccommodations.length / itemsPerPage)
  const paginatedAccommodations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedAccommodations.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedAccommodations, currentPage])
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  
  // Handle accommodation operations
  const handleCreateAccommodation = async (accommodationData: Accommodation) => {
    if (!user) {
      toast.error("Você precisa estar logado para criar uma acomodação")
      return
    }
    
    try {
      setIsSubmitting(true)
      // Cast the string ID to the Convex Id<"users"> type
      const userId = user.id as Id<"users"> 
      await createAccommodation(accommodationData, userId)
      toast.success("Acomodação criada com sucesso!")
      setDialogOpen(false)
      setSelectedAccommodation(null)
    } catch (error) {
      console.error("Erro ao criar acomodação:", error)
      toast.error("Erro ao criar acomodação")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleUpdateAccommodation = async (accommodationData: Accommodation) => {
    try {
      setIsSubmitting(true)
      await updateAccommodation(accommodationData)
      toast.success("Acomodação atualizada com sucesso!")
      setDialogOpen(false)
      setSelectedAccommodation(null)
    } catch (error) {
      console.error("Erro ao atualizar acomodação:", error)
      toast.error("Erro ao atualizar acomodação")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteAccommodation = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta acomodação?")) {
      try {
        await deleteAccommodation(id)
        toast.success("Acomodação excluída com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir acomodação:", error)
        toast.error("Erro ao excluir acomodação")
      }
    }
  }
  
  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await toggleFeatured(id, featured)
      toast.success(featured ? "Acomodação destacada!" : "Destaque removido!")
    } catch (error) {
      console.error("Erro ao alterar destaque da acomodação:", error)
      toast.error("Erro ao alterar destaque")
    }
  }
  
  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleActive(id, active)
      toast.success(active ? "Acomodação ativada!" : "Acomodação desativada!")
    } catch (error) {
      console.error("Erro ao alterar status da acomodação:", error)
      toast.error("Erro ao alterar status")
    }
  }
  
  // Dialog handlers
  const openCreateDialog = () => {
    setSelectedAccommodation(null)
    setDialogOpen(true)
  }
  
  const openEditDialog = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    setDialogOpen(true)
  }
  
  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedAccommodation(null)
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
      <AccommodationsHeader openCreateDialog={openCreateDialog} />

      {/* Filters and actions */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
        <AccommodationsFilter 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          showMobileFilter={showMobileFilter}
          setShowMobileFilter={setShowMobileFilter}
        />
      </div>

      {/* Accommodations grid */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <AccommodationsGrid
            accommodations={paginatedAccommodations}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onEdit={openEditDialog}
            onDelete={handleDeleteAccommodation}
            onToggleFeatured={handleToggleFeatured}
            onToggleActive={handleToggleActive}
          />
        </AnimatePresence>
      </div>
      
      {/* Pagination */}
      <AccommodationsPagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        handlePageChange={handlePageChange} 
      />

      {/* Create/Edit Accommodation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] bg-white/95 backdrop-blur-md border-none shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold">
              {selectedAccommodation ? "Editar Acomodação" : "Adicionar Nova Acomodação"}
            </DialogTitle>
            <DialogDescription>
              {selectedAccommodation 
                ? "Atualize as informações da acomodação conforme necessário." 
                : "Preencha as informações da nova acomodação. Clique em Criar Acomodação quando finalizar."}
            </DialogDescription>
          </DialogHeader>
          <AccommodationForm 
            accommodation={selectedAccommodation} 
            onSubmit={selectedAccommodation ? handleUpdateAccommodation : handleCreateAccommodation}
            onCancel={closeDialog}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  )
} 