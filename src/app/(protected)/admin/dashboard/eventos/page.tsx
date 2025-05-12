"use client"

import { useState, useMemo, useEffect } from "react"
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useToggleFeatured, useToggleActive, type Event } from "@/lib/services/eventService"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventsHeader, EventsFilter, EventsGrid, EventsPagination, EventForm } from "@/components/dashboard/events"
import { AnimatePresence, motion } from "framer-motion"

export default function EventsPage() {
  const { events, isLoading } = useEvents()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  const toggleFeatured = useToggleFeatured()
  const toggleActive = useToggleActive()
  const { user } = useCurrentUser()
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for filtering and pagination
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const itemsPerPage = 6
  
  // Filter events based on filter and search query
  const filteredEvents = useMemo(() => {
    if (!events) return []
    
    return events.filter(event => {
      // Filter by status
      if (filter === "active" && !event.isActive) return false
      if (filter === "inactive" && event.isActive) return false
      if (filter === "featured" && !event.isFeatured) return false
      
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower) ||
          event.category.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })
  }, [events, filter, searchQuery])
  
  // Sort events by date (most recent first)
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      // First by date
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  }, [filteredEvents])
  
  // Paginate events
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage)
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedEvents.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedEvents, currentPage])
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Handle event operations
  const handleCreateEvent = async (eventData: Event) => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um evento")
      return
    }
    
    try {
      setIsSubmitting(true)
      await createEvent(eventData, user.id)
      toast.success("Evento criado com sucesso!")
      setDialogOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error("Erro ao criar evento:", error)
      toast.error("Erro ao criar evento")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleUpdateEvent = async (eventData: Event) => {
    try {
      setIsSubmitting(true)
      await updateEvent(eventData)
      toast.success("Evento atualizado com sucesso!")
      setDialogOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error("Erro ao atualizar evento:", error)
      toast.error("Erro ao atualizar evento")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteEvent = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      try {
        await deleteEvent(id)
        toast.success("Evento excluído com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir evento:", error)
        toast.error("Erro ao excluir evento")
      }
    }
  }
  
  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await toggleFeatured(id, featured)
      toast.success(featured ? "Evento destacado!" : "Destaque removido!")
    } catch (error) {
      console.error("Erro ao alterar destaque do evento:", error)
      toast.error("Erro ao alterar destaque")
    }
  }
  
  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleActive(id, active)
      toast.success(active ? "Evento ativado!" : "Evento desativado!")
    } catch (error) {
      console.error("Erro ao alterar status do evento:", error)
      toast.error("Erro ao alterar status")
    }
  }
  
  // Dialog handlers
  const openCreateDialog = () => {
    setSelectedEvent(null)
    setDialogOpen(true)
  }
  
  const openEditDialog = (event: Event) => {
    setSelectedEvent(event)
    setDialogOpen(true)
  }
  
  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedEvent(null)
  }
  
  // Reset to first page when filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
      <EventsHeader openCreateDialog={openCreateDialog} />

      {/* Filters and actions */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
        <EventsFilter 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          showMobileFilter={showMobileFilter}
          setShowMobileFilter={setShowMobileFilter}
        />
      </div>

      {/* Events grid */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <EventsGrid
            events={paginatedEvents}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onEdit={openEditDialog}
            onDelete={handleDeleteEvent}
            onToggleFeatured={handleToggleFeatured}
            onToggleActive={handleToggleActive}
          />
        </AnimatePresence>
      </div>
      
      {/* Pagination */}
      <EventsPagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        handlePageChange={handlePageChange} 
      />

      {/* Create/Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[850px] bg-white/95 backdrop-blur-md border-none shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold">
              {selectedEvent ? "Editar Evento" : "Adicionar Novo Evento"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent 
                ? "Atualize as informações do evento conforme necessário." 
                : "Preencha as informações do novo evento. Clique em Criar Evento quando finalizar."}
            </DialogDescription>
          </DialogHeader>
          <EventForm 
            event={selectedEvent} 
            onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={closeDialog}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}