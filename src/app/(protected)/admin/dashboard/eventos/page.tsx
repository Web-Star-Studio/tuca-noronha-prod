"use client"

import { useState, useMemo, useEffect } from "react"
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useToggleFeatured, useToggleActive, type Event } from "@/lib/services/eventService"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventsHeader, EventsFilter, EventsGrid, EventsPagination, EventForm } from "@/components/dashboard/events"
import { AnimatePresence, motion } from "framer-motion"
import { decorativeBackgrounds, transitionEffects, cardStyles } from "@/lib/ui-config"

export default function EventsPage() {
  const { events, isLoading } = useAdminEvents()
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
    
    console.log("DEBUG - Creating event with user:", user);
    console.log("DEBUG - User clerkId:", user.id);
    console.log("DEBUG - User convexId:", user._id || "not available");
    console.log("DEBUG - User role:", user.role);
    
    try {
      setIsSubmitting(true)
      await createEvent(eventData)
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
    if (!confirm("Tem certeza que deseja excluir este evento?")) {
      return
    }
    
    try {
      await deleteEvent(id)
      toast.success("Evento excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      toast.error("Erro ao excluir evento")
    }
  }
  
  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await toggleFeatured(id, isFeatured)
      toast.success(isFeatured ? "Evento destacado!" : "Evento removido dos destaques")
    } catch (error) {
      console.error("Erro ao destacar evento:", error)
      toast.error("Erro ao destacar evento")
    }
  }
  
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleActive(id, isActive)
      toast.success(isActive ? "Evento ativado!" : "Evento desativado")
    } catch (error) {
      console.error("Erro ao ativar/desativar evento:", error)
      toast.error("Erro ao ativar/desativar evento")
    }
  }
  
  // Open dialog for creating or editing an event
  const openCreateDialog = () => {
    setSelectedEvent(null)
    setDialogOpen(true)
  }
  
  const openEditDialog = (event: Event) => {
    setSelectedEvent(event)
    setDialogOpen(true)
  }
  
  // Reset pagination when filter or search changes
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
      <div className={`fixed inset-0 ${decorativeBackgrounds.gradient.accent} opacity-50 pointer-events-none -z-10`} />
      <div className={`fixed top-1/4 right-1/3 w-96 h-96 bg-blue-200 rounded-full ${decorativeBackgrounds.decorative.blob} animation-delay-2000 pointer-events-none -z-10`} />
      <div className={`fixed bottom-1/4 left-1/3 w-96 h-96 bg-purple-200 rounded-full ${decorativeBackgrounds.decorative.blob} animation-delay-4000 pointer-events-none -z-10`} />

      {/* Page content */}
      <EventsHeader openCreateDialog={openCreateDialog} />

      {/* Filters and actions */}
      <div className={`${cardStyles.base} p-4`}>
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
      {totalPages > 1 && (
        <div className="mt-8">
          <EventsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      
      {/* Event dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`max-w-3xl ${cardStyles.base} max-h-[80vh] overflow-y-auto ${transitionEffects.appear.fadeIn}`}>
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? "Editar Evento" : "Criar Novo Evento"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent 
                ? "Edite os detalhes do evento existente" 
                : "Preencha os detalhes para criar um novo evento"}
            </DialogDescription>
          </DialogHeader>
          
          <EventForm 
            event={selectedEvent}
            onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
            loading={isSubmitting}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}