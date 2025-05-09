"use client"

import activitiesStore, { type Activity } from "@/lib/store/activitiesStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, MoreHorizontal, Plus, Star, Trash2 } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

function ActivityCard({ activity, onEdit, onDelete, onToggleFeatured }: { 
  activity: Activity; 
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
}) {
  return (
    <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:translate-y-[-3px]">
      <div className="relative h-48 w-full group">
        <Image 
          src={activity.imageUrl}
          alt={activity.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
        {activity.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-amber-400 to-yellow-500 shadow-md hover:shadow-lg border-none text-black">
              <Star className="h-3 w-3 mr-1 fill-black" /> Destaque
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex justify-between items-center">
          <span className="line-clamp-1 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{activity.title}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-100/80 transition-colors duration-200">
                <MoreHorizontal className="h-4 w-4 text-slate-600" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg">
              <DropdownMenuItem onClick={() => onEdit(activity)} className="hover:bg-blue-50 focus:bg-blue-50 transition-colors">
                <Edit className="mr-2 h-4 w-4 text-blue-600" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFeatured(activity.id, !activity.isFeatured)} className="hover:bg-amber-50 focus:bg-amber-50 transition-colors">
                <Star className="mr-2 h-4 w-4 text-amber-500" /> {activity.isFeatured ? "Remover destaque" : "Destacar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(activity.id)} className="text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <CardDescription className="line-clamp-2 mt-1">{activity.shortDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">{activity.category}</Badge>
          <div className="text-sm font-medium px-2 py-1 rounded-md bg-green-50/80 text-green-700">
            R$ {activity.price.toFixed(2)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-2 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <Label htmlFor={`published-${activity.id}`} className="text-sm font-normal">Ativo</Label>
          <Switch id={`published-${activity.id}`} checked={activity.isActive} className="data-[state=checked]:bg-green-600" />
        </div>
        <div className="text-xs text-muted-foreground">
          Criado em {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
        </div>
      </CardFooter>
    </Card>
  )
}

function ActivityForm({ activity, onSave, onCancel }: { 
  activity?: Activity;
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}) {
  const categories = activitiesStore(state => state.categories);
  
  const [formData, setFormData] = useState<Activity>(
    activity || {
      id: uuidv4(),
      title: "",
      description: "",
      shortDescription: "",
      price: 0,
      category: categories[0],
      duration: "2 horas",
      maxParticipants: 10,
      minParticipants: 1,
      difficulty: "Fácil",
      rating: 4.5,
      imageUrl: "https://source.unsplash.com/random/800x600/?activity",
      galleryImages: [],
      highlights: [],
      includes: [],
      itineraries: [],
      excludes: [],
      additionalInfo: [],
      cancelationPolicy: [],
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: Number(value) });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  const handleArrayItemChange = (index: number, value: string, fieldName: keyof Activity) => {
    const newArray = [...(formData[fieldName] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [fieldName]: newArray });
  };
  
  const handleAddArrayItem = (fieldName: keyof Activity) => {
    const newArray = [...(formData[fieldName] as string[]), ""];
    setFormData({ ...formData, [fieldName]: newArray });
  };
  
  const handleRemoveArrayItem = (index: number, fieldName: keyof Activity) => {
    const newArray = [...(formData[fieldName] as string[])];
    newArray.splice(index, 1);
    setFormData({ ...formData, [fieldName]: newArray });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedActivity = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onSave(updatedActivity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-4 bg-white/80 backdrop-blur-sm border-none shadow-sm">
          <TabsTrigger value="basic" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Informações Básicas</TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Detalhes</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Características</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="shortDescription">Descrição Curta</Label>
              <Textarea 
                id="shortDescription" 
                name="shortDescription" 
                value={formData.shortDescription} 
                onChange={handleInputChange} 
                rows={2} 
                required 
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Descrição Completa</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                rows={4} 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="price">Preço (R$)</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                value={formData.price} 
                onChange={handleNumberChange} 
                min="0" 
                step="0.01" 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">Duração</Label>
              <Input 
                id="duration" 
                name="duration" 
                value={formData.duration} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => handleSelectChange("difficulty", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                  <SelectItem value="Extremo">Extremo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
            
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minParticipants">Mínimo de Participantes</Label>
              <Input 
                id="minParticipants" 
                name="minParticipants" 
                type="number" 
                value={formData.minParticipants} 
                onChange={handleNumberChange} 
                min="1" 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
              <Input 
                id="maxParticipants" 
                name="maxParticipants" 
                type="number" 
                value={formData.maxParticipants} 
                onChange={handleNumberChange} 
                min="1" 
                required 
              />
            </div>
          </div>
            
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                name="isActive"
                checked={formData.isActive} 
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} 
              />
              <Label htmlFor="isActive">Ativar Atividade</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isFeatured" 
                name="isFeatured"
                checked={formData.isFeatured} 
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })} 
              />
              <Label htmlFor="isFeatured">Destacar Atividade</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div>
            <Label>Destaques</Label>
            {formData.highlights.map((highlight, index) => (
              <div key={`${highlight}-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
index}`} className="flex items-center gap-2 mt-2">
                <Input
                  value={highlight}
                  onChange={(e) => handleArrayItemChange(index, e.target.value, "highlights")}
                  placeholder="Destaque"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArrayItem(index, "highlights")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleAddArrayItem("highlights")}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Destaque
            </Button>
          </div>

          <div>
            <Label>Inclui</Label>
            {formData.includes.map((include, index) => (
              <div key={`${include}-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
index}`} className="flex items-center gap-2 mt-2">
                <Input
                  value={include}
                  onChange={(e) => handleArrayItemChange(index, e.target.value, "includes")}
                  placeholder="Item incluído"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArrayItem(index, "includes")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleAddArrayItem("includes")}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Item Incluso
            </Button>
          </div>

          <div>
            <Label>Não Inclui</Label>
            {formData.excludes.map((exclude, index) => (
              <div key={`${exclude}-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
index}`} className="flex items-center gap-2 mt-2">
                <Input
                  value={exclude}
                  onChange={(e) => handleArrayItemChange(index, e.target.value, "excludes")}
                  placeholder="Item não incluído"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArrayItem(index, "excludes")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleAddArrayItem("excludes")}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Item Não Incluso
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div>
            <Label>Itinerário</Label>
            {formData.itineraries.map((item, index) => (
              <div key={`${item}-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
index}`} className="flex items-center gap-2 mt-2">
                <Input
                  value={item}
                  onChange={(e) => handleArrayItemChange(index, e.target.value, "itineraries")}
                  placeholder="Etapa do itinerário"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArrayItem(index, "itineraries")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleAddArrayItem("itineraries")}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Etapa
            </Button>
          </div>

          <div>
            <Label>Informações Adicionais</Label>
            {formData.additionalInfo.map((info, index) => (
              <div key={`${info}-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
index}`} className="flex items-center gap-2 mt-2">
                <Input
                  value={info}
                  onChange={(e) => handleArrayItemChange(index, e.target.value, "additionalInfo")}
                  placeholder="Informação adicional"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArrayItem(index, "additionalInfo")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleAddArrayItem("additionalInfo")}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Informação
            </Button>
          </div>

          <div>
            <Label>Política de Cancelamento</Label>
            {formData.cancelationPolicy.map((policy, index) => (
              <div key={`${policy}-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
index}`} className="flex items-center gap-2 mt-2">
                <Input
                  value={policy}
                  onChange={(e) => handleArrayItemChange(index, e.target.value, "cancelationPolicy")}
                  placeholder="Regra de cancelamento"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArrayItem(index, "cancelationPolicy")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleAddArrayItem("cancelationPolicy")}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Regra
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-200 hover:bg-slate-100 transition-colors">Cancelar</Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 border-none">
          {activity ? "Atualizar" : "Criar"} Atividade
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function ActivitiesPage() {
  const allActivities = activitiesStore(state => state.activities);
  const setActivities = activitiesStore(state => state.setActivities);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const categories = activitiesStore(state => state.categories);
  
  // Filtered activities based on search and filters
  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || activity.category === filterCategory;
    const matchesFeatured = !showFeaturedOnly || activity.isFeatured;
    
    return matchesSearch && matchesCategory && matchesFeatured;
  });
  
  // Handle CRUD operations
  const handleCreateActivity = (newActivity: Activity) => {
    const updatedActivities = [...allActivities, newActivity];
    setActivities(updatedActivities);
    setAddDialogOpen(false);
  };
  
  const handleUpdateActivity = (updatedActivity: Activity) => {
    const updatedActivities = allActivities.map(activity => 
      activity.id === updatedActivity.id ? updatedActivity : activity
    );
    setActivities(updatedActivities);
    setEditingActivity(null);
  };
  
  const handleDeleteActivity = (id: string) => {
    const updatedActivities = allActivities.filter(activity => activity.id !== id);
    setActivities(updatedActivities);
    setConfirmDeleteId(null);
  };
  
  const handleToggleFeatured = (id: string, featured: boolean) => {
    const updatedActivities = allActivities.map(activity => 
      activity.id === id ? { ...activity, isFeatured: featured } : activity
    );
    setActivities(updatedActivities);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">Atividades</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie as atividades disponíveis no sistema.
          </p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 border-none text-white">
              <Plus className="mr-2 h-4 w-4" /> Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-white/95 backdrop-blur-md border-none shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold">Adicionar Nova Atividade</DialogTitle>
              <DialogDescription>
                Preencha as informações da nova atividade. Clique em Criar Atividade quando finalizar.
              </DialogDescription>
            </DialogHeader>
            <ActivityForm 
              onSave={handleCreateActivity}
              onCancel={() => setAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0 p-4 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <div className="w-full md:w-[300px]">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Buscar atividade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-[200px]">
            <Label htmlFor="category">Categoria</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 md:pt-8">
            <Switch
              id="featured"
              checked={showFeaturedOnly}
              onCheckedChange={setShowFeaturedOnly}
            />
            <Label htmlFor="featured">Apenas destaques</Label>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fadeIn">
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0.6; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out forwards;
          }
        `}</style>
        {filteredActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onEdit={setEditingActivity}
            onDelete={(id) => setConfirmDeleteId(id)}
            onToggleFeatured={handleToggleFeatured}
          />
        ))}
        
        {filteredActivities.length === 0 && (
          <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed border-blue-200 bg-blue-50/50">
            <div className="flex flex-col items-center space-y-3 text-center p-4 rounded-xl backdrop-blur-sm">
              <div className="text-slate-500 font-medium">
                Nenhuma atividade encontrada.
              </div>
              <Button 
                variant="outline" 
                onClick={() => setAddDialogOpen(true)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Atividade
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Activity Dialog */}
      {editingActivity && (
        <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
          <DialogContent className="sm:max-w-[800px] bg-white/95 backdrop-blur-md border-none shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold">Editar Atividade</DialogTitle>
              <DialogDescription>
                Atualize as informações da atividade conforme necessário.
              </DialogDescription>
            </DialogHeader>
            <ActivityForm 
              activity={editingActivity}
              onSave={handleUpdateActivity}
              onCancel={() => setEditingActivity(null)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent className="bg-white/95 backdrop-blur-md border-none shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600">Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta atividade?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="border-slate-200 hover:bg-slate-100 transition-colors">Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDeleteActivity(confirmDeleteId)} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 border-none">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}