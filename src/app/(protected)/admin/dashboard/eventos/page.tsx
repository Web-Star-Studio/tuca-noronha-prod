"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Calendar, 
  Search, 
  Plus, 
  MapPin, 
  Users, 
  Clock,
  Star,
  Trash2,
  Edit3,
  Eye,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Download
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { EventForm } from "@/components/dashboard/events/EventForm"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { DashboardPageHeader } from "../components"

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [symplaToken, setSymplaToken] = useState("")
  const [syncLoading, setSyncLoading] = useState(false)

  // Get current user
  const currentUser = useCurrentUser()

  // Fetch events
  const events = useQuery(api.domains.events.queries.getEventsForAdmin, {})

  // Mutations
  const deleteEvent = useMutation(api.domains.events.mutations.remove)
  const toggleEventFeatured = useMutation(api.domains.events.mutations.toggleFeatured)
  const createEvent = useMutation(api.domains.events.mutations.create)
  const updateEvent = useMutation(api.domains.events.mutations.update)
  
  // Actions
  const syncFromSympla = useAction(api.domains.events.actions.syncFromSympla)

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!events) return []
    
    return events.filter(event => {
      // Filter by status
      if (statusFilter === "active" && !event.isActive) return false
      if (statusFilter === "inactive" && event.isActive) return false
      if (statusFilter === "featured" && !event.isFeatured) return false
      if (statusFilter === "upcoming" && new Date(event.date) < new Date()) return false
      if (statusFilter === "past" && new Date(event.date) > new Date()) return false
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          event.category?.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })
  }, [events, statusFilter, searchTerm])

  // Calculate stats
  const stats = useMemo(() => {
    if (!events) return { total: 0, active: 0, featured: 0, upcoming: 0, past: 0 }
    
    const now = new Date()
    return {
      total: events.length,
      active: events.filter(e => e.isActive).length,
      featured: events.filter(e => e.isFeatured).length,
      upcoming: events.filter(e => new Date(e.date) > now).length,
      past: events.filter(e => new Date(e.date) < now).length,
    }
  }, [events])

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent({ id: eventId })
      toast.success("Evento excluído com sucesso!")
      setConfirmDeleteId(null)
    } catch {
      toast.error("Erro ao excluir evento")
      console.error(error)
    }
  }

  const handleCreateEvent = async (eventData: any) => {
    if (!currentUser.user?._id) {
      toast.error("Usuário não encontrado")
      return
    }

    try {
      const formattedData = {
        title: eventData.title,
        description: eventData.description,
        shortDescription: eventData.shortDescription,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        address: eventData.address,
        price: eventData.price,
        category: eventData.category,
        maxParticipants: eventData.maxParticipants,
        imageUrl: eventData.imageUrl,
        galleryImages: eventData.galleryImages || [],
        highlights: eventData.highlights || [],
        includes: eventData.includes || [],
        additionalInfo: eventData.additionalInfo || [],
        speaker: eventData.speaker || "",
        speakerBio: eventData.speakerBio || "",
        isFeatured: eventData.isFeatured,
        isActive: eventData.isActive,
        hasMultipleTickets: eventData.hasMultipleTickets || false,
        partnerId: currentUser.user._id,
        symplaUrl: eventData.symplaUrl || "",
        whatsappContact: eventData.whatsappContact || "",
      }

      if (selectedEvent?._id) {
        // Update existing event
        await updateEvent({ id: selectedEvent._id, ...formattedData })
        toast.success("Evento atualizado com sucesso!")
      } else {
        // Create new event
        await createEvent(formattedData)
        toast.success("Evento criado com sucesso!")
      }
      
      setShowCreateModal(false)
      setSelectedEvent(null)
    } catch {
      toast.error(selectedEvent?._id ? "Erro ao atualizar evento" : "Erro ao criar evento")
      console.error(error)
    }
  }

  const handleSyncSympla = async () => {
    if (!symplaToken.trim()) {
      toast.error("Token do Sympla é obrigatório")
      return
    }

    if (!currentUser.user?._id) {
      toast.error("Usuário não encontrado")
      return
    }

    setSyncLoading(true)
    try {
      await syncFromSympla({
        symplaToken: symplaToken.trim(),
        partnerId: currentUser.user._id
      })
      toast.success("Sincronização com Sympla realizada com sucesso!")
      setShowSyncModal(false)
      setSymplaToken("")
    } catch {
      toast.error("Erro ao sincronizar com Sympla")
      console.error(error)
    } finally {
      setSyncLoading(false)
    }
  }

  const handleToggleFeatured = async (eventId: string, featured: boolean) => {
    try {
      await toggleEventFeatured({ id: eventId, isFeatured: featured })
      toast.success(featured ? "Evento destacado!" : "Destaque removido!")
    } catch {
      toast.error("Erro ao alterar destaque")
      console.error(error)
    }
  }

  const openEventDetails = (event: any) => {
    setSelectedEvent(event)
    setShowDetailsDialog(true)
  }

  const getEventStatus = (event: any) => {
    const now = new Date()
    const eventDate = new Date(event.date)

    if (!event.isActive) return { label: "Inativo", color: "bg-gray-100 text-gray-800" }
    if (eventDate < now) return { label: "Finalizado", color: "bg-blue-100 text-blue-800" }
    if (eventDate > now) return { label: "Futuro", color: "bg-green-100 text-green-800" }
    return { label: "Em Andamento", color: "bg-yellow-100 text-yellow-800" }
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <DashboardPageHeader
        title="Eventos"
        description="Gerencie todos os eventos da plataforma"
        icon={Calendar}
        iconBgClassName="bg-purple-50"
        iconColorClassName="text-purple-600"
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowSyncModal(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Sincronizar Sympla
          </Button>
          
          <Button 
            onClick={() => {
              setSelectedEvent(null)
              setShowCreateModal(true)
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Evento
          </Button>
        </div>
      </DashboardPageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
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
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Destacados</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Futuros</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                <p className="text-2xl font-bold text-gray-600">{stats.past}</p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar eventos por título, local, categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-0 bg-muted/30"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-0 bg-muted/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="featured">Destacados</SelectItem>
                <SelectItem value="upcoming">Futuros</SelectItem>
                <SelectItem value="past">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-purple-600" />
            Lista de Eventos
            {filteredEvents.length > 0 && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventos"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!events ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {searchTerm ? "Nenhum evento encontrado" : "Nenhum evento ainda"}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed mb-8">
                {searchTerm 
                  ? `Não encontramos eventos para "${searchTerm}"`
                  : "Comece criando eventos para atrair turistas e visitantes."
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Evento
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const status = getEventStatus(event)
                
                return (
                  <Card key={event._id} className="border border-border/50 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap gap-3 items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          {/* Event Image */}
                          <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                            {event.imageUrl ? (
                              <Image 
                                src={event.imageUrl} 
                                alt={event.title}
                                className="w-full h-full object-cover rounded-xl"
                                width={80}
                                height={80}
                              />
                            ) : (
                              <Calendar className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          
                          {/* Event Info */}
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-foreground text-lg">
                                  {event.title}
                                </h3>
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                                {event.isFeatured && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    <Star className="w-3 h-3 mr-1" />
                                    Destacado
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {event.description}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(event.date), "PPP", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {event.time}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  {event.location}
                                </div>
                              )}
                              {event.maxParticipants && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  Máx. {Number(event.maxParticipants)} pessoas
                                </div>
                              )}
                              {event.price && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DollarSign className="w-4 h-4" />
                                  R$ {event.price.toFixed(2)}
                                </div>
                              )}
                              {event.category && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Badge variant="outline" className="h-fit">
                                    {event.category}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEventDetails(event)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleFeatured(event._id, !event.isFeatured)}
                            className={event.isFeatured ? "text-yellow-600 border-yellow-200 bg-yellow-50" : ""}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowCreateModal(true)
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteId(event._id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-purple-600" />
                {selectedEvent.title}
              </DialogTitle>
              <DialogDescription>
                Detalhes completos do evento
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Event Image */}
              {selectedEvent.imageUrl && (
                <div className="w-full h-48 bg-muted rounded-xl overflow-hidden">
                  <Image 
                    src={selectedEvent.imageUrl} 
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                    width={400}
                    height={192}
                  />
                </div>
              )}
              
              {/* Event Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-foreground mt-1">{selectedEvent.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p className="text-foreground mt-1">{selectedEvent.category || "Não informada"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Evento</label>
                  <p className="text-foreground mt-1">
                    {format(new Date(selectedEvent.date), "PPP", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Horário</label>
                  <p className="text-foreground mt-1">
                    {selectedEvent.time}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Local</label>
                  <p className="text-foreground mt-1">{selectedEvent.location || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Preço</label>
                  <p className="text-foreground mt-1">
                    {selectedEvent.price ? `R$ ${selectedEvent.price.toFixed(2)}` : "Gratuito"}
                  </p>
                </div>
                {selectedEvent.maxParticipants && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Máximo de Participantes</label>
                    <p className="text-foreground mt-1">{Number(selectedEvent.maxParticipants)} pessoas</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getEventStatus(selectedEvent).color}>
                      {getEventStatus(selectedEvent).label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsDialog(false)
                  setShowCreateModal(true)
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar Evento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir este evento?
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-700">
                Ao excluir este evento, todas as reservas associadas também serão canceladas.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteEvent(confirmDeleteId)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Evento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Event Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-purple-600" />
              {selectedEvent ? "Editar Evento" : "Criar Novo Evento"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent 
                ? "Edite as informações do evento abaixo" 
                : "Preencha as informações do evento para criá-lo na plataforma"
              }
            </DialogDescription>
          </DialogHeader>
          
          <EventForm
            event={selectedEvent}
            onSubmit={handleCreateEvent}
            onCancel={() => {
              setShowCreateModal(false)
              setSelectedEvent(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Sympla Sync Modal */}
      <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Download className="h-6 w-6 text-blue-600" />
              Sincronizar com Sympla
            </DialogTitle>
            <DialogDescription>
              Importe eventos diretamente da sua conta Sympla
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Token de Acesso do Sympla
              </label>
              <Input
                type="password"
                placeholder="Cole seu token do Sympla aqui..."
                value={symplaToken}
                onChange={(e) => setSymplaToken(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Você pode encontrar seu token na seção &quot;API&quot; do painel do Sympla
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex gap-3">
                <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Como funciona a sincronização?
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Seus eventos do Sympla serão importados e sincronizados automaticamente.
                    Eventos existentes serão atualizados, novos eventos serão criados.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSyncModal(false)
                setSymplaToken("")
              }}
              disabled={syncLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSyncSympla}
              disabled={!symplaToken.trim() || syncLoading}
              className="gap-2"
            >
              {syncLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Sincronizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}