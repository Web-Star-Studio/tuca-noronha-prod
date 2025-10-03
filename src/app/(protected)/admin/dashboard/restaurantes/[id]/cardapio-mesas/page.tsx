"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../../../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Plus, Edit, Trash2, Users, MapPin, Eye, Star, ArrowLeft, Calendar, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Table {
  _id: Id<"restaurantTables">
  name: string
  capacity: number
  location: string
  type: string
  shape: string
  isActive: boolean
  isVip: boolean
  hasView: boolean
  notes?: string
}

export default function CardapioMesasPage() {
  const { id } = useParams()
  const { user } = useCurrentUser()
  
  const restaurantId = id as Id<"restaurants">
  
  // Buscar o restaurante pelo ID
  const restaurant = useQuery(api.domains.restaurants.queries.getById, 
    restaurantId ? { id: restaurantId } : undefined
  )
  
  // Query para mesas
  const tables = useQuery(api.domains.restaurants.queries.getRestaurantTables, 
    restaurantId ? { restaurantId } : undefined
  )

  // Estados para diálogos e formulários
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const [isEditingTable, setIsEditingTable] = useState<Table | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Mutations
  const createTable = useMutation(api.domains.restaurants.mutations.createTable)
  const updateTable = useMutation(api.domains.restaurants.mutations.updateTable)
  const deleteTable = useMutation(api.domains.restaurants.mutations.deleteTable)
  const assignReservationToTable = useMutation(api.domains.restaurants.mutations.assignReservationToTable)

  // Query para reservas com informações de mesa
  const reservationsWithTables = useQuery(
    api.domains.restaurants.queries.getRestaurantReservationsWithTables,
    restaurantId ? { restaurantId } : undefined
  )

  const availableTables = useQuery(
    api.domains.restaurants.queries.getAvailableTablesForReservation,
    selectedReservation ? {
      restaurantId: selectedReservation.restaurantId,
      date: selectedReservation.date,
      time: selectedReservation.time,
      partySize: selectedReservation.partySize,
      excludeReservationId: selectedReservation._id,
    } : undefined
  )

  // Verificação de acesso
  useEffect(() => {
    if (restaurant && user) {
      // Verificar se o usuário tem acesso a este restaurante
      if (user.role === "partner" && restaurant.partnerId !== user._id) {
        toast.error("Acesso negado", {
          description: "Você não tem permissão para gerenciar este restaurante.",
        })
        // Redirecionar para a página de restaurantes
        window.location.href = "/admin/dashboard/restaurantes"
        return
      }
      
      if (user.role === "employee") {
        // TODO: Verificar se o employee tem acesso através das organizações
        // Por enquanto, vamos permitir acesso
      }
    }
  }, [restaurant, user]) // toast removed - not a valid dependency

  // Formulários
  const [tableForm, setTableForm] = useState({
    name: "",
    capacity: 2,
    location: "",
    type: "Standard",
    shape: "Round",
    isVip: false,
    hasView: false,
    notes: "",
  })

  // Reset forms when dialogs close
  const resetTableForm = () => {
    setTableForm({
      name: "",
      capacity: 2,
      location: "",
      type: "Standard",
      shape: "Round",
      isVip: false,
      hasView: false,
      notes: "",
    })
    setIsEditingTable(null)
  }

  // Handlers para mesas
  const handleCreateTable = async () => {
    if (!restaurantId) return
    
    setIsLoading(true)
    try {
      await createTable({
        restaurantId,
        name: tableForm.name,
        capacity: tableForm.capacity,
        location: tableForm.location,
        type: tableForm.type,
        shape: tableForm.shape,
        isVip: tableForm.isVip,
        hasView: tableForm.hasView,
        notes: tableForm.notes || undefined,
      })
      
      toast.success("Mesa criada com sucesso!", {
        description: `A mesa ${tableForm.name} foi adicionada ao restaurante.`,
      })
      
      setIsTableDialogOpen(false)
      resetTableForm()
    } catch {
      console.error("Erro ao criar mesa:", error)
      toast.error("Erro ao criar mesa", {
        description: "Ocorreu um erro ao criar a mesa. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTable = async () => {
    if (!isEditingTable) return
    
    setIsLoading(true)
    try {
      await updateTable({
        tableId: isEditingTable._id,
        name: tableForm.name,
        capacity: tableForm.capacity,
        location: tableForm.location,
        type: tableForm.type,
        shape: tableForm.shape,
        isActive: true,
        isVip: tableForm.isVip,
        hasView: tableForm.hasView,
        notes: tableForm.notes || undefined,
      })
      
      toast.success("Mesa atualizada com sucesso!", {
        description: `A mesa ${tableForm.name} foi atualizada.`,
      })
      
      setIsTableDialogOpen(false)
      resetTableForm()
    } catch {
      console.error("Erro ao atualizar mesa:", error)
      toast.error("Erro ao atualizar mesa", {
        description: "Ocorreu um erro ao atualizar a mesa. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTable = async (table: Table) => {
    if (!confirm(`Tem certeza que deseja excluir a mesa ${table.name}?`)) return
    
    try {
      await deleteTable({ tableId: table._id })
      toast.success("Mesa excluída", {
        description: `A mesa ${table.name} foi removida.`,
      })
    } catch {
      console.error("Erro ao excluir mesa:", error)
      toast.error("Erro ao excluir mesa", {
        description: "Ocorreu um erro ao excluir a mesa. Verifique se não há reservas associadas.",
      })
    }
  }

  // Editar mesa
  const editTable = (table: Table) => {
    setTableForm({
      name: table.name,
      capacity: table.capacity,
      location: table.location,
      type: table.type,
      shape: table.shape,
      isVip: table.isVip,
      hasView: table.hasView,
      notes: table.notes || "",
    })
    setIsEditingTable(table)
    setIsTableDialogOpen(true)
  }

  // Handler para atribuir mesa à reserva
  const handleAssignTable = async (tableId: Id<"restaurantTables"> | null) => {
    if (!selectedReservation) return
    
    setIsLoading(true)
    try {
      await assignReservationToTable({
        reservationId: selectedReservation._id,
        tableId,
      })
      
      toast.success(
        tableId ? "Mesa atribuída com sucesso!" : "Mesa removida da reserva!",
        {
          description: tableId 
            ? `A reserva foi atribuída à mesa selecionada.` 
            : `A reserva não está mais atribuída a nenhuma mesa.`,
        }
      )
      
      setIsAssignDialogOpen(false)
      setSelectedReservation(null)
    } catch {
      console.error("Erro ao atribuir mesa:", error)
      toast.error("Erro ao atribuir mesa", {
        description: "Ocorreu um erro ao processar a atribuição. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!restaurant || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header com botão de voltar */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/dashboard/restaurantes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestão de Mesas
          </h1>
          <p className="text-gray-600">
            Gerencie as mesas de <span className="font-medium">{restaurant.name}</span>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="mesas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <TabsTrigger value="mesas">
              <Users className="h-4 w-4 mr-2" />
              Mesas ({tables?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reservas">
              <Calendar className="h-4 w-4 mr-2" />
              Reservas ({reservationsWithTables?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Aba Mesas */}
          <TabsContent value="mesas" className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-start sm:items-center">
              <h2 className="text-2xl font-semibold">Gestão de Mesas</h2>
              <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetTableForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Mesa
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditingTable ? "Editar Mesa" : "Nova Mesa"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditingTable 
                        ? "Atualize as informações da mesa"
                        : "Adicione uma nova mesa ao restaurante"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome/Número da Mesa</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Mesa 01, VIP A"
                        value={tableForm.name}
                        onChange={(e) => setTableForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="capacity">Capacidade</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          max="20"
                          value={tableForm.capacity}
                          onChange={(e) => setTableForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 2 }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="type">Tipo</Label>
                        <Select value={tableForm.type} onValueChange={(value) => setTableForm(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="Bar">Bar</SelectItem>
                            <SelectItem value="Private">Privada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="location">Localização</Label>
                        <Select value={tableForm.location} onValueChange={(value) => setTableForm(prev => ({ ...prev, location: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Interno">Interno</SelectItem>
                            <SelectItem value="Varanda">Varanda</SelectItem>
                            <SelectItem value="Terraço">Terraço</SelectItem>
                            <SelectItem value="Jardim">Jardim</SelectItem>
                            <SelectItem value="VIP">Área VIP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="shape">Formato</Label>
                        <Select value={tableForm.shape} onValueChange={(value) => setTableForm(prev => ({ ...prev, shape: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Round">Redonda</SelectItem>
                            <SelectItem value="Square">Quadrada</SelectItem>
                            <SelectItem value="Rectangular">Retangular</SelectItem>
                            <SelectItem value="Oval">Oval</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isVip"
                          checked={tableForm.isVip}
                          onCheckedChange={(checked) => setTableForm(prev => ({ ...prev, isVip: checked }))}
                        />
                        <Label htmlFor="isVip">Mesa VIP</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="hasView"
                          checked={tableForm.hasView}
                          onCheckedChange={(checked) => setTableForm(prev => ({ ...prev, hasView: checked }))}
                        />
                        <Label htmlFor="hasView">Mesa com vista</Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Observações especiais sobre a mesa..."
                        value={tableForm.notes}
                        onChange={(e) => setTableForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={isEditingTable ? handleUpdateTable : handleCreateTable}
                      disabled={isLoading || !tableForm.name}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {isEditingTable ? "Atualizar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Grid de Mesas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {tables?.map((table) => (
                  <motion.div
                    key={table._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap gap-3 justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{table.name}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <Users className="h-4 w-4 mr-1" />
                              {table.capacity} pessoas
                            </CardDescription>
                          </div>
                          <div className="flex space-x-1">
                            {table.isVip && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                            {table.hasView && (
                              <Badge variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                Vista
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {table.location}
                          </div>
                          <div className="flex flex-wrap gap-3 justify-between">
                            <span className="text-gray-500">Tipo:</span>
                            <span className="font-medium">{table.type}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 justify-between">
                            <span className="text-gray-500">Formato:</span>
                            <span className="font-medium">{table.shape}</span>
                          </div>
                        </div>
                        
                        {table.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {table.notes}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3 justify-between items-start sm:items-center pt-2">
                          <Badge variant={table.isActive ? "default" : "secondary"}>
                            {table.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                          <div className="space-x-2">
                            <Button size="sm" variant="outline" onClick={() => editTable(table)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTable(table)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {(!tables || tables.length === 0) && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma mesa cadastrada
                </h3>
                <p className="text-gray-500 mb-4">
                  Comece adicionando as mesas do seu restaurante
                </p>
              </div>
            )}
          </TabsContent>

          {/* Aba Reservas com Atribuição de Mesas */}
          <TabsContent value="reservas" className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-start sm:items-center">
              <h2 className="text-2xl font-semibold">Gerenciar Reservas e Mesas</h2>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-filter">Data:</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {(!reservationsWithTables || reservationsWithTables.length === 0) ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma reserva encontrada
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Não há reservas para este restaurante na data selecionada
                  </p>
                </div>
              ) : (
                reservationsWithTables
                  .filter(reservation => !selectedDate || reservation.date === selectedDate)
                  .map((reservation) => (
                    <Card key={reservation._id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap gap-3 items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold">
                                {reservation.name}
                              </h3>
                              <Badge 
                                variant={
                                  reservation.status === "confirmed" ? "default" :
                                  reservation.status === "pending" ? "secondary" :
                                  reservation.status === "canceled" ? "destructive" : "outline"
                                }
                              >
                                {reservation.status === "confirmed" ? "Confirmada" :
                                 reservation.status === "pending" ? "Pendente" :
                                 reservation.status === "canceled" ? "Cancelada" : reservation.status}
                              </Badge>
                              
                              {reservation.table && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Mesa: {reservation.table.name}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{reservation.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{reservation.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{reservation.partySize} pessoas</span>
                              </div>
                            </div>

                            <div className="mt-3 text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                <span>📧 {reservation.email}</span>
                                <span>📱 {reservation.phone}</span>
                                <span className="font-mono">#{reservation.confirmationCode}</span>
                              </div>
                              {reservation.specialRequests && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                  <strong>Pedidos especiais:</strong> {reservation.specialRequests}
                                </div>
                              )}
                            </div>

                            {reservation.table && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-blue-900">Mesa Atribuída</h4>
                                    <div className="text-sm text-blue-700 space-y-1">
                                      <div><strong>Nome:</strong> {reservation.table.name}</div>
                                      <div><strong>Capacidade:</strong> {reservation.table.capacity} pessoas</div>
                                      <div><strong>Localização:</strong> {reservation.table.location}</div>
                                      <div><strong>Tipo:</strong> {reservation.table.type}</div>
                                      {reservation.table.isVip && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                          VIP
                                        </Badge>
                                      )}
                                      {reservation.table.hasView && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          Com Vista
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Dialog open={isAssignDialogOpen && selectedReservation?._id === reservation._id} onOpenChange={(open) => {
                              if (!open) {
                                setIsAssignDialogOpen(false)
                                setSelectedReservation(null)
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReservation(reservation)
                                    setIsAssignDialogOpen(true)
                                  }}
                                  disabled={reservation.status === "canceled"}
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  {reservation.table ? "Alterar Mesa" : "Atribuir Mesa"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Atribuir Mesa à Reserva</DialogTitle>
                                  <DialogDescription>
                                    Selecione uma mesa disponível para a reserva de {reservation.name}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-sm space-y-1">
                                      <div><strong>Cliente:</strong> {reservation.name}</div>
                                      <div><strong>Data/Hora:</strong> {reservation.date} às {reservation.time}</div>
                                      <div><strong>Pessoas:</strong> {reservation.partySize}</div>
                                    </div>
                                  </div>

                                  {availableTables && availableTables.length > 0 ? (
                                    <div className="space-y-2">
                                      <Label>Mesas Disponíveis:</Label>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {availableTables.map((table) => (
                                          <div key={table._id} className="flex flex-wrap gap-3 items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                            <div className="flex-1">
                                              <div className="font-medium">{table.name}</div>
                                              <div className="text-sm text-gray-500">
                                                {table.capacity} pessoas • {table.location} • {table.type}
                                                {table.isVip && " • VIP"}
                                                {table.hasView && " • Com Vista"}
                                              </div>
                                            </div>
                                            <Button
                                              size="sm"
                                              onClick={() => handleAssignTable(table._id)}
                                              disabled={isLoading}
                                            >
                                              {isLoading ? "Atribuindo..." : "Atribuir"}
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-6 text-gray-500">
                                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                      <p>Nenhuma mesa disponível para este horário</p>
                                    </div>
                                  )}

                                  {reservation.table && (
                                    <div className="pt-4 border-t">
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleAssignTable(null)}
                                        disabled={isLoading}
                                      >
                                        Remover Atribuição de Mesa
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
