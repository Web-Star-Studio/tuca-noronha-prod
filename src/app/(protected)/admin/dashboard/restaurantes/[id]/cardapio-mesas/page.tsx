"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../../../convex/_generated/api"
import type { Id } from "../../../../../../../../convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Plus, Edit, Trash2, Users, MapPin, Eye, Star, Utensils, Clock, Leaf, Flame, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"

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

interface MenuCategory {
  _id: Id<"menuCategories">
  name: string
  description?: string
  order: number
  isActive: boolean
}

interface MenuItem {
  _id: Id<"menuItems">
  name: string
  description: string
  price: number
  image?: string
  ingredients: string[]
  allergens: string[]
  preparationTime?: number
  calories?: number
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isSpicy: boolean
  spicyLevel?: number
  isSignature: boolean
  isAvailable: boolean
  order: number
  tags: string[]
  notes?: string
}

export default function CardapioMesasPage() {
  const { id } = useParams()
  const { user } = useCurrentUser()
  
  const restaurantId = id as Id<"restaurants">
  
  // Buscar o restaurante pelo ID
  const restaurant = useQuery(api.domains.restaurants.queries.getById, 
    restaurantId ? { id: restaurantId } : "skip"
  )
  
  // Queries para mesas e cardápio
  const tables = useQuery(api.domains.restaurants.queries.getRestaurantTables, 
    restaurantId ? { restaurantId } : "skip"
  )
  const categories = useQuery(api.domains.restaurants.queries.getMenuCategories, 
    restaurantId ? { restaurantId } : "skip"
  )
  const fullMenu = useQuery(api.domains.restaurants.queries.getFullMenu, 
    restaurantId ? { restaurantId } : "skip"
  )

  // Mutations
  const createTable = useMutation(api.domains.restaurants.mutations.createTable)
  const updateTable = useMutation(api.domains.restaurants.mutations.updateTable)
  const deleteTable = useMutation(api.domains.restaurants.mutations.deleteTable)
  const createCategory = useMutation(api.domains.restaurants.mutations.createMenuCategory)
  const createMenuItem = useMutation(api.domains.restaurants.mutations.createMenuItem)

  // Estados para diálogos e formulários
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const [isEditingTable, setIsEditingTable] = useState<Table | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Verificação de acesso
  useEffect(() => {
    if (restaurant && user) {
      // Verificar se o usuário tem acesso a este restaurante
      if (user.role === "partner" && restaurant.partnerId !== user.id) {
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
  }, [restaurant, user, toast])

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

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    order: 1,
  })

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    ingredients: [] as string[],
    allergens: [] as string[],
    preparationTime: 0,
    calories: 0,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    spicyLevel: 1,
    isSignature: false,
    order: 1,
    tags: [] as string[],
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error("Erro ao excluir mesa:", error)
      toast.error("Erro ao excluir mesa", {
        description: "Ocorreu um erro ao excluir a mesa. Verifique se não há reservas associadas.",
      })
    }
  }

  // Handlers para cardápio
  const handleCreateCategory = async () => {
    if (!restaurantId) return
    
    setIsLoading(true)
    try {
      await createCategory({
        restaurantId,
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        order: categoryForm.order,
      })
      
      toast.success("Categoria criada com sucesso!", {
        description: `A categoria ${categoryForm.name} foi adicionada ao cardápio.`,
      })
      
      setIsCategoryDialogOpen(false)
      setCategoryForm({ name: "", description: "", order: 1 })
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast.error("Erro ao criar categoria", {
        description: "Ocorreu um erro ao criar a categoria. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMenuItem = async () => {
    if (!selectedCategory) return
    
    setIsLoading(true)
    try {
      await createMenuItem({
        categoryId: selectedCategory._id,
        name: itemForm.name,
        description: itemForm.description,
        price: itemForm.price,
        image: itemForm.image || undefined,
        ingredients: itemForm.ingredients,
        allergens: itemForm.allergens,
        preparationTime: itemForm.preparationTime || undefined,
        calories: itemForm.calories || undefined,
        isVegetarian: itemForm.isVegetarian,
        isVegan: itemForm.isVegan,
        isGlutenFree: itemForm.isGlutenFree,
        isSpicy: itemForm.isSpicy,
        spicyLevel: itemForm.isSpicy ? itemForm.spicyLevel : undefined,
        isSignature: itemForm.isSignature,
        order: itemForm.order,
        tags: itemForm.tags,
        notes: itemForm.notes || undefined,
      })
      
      toast.success("Item criado com sucesso!", {
        description: `O item ${itemForm.name} foi adicionado ao cardápio.`,
      })
      
      setIsItemDialogOpen(false)
      setItemForm({
        name: "",
        description: "",
        price: 0,
        image: "",
        ingredients: [],
        allergens: [],
        preparationTime: 0,
        calories: 0,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isSpicy: false,
        spicyLevel: 1,
        isSignature: false,
        order: 1,
        tags: [],
        notes: "",
      })
    } catch (error) {
      console.error("Erro ao criar item:", error)
      toast.error("Erro ao criar item", {
        description: "Ocorreu um erro ao criar o item. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
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
            Cardápio & Mesas
          </h1>
          <p className="text-gray-600">
            Gerencie o cardápio e as mesas de <span className="font-medium">{restaurant.name}</span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="mesas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mesas">
            <Users className="h-4 w-4 mr-2" />
            Mesas ({tables?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="cardapio">
            <Utensils className="h-4 w-4 mr-2" />
            Cardápio ({fullMenu?.length || 0} categorias)
          </TabsTrigger>
        </TabsList>

        {/* Aba Mesas */}
        <TabsContent value="mesas" className="space-y-6">
          <div className="flex justify-between items-center">
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
                  
                  <div className="grid grid-cols-2 gap-4">
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
                  
                  <div className="grid grid-cols-2 gap-4">
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
                      <div className="flex justify-between items-start">
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
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo:</span>
                          <span className="font-medium">{table.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Formato:</span>
                          <span className="font-medium">{table.shape}</span>
                        </div>
                      </div>
                      
                      {table.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {table.notes}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2">
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

        {/* Aba Cardápio */}
        <TabsContent value="cardapio" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Gestão do Cardápio</h2>
            <div className="space-x-2">
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova categoria ao cardápio
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="categoryName">Nome da Categoria</Label>
                      <Input
                        id="categoryName"
                        placeholder="Ex: Pratos Principais, Sobremesas"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="categoryDescription">Descrição</Label>
                      <Textarea
                        id="categoryDescription"
                        placeholder="Descrição da categoria..."
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="categoryOrder">Ordem</Label>
                      <Input
                        id="categoryOrder"
                        type="number"
                        min="1"
                        value={categoryForm.order}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateCategory}
                      disabled={isLoading || !categoryForm.name}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Criar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Lista de Categorias com Itens */}
          <div className="space-y-6">
            {fullMenu?.map((category) => (
              <Card key={category._id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription>{category.description}</CardDescription>
                      )}
                    </div>
                    <Dialog 
                      open={isItemDialogOpen && selectedCategory?._id === category._id} 
                      onOpenChange={(open) => {
                        setIsItemDialogOpen(open)
                        if (open) setSelectedCategory(category)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Novo Item - {category.name}</DialogTitle>
                          <DialogDescription>
                            Adicione um novo item ao cardápio
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="itemName">Nome do Item</Label>
                              <Input
                                id="itemName"
                                placeholder="Ex: Salmão Grelhado"
                                value={itemForm.name}
                                onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="itemPrice">Preço (R$)</Label>
                              <Input
                                id="itemPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={itemForm.price}
                                onChange={(e) => setItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="itemDescription">Descrição</Label>
                            <Textarea
                              id="itemDescription"
                              placeholder="Descrição detalhada do prato..."
                              value={itemForm.description}
                              onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="preparationTime">Tempo de Preparo (min)</Label>
                              <Input
                                id="preparationTime"
                                type="number"
                                min="0"
                                value={itemForm.preparationTime}
                                onChange={(e) => setItemForm(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="calories">Calorias</Label>
                              <Input
                                id="calories"
                                type="number"
                                min="0"
                                value={itemForm.calories}
                                onChange={(e) => setItemForm(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label>Características</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="isVegetarian"
                                    checked={itemForm.isVegetarian}
                                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isVegetarian: checked }))}
                                  />
                                  <Label htmlFor="isVegetarian" className="flex items-center">
                                    <Leaf className="h-4 w-4 mr-1 text-green-600" />
                                    Vegetariano
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="isVegan"
                                    checked={itemForm.isVegan}
                                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isVegan: checked }))}
                                  />
                                  <Label htmlFor="isVegan" className="flex items-center">
                                    <Leaf className="h-4 w-4 mr-1 text-green-600" />
                                    Vegano
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="isGlutenFree"
                                    checked={itemForm.isGlutenFree}
                                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isGlutenFree: checked }))}
                                  />
                                  <Label htmlFor="isGlutenFree">Sem Glúten</Label>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="isSpicy"
                                    checked={itemForm.isSpicy}
                                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isSpicy: checked }))}
                                  />
                                  <Label htmlFor="isSpicy" className="flex items-center">
                                    <Flame className="h-4 w-4 mr-1 text-red-600" />
                                    Picante
                                  </Label>
                                </div>
                                
                                {itemForm.isSpicy && (
                                  <div>
                                    <Label htmlFor="spicyLevel">Nível de Picância (1-5)</Label>
                                    <Input
                                      id="spicyLevel"
                                      type="number"
                                      min="1"
                                      max="5"
                                      value={itemForm.spicyLevel}
                                      onChange={(e) => setItemForm(prev => ({ ...prev, spicyLevel: parseInt(e.target.value) || 1 }))}
                                    />
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="isSignature"
                                    checked={itemForm.isSignature}
                                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isSignature: checked }))}
                                  />
                                  <Label htmlFor="isSignature" className="flex items-center">
                                    <Star className="h-4 w-4 mr-1 text-yellow-600" />
                                    Prato Assinatura
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleCreateMenuItem}
                            disabled={isLoading || !itemForm.name || !itemForm.description}
                          >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Criar Item
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {category.items && category.items.length > 0 ? (
                    <div className="grid gap-4">
                      {category.items.map((item: any) => (
                        <div key={item._id} className="flex justify-between items-start p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <div className="flex space-x-1">
                                {item.isVegetarian && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <Leaf className="h-3 w-3 mr-1" />
                                    Vegetariano
                                  </Badge>
                                )}
                                {item.isVegan && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <Leaf className="h-3 w-3 mr-1" />
                                    Vegano
                                  </Badge>
                                )}
                                {item.isGlutenFree && (
                                  <Badge variant="outline">Sem Glúten</Badge>
                                )}
                                {item.isSpicy && (
                                  <Badge variant="outline" className="text-red-600 border-red-600">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Picante
                                  </Badge>
                                )}
                                {item.isSignature && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    <Star className="h-3 w-3 mr-1" />
                                    Assinatura
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {item.preparationTime && (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {item.preparationTime} min
                                </span>
                              )}
                              {item.calories && (
                                <span>{item.calories} cal</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600 mb-2">
                              R$ {item.price.toFixed(2)}
                            </div>
                            <Badge variant={item.isAvailable ? "default" : "secondary"}>
                              {item.isAvailable ? "Disponível" : "Indisponível"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Utensils className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>Nenhum item nesta categoria</p>
                      <p className="text-sm">Clique em "Novo Item" para adicionar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {(!fullMenu || fullMenu.length === 0) && (
            <div className="text-center py-12">
              <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma categoria cadastrada
              </h3>
              <p className="text-gray-500 mb-4">
                Comece criando categorias para organizar seu cardápio
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}