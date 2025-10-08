"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  Users, 
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Clock,
  AlertTriangle,
  Star,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardPageHeader } from "../components"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Id } from "@/../convex/_generated/dataModel"

type EventData = {
  _id: Id<"events">;
  title: string;
  description?: string;
  shortDescription: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: number;
  category: string;
  maxParticipants: number | bigint;
  imageUrl: string;
  galleryImages?: string[];
  highlights?: string[];
  includes?: string[];
  additionalInfo?: string[];
  speaker?: string;
  speakerBio?: string;
  isFeatured: boolean;
  isActive: boolean;
  partnerId: Id<"users">;
  symplaUrl?: string;
  whatsappContact?: string;
  _creationTime: number;
  creator?: {
    name?: string;
    email?: string;
  };
};

const eventTypeColors = {
  "music": "bg-purple-100 text-purple-800",
  "gastronomy": "bg-orange-100 text-orange-800",
  "culture": "bg-blue-100 text-blue-800",
  "sport": "bg-green-100 text-green-800",
  "nature": "bg-emerald-100 text-emerald-800"
}

export default function EventosMasterPage() {
  const { user } = useCurrentUser();
  const router = useRouter();

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCity, setSelectedCity] = useState<string>("all")

  // Estados para operações CRUD
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Mutations
  const createEvent = useMutation(api.domains.events.mutations.create);
  const updateEvent = useMutation(api.domains.events.mutations.update);
  const deleteEvent = useMutation(api.domains.events.mutations.remove);
  const toggleFeatured = useMutation(api.domains.events.mutations.toggleFeatured);
  const toggleActive = useMutation(api.domains.events.mutations.toggleActive);

  // Buscar dados - moved before conditional returns
  const systemStats = useQuery(api.domains.users.queries.getSystemStatistics)
  const eventsResult = useQuery(api.domains.events.queries.getEventsWithCreators)
  const partners = useQuery(api.domains.users.queries.getUsersByRole, { role: "partner" })

  // Verificar permissões
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "master") {
    router.push("/admin/dashboard");
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores master podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Handlers para operações CRUD
  const handleCreateEvent = async (formData: any) => {
    try {
      await createEvent(formData);
      toast.success("Evento criado com sucesso!");
      setAddDialogOpen(false);
    } catch {
      toast.error("Erro ao criar evento");
      console.error("Erro ao criar evento:", error);
    }
  };

  const handleUpdateEvent = async (formData: any) => {
    try {
      if (!editingEvent) return;
      await updateEvent({
        id: editingEvent._id,
        ...formData,
      });
      toast.success("Evento atualizado com sucesso!");
      setEditingEvent(null);
    } catch {
      toast.error("Erro ao atualizar evento");
      console.error("Erro ao atualizar evento:", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent({ id: id as Id<"events"> });
      toast.success("Evento removido com sucesso!");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Erro ao remover evento");
      console.error("Erro ao remover evento:", error);
    }
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await toggleFeatured({ id: id as Id<"events">, isFeatured: !isFeatured });
      toast.success(`Evento ${!isFeatured ? "destacado" : "removido dos destaques"} com sucesso!`);
    } catch {
      toast.error("Erro ao alterar destaque");
      console.error("Erro ao alterar destaque:", error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleActive({ id: id as Id<"events">, isActive: !isActive });
      toast.success(`Evento ${!isActive ? "ativado" : "desativado"} com sucesso!`);
    } catch {
      toast.error("Erro ao alterar status");
      console.error("Erro ao alterar status:", error);
    }
  };

  const allEvents = eventsResult || []
  
  // Aplicar filtros do lado do cliente
  const events = allEvents.filter((event: any) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }
    
    // Filtro por status
    if (selectedStatus !== "all") {
      // Determinar status baseado na data
      const eventDate = new Date(event.date)
      const today = new Date()
      let eventStatus = "upcoming"
      
      if (eventDate < today) {
        eventStatus = "finished"
      } else if (eventDate.toDateString() === today.toDateString()) {
        eventStatus = "ongoing"
      }
      
      if (eventStatus !== selectedStatus) {
        return false
      }
    }
    
    // Filtro por tipo/categoria
    if (selectedType !== "all" && event.category !== selectedType) {
      return false
    }
    
    // Filtro por cidade (baseado no location)
    if (selectedCity !== "all") {
      const cityMatches = event.location?.toLowerCase().includes(selectedCity.toLowerCase())
      if (!cityMatches) {
        return false
      }
    }
    
    return true
  })

  // Calculate event statistics from real data
  const eventStats = {
    upcoming: allEvents.filter((event: any) => {
      const eventDate = new Date(event.date)
      return eventDate > new Date()
    }).length,
    totalParticipants: 0, // TODO: Calculate from bookings when available
    averageRating: 4.7 // TODO: Calculate from real ratings when available
  }

  if (!systemStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Carregando eventos...</div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data inválida";
    
    // Extract year, month, day from YYYY-MM-DD string
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return dateString;
    
    const [, year, month, day] = match;
    
    // Create date in local timezone to avoid offset issues
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(date.getTime())) return "Data inválida";
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      "music": "Música",
      "gastronomy": "Gastronomia",
      "culture": "Cultura",
      "sport": "Esporte",
      "nature": "Natureza"
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
        <DashboardPageHeader
          title="Gestão de Eventos"
          description="Visualizar e gerenciar todos os eventos do sistema"
          icon={Calendar}
        />
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Estatísticas dos Eventos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.assets.events}</div>
            <p className="text-xs text-muted-foreground">eventos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {eventStats.upcoming}
            </div>
            <p className="text-xs text-muted-foreground">eventos programados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {eventStats.totalParticipants}
            </div>
            <p className="text-xs text-muted-foreground">inscrições confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{eventStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">de 5 estrelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, organizador ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
                <SelectItem value="ongoing">Em andamento</SelectItem>
                <SelectItem value="finished">Finalizados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="music">Música</SelectItem>
                <SelectItem value="gastronomy">Gastronomia</SelectItem>
                <SelectItem value="culture">Cultura</SelectItem>
                <SelectItem value="sport">Esporte</SelectItem>
                <SelectItem value="nature">Natureza</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localizações</SelectItem>
                <SelectItem value="praia-do-sancho">Praia do Sancho</SelectItem>
                <SelectItem value="vila-dos-remedios">Vila dos Remédios</SelectItem>
                <SelectItem value="baia-dos-porcos">Baía dos Porcos</SelectItem>
                <SelectItem value="morro-do-piquinho">Morro do Piquinho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos ({allEvents.length})</CardTitle>
          <CardDescription>
            Lista completa de todos os eventos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Organizador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event: any) => (
                <TableRow key={event._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={event.imageUrl || event.image} alt={event.title || event.name} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {(event.title || event.name).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{event.title || event.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          {event.rating || 4.5}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{event.organizer || event.creatorName || "Organizador"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={eventTypeColors[(event.type || event.category) as keyof typeof eventTypeColors] || "bg-gray-100 text-gray-800"}
                    >
                      {getTypeLabel(event.type || event.category || 'general')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatDate(event.date)}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time || event.start_time || "Não informado"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {event.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {event.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">-/-</div>
                      <div className="text-gray-500">
                        A implementar
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      R$ {event.price || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEvent(event)}
                        title="Editar evento"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFeatured(event._id, event.isFeatured)}
                        title={event.isFeatured ? "Remover destaque" : "Destacar evento"}
                        className={event.isFeatured ? "text-yellow-600 border-yellow-300" : ""}
                      >
                        <Star className={`h-4 w-4 ${event.isFeatured ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(event._id, event.isActive)}
                        title={event.isActive ? "Desativar evento" : "Ativar evento"}
                        className={event.isActive ? "text-green-600 border-green-300" : "text-gray-600"}
                      >
                        {event.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/eventos/${event._id}`, "_blank")}
                        title="Visualizar página pública"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(event._id)}
                        title="Excluir evento"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Eventos em Destaque - Será implementado quando houver dados de desempenho */}
      {allEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>
              Os eventos cadastrados mais recentemente no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allEvents.slice(0, 3).map((event: any) => (
                <Card key={event._id} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={event.imageUrl} alt={event.title} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {event.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{event.title}</h3>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600">{event.category || "Evento"}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Form Dialog */}
      <EventFormDialog 
        open={addDialogOpen || !!editingEvent}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setEditingEvent(null);
          }
        }}
        event={editingEvent}
        onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
        title={editingEvent ? "Editar Evento" : "Novo Evento"}
        description={editingEvent ? "Atualize as informações do evento." : "Preencha os dados para criar um novo evento."}
        partners={partners}
      />

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteEvent(confirmDeleteId)}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Event Form Dialog Component
interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventData | null;
  onSave: (data: any) => void;
  title: string;
  description: string;
  partners?: any[];
}

function EventFormDialog({ open, onOpenChange, event, onSave, title, description, partners }: EventFormDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    date: "",
    time: "",
    location: "",
    address: "",
    price: 0,
    category: "",
    maxParticipants: 1,
    imageUrl: "",
    galleryImages: [] as string[],
    highlights: [] as string[],
    includes: [] as string[],
    additionalInfo: [] as string[],
    speaker: "",
    speakerBio: "",
    isFeatured: false,
    isActive: true,
    partnerId: "",
    symplaUrl: "",
    whatsappContact: "",
  });

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        shortDescription: event.shortDescription || "",
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        address: event.address || "",
        price: Number(event.price) || 0,
        category: event.category || "",
        maxParticipants: Number(event.maxParticipants) || 1,
        imageUrl: event.imageUrl || "",
        galleryImages: event.galleryImages || [],
        highlights: event.highlights || [],
        includes: event.includes || [],
        additionalInfo: event.additionalInfo || [],
        speaker: event.speaker || "",
        speakerBio: event.speakerBio || "",
        isFeatured: event.isFeatured || false,
        isActive: event.isActive || true,
        partnerId: event.partnerId || "",
        symplaUrl: event.symplaUrl || "",
        whatsappContact: event.whatsappContact || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        shortDescription: "",
        date: "",
        time: "",
        location: "",
        address: "",
        price: 0,
        category: "",
        maxParticipants: 1,
        imageUrl: "",
        galleryImages: [],
        highlights: [],
        includes: [],
        additionalInfo: [],
        speaker: "",
        speakerBio: "",
        isFeatured: false,
        isActive: true,
        partnerId: "",
        symplaUrl: "",
        whatsappContact: "",
      });
    }
  }, [event]);

  const handleSubmit = () => {
    if (!formData.title || !formData.shortDescription || !formData.date || !formData.time || !formData.location || !formData.partnerId) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome do evento"
              />
            </div>

            <div>
              <Label htmlFor="shortDescription">Descrição Curta *</Label>
              <Textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Breve descrição do evento"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição Completa</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do evento"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Localização e Detalhes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Local *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Local do evento"
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Máx. Participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="music">Música</SelectItem>
                  <SelectItem value="gastronomy">Gastronomia</SelectItem>
                  <SelectItem value="culture">Cultura</SelectItem>
                  <SelectItem value="sport">Esporte</SelectItem>
                  <SelectItem value="nature">Natureza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="partnerId">Parceiro/Organizador *</Label>
              <Select value={formData.partnerId} onValueChange={(value) => setFormData({ ...formData, partnerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o parceiro" />
                </SelectTrigger>
                <SelectContent>
                  {partners?.map((partner) => (
                    <SelectItem key={partner._id} value={partner._id}>
                      {partner.name} ({partner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mídia e Extras */}
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label htmlFor="imageUrl">URL da Imagem Principal</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="speaker">Palestrante/Artista</Label>
              <Input
                id="speaker"
                value={formData.speaker}
                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                placeholder="Nome do palestrante ou artista"
              />
            </div>
            <div>
              <Label htmlFor="whatsappContact">WhatsApp de Contato</Label>
              <Input
                id="whatsappContact"
                value={formData.whatsappContact}
                onChange={(e) => setFormData({ ...formData, whatsappContact: e.target.value })}
                placeholder="(85) 99999-9999"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="speakerBio">Biografia do Palestrante/Artista</Label>
            <Textarea
              id="speakerBio"
              value={formData.speakerBio}
              onChange={(e) => setFormData({ ...formData, speakerBio: e.target.value })}
              placeholder="Biografia ou descrição do palestrante/artista"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="symplaUrl">URL do Sympla</Label>
            <Input
              id="symplaUrl"
              value={formData.symplaUrl}
              onChange={(e) => setFormData({ ...formData, symplaUrl: e.target.value })}
              placeholder="https://sympla.com.br/evento"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              />
              <Label htmlFor="isFeatured">Evento em Destaque</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">Evento Ativo</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {event ? "Atualizar" : "Criar"} Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
