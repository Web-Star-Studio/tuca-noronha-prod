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
import { Edit, MoreHorizontal, Plus, Star, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"
import { useCreateActivity, useActivities, useUpdateActivity, useDeleteActivity, useToggleFeatured, useToggleActive } from "@/lib/services/activityService"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { toast } from "sonner";

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
  const { user, isAuthenticated } = useCurrentUser();
  const createActivity = useCreateActivity();
  
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const goToNextTab = () => {
    if (activeTab === "basic") {
      setActiveTab("details");
    } else if (activeTab === "details") {
      setActiveTab("highlights");
    } else if (activeTab === "highlights") {
      setActiveTab("includes");
    } else if (activeTab === "includes") {
      setActiveTab("itinerary");
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "details") {
      setActiveTab("basic");
    } else if (activeTab === "highlights") {
      setActiveTab("details");
    } else if (activeTab === "includes") {
      setActiveTab("highlights");
    } else if (activeTab === "itinerary") {
      setActiveTab("includes");
    }
  };

  const isLastTab = activeTab === "itinerary";
  const isFirstTab = activeTab === "basic";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLastTab) {
      goToNextTab();
      return;
    }
    
    if (!isAuthenticated || !user) {
      toast.error("Você precisa estar logado para criar uma atividade");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (activity) {
        // Will be implemented in the onSave callback
        onSave(formData);
      } else {
        // Create new activity in Convex
        const clerkId = user.id;
        const activityId = await createActivity(formData, clerkId);
        
        if (activityId) {
          toast.success("Atividade criada com sucesso");
          onSave({ ...formData, id: String(activityId) });
        }
      }
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Ocorreu um erro ao criar a atividade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white/80 backdrop-blur-sm border-none shadow-sm w-full flex overflow-x-auto">
          <TabsTrigger value="basic" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            1. Básicas
          </TabsTrigger>
          <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            2. Detalhes
          </TabsTrigger>
          <TabsTrigger value="highlights" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            3. Destaques
          </TabsTrigger>
          <TabsTrigger value="includes" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            4. Inclui/Não Inclui
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            5. Itinerário/Políticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <Label htmlFor="title" className="text-sm font-medium">Título</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="Nome da atividade"
                required 
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="shortDescription" className="text-sm font-medium">Descrição Curta</Label>
              <Textarea 
                id="shortDescription" 
                name="shortDescription" 
                value={formData.shortDescription} 
                onChange={handleInputChange} 
                rows={2} 
                className="mt-1.5 bg-white shadow-sm" 
                placeholder="Breve descrição para cartões e listagens"
                required 
              />
            </div>
          </div>
            
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price" className="text-sm font-medium">Preço (R$)</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                value={formData.price} 
                onChange={handleNumberChange} 
                min="0" 
                step="0.01" 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="0.00"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger className="mt-1.5 bg-white shadow-sm">
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
              <Label htmlFor="duration" className="text-sm font-medium">Duração</Label>
              <Input 
                id="duration" 
                name="duration" 
                value={formData.duration} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="Ex: 2 horas"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="difficulty" className="text-sm font-medium">Dificuldade</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => handleSelectChange("difficulty", value)}
              >
                <SelectTrigger className="mt-1.5 bg-white shadow-sm">
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

            <div>
              <Label htmlFor="minParticipants" className="text-sm font-medium">Mínimo de Participantes</Label>
              <Input 
                id="minParticipants" 
                name="minParticipants" 
                type="number" 
                value={formData.minParticipants} 
                onChange={handleNumberChange} 
                min="1" 
                className="mt-1.5 bg-white shadow-sm"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="maxParticipants" className="text-sm font-medium">Máximo de Participantes</Label>
              <Input 
                id="maxParticipants" 
                name="maxParticipants" 
                type="number" 
                value={formData.maxParticipants} 
                onChange={handleNumberChange} 
                min="1" 
                className="mt-1.5 bg-white shadow-sm"
                required 
              />
            </div>
          </div>
            
          <div className="grid grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                name="isActive"
                checked={formData.isActive} 
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, isActive: checked });
                  toast.success(checked ? "Atividade ativada" : "Atividade desativada");
                }}
                className="data-[state=checked]:bg-green-500"
              />
              <Label htmlFor="isActive" className="font-medium">
                {formData.isActive ? "Ativo" : "Inativo"}
              </Label>
              <Badge variant={formData.isActive ? "success" : "destructive"} className="ml-2">
                {formData.isActive ? "Disponível" : "Indisponível"}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isFeatured" 
                name="isFeatured"
                checked={formData.isFeatured} 
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, isFeatured: checked });
                  toast.success(checked ? "Atividade destacada" : "Destaque removido");
                }}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label htmlFor="isFeatured" className="font-medium">
                {formData.isFeatured ? "Destacado" : "Sem destaque"}
              </Label>
              <Badge variant={formData.isFeatured ? "default" : "outline"} className={formData.isFeatured ? "bg-amber-400 hover:bg-amber-500 text-black" : "text-slate-500"}>
                {formData.isFeatured ? "Destaque" : "Normal"}
              </Badge>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="col-span-2">
            <Label htmlFor="description" className="text-sm font-medium">Descrição Completa</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              rows={6} 
              className="mt-1.5 bg-white shadow-sm"
              placeholder="Descrição detalhada da atividade" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imageUrl" className="text-sm font-medium">URL da Imagem Principal</Label>
              <Input 
                id="imageUrl" 
                name="imageUrl" 
                value={formData.imageUrl} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="https://..."
                required 
              />
            </div>
            
            {formData.imageUrl && (
              <div className="mt-4 relative h-40 rounded-md overflow-hidden">
                <Image 
                  src={formData.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="highlights" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Destaques da Atividade</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-0 bg-white/80"
                onClick={() => handleAddArrayItem("highlights")}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Destaque
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {formData.highlights.map((highlight, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: intentionally using index as key to maintain input focus
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={highlight}
                    onChange={(e) => handleArrayItemChange(index, e.target.value, "highlights")}
                    placeholder="Destaque"
                    className="bg-white shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArrayItem(index, "highlights")}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {formData.highlights.length === 0 && (
                <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                  Adicione os principais destaques da atividade
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="includes" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Inclui</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-0 bg-white/80"
                  onClick={() => handleAddArrayItem("includes")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {formData.includes.map((include, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: intentionally using index as key to maintain input focus
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={include}
                      onChange={(e) => handleArrayItemChange(index, e.target.value, "includes")}
                      placeholder="Item incluído"
                      className="bg-white shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem(index, "includes")}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {formData.includes.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                    Adicione o que está incluído na atividade
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Não Inclui</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-0 bg-white/80"
                  onClick={() => handleAddArrayItem("excludes")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {formData.excludes.map((exclude, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: intentionally using index as key to maintain input focus
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={exclude}
                      onChange={(e) => handleArrayItemChange(index, e.target.value, "excludes")}
                      placeholder="Item não incluído"
                      className="bg-white shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem(index, "excludes")}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {formData.excludes.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                    Adicione o que não está incluído na atividade
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="itinerary" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Itinerário</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-0 bg-white/80"
                  onClick={() => handleAddArrayItem("itineraries")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Etapa
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {formData.itineraries.map((item, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: intentionally using index as key to maintain input focus
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleArrayItemChange(index, e.target.value, "itineraries")}
                      placeholder="Etapa do itinerário"
                      className="bg-white shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem(index, "itineraries")}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {formData.itineraries.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                    Adicione as etapas do itinerário
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Política de Cancelamento</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-0 bg-white/80"
                  onClick={() => handleAddArrayItem("cancelationPolicy")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Regra
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {formData.cancelationPolicy.map((policy, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: intentionally using index as key to maintain input focus
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={policy}
                      onChange={(e) => handleArrayItemChange(index, e.target.value, "cancelationPolicy")}
                      placeholder="Regra de cancelamento"
                      className="bg-white shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem(index, "cancelationPolicy")}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {formData.cancelationPolicy.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                    Adicione as regras de cancelamento
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Informações Adicionais</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-0 bg-white/80"
                onClick={() => handleAddArrayItem("additionalInfo")}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Informação
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {formData.additionalInfo.map((info, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: intentionally using index as key to maintain input focus
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={info}
                    onChange={(e) => handleArrayItemChange(index, e.target.value, "additionalInfo")}
                    placeholder="Informação adicional"
                    className="bg-white shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArrayItem(index, "additionalInfo")}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {formData.additionalInfo.length === 0 && (
                <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                  Adicione informações adicionais sobre a atividade
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between gap-2 pt-4 border-t border-gray-100">
        {!isFirstTab ? (
          <Button type="button" variant="outline" onClick={goToPreviousTab} className="border-slate-200 hover:bg-slate-100 transition-colors">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={onCancel} className="border-slate-200 hover:bg-slate-100 transition-colors">
            Cancelar
          </Button>
        )}
        
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 border-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Processando...
            </>
          ) : isLastTab ? (
            <>
              {activity ? "Atualizar" : "Criar"} Atividade
            </>
          ) : (
            <>
              Continuar <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default function ActivitiesPage() {
  const { user, isAuthenticated } = useCurrentUser();
  
  // Fetch activities from Convex
  const { activities: allActivities, isLoading } = useActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const toggleFeatured = useToggleFeatured();
  const toggleActive = useToggleActive();
  
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
  const handleCreateActivity = async (newActivity: Activity) => {
    if (!isAuthenticated || !user) {
      toast.error("Você precisa estar logado para criar uma atividade");
      return;
    }
    
    try {
      // Use the clerk ID for user identification
      const clerkId = user.id;
      await createActivity(newActivity, clerkId);
      toast.success("Atividade criada com sucesso");
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Ocorreu um erro ao criar a atividade");
    }
  };
  
  const handleUpdateActivity = async (updatedActivity: Activity) => {
    try {
      await updateActivity(updatedActivity);
      toast.success("Atividade atualizada com sucesso");
      setEditingActivity(null);
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Ocorreu um erro ao atualizar a atividade");
    }
  };
  
  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteActivity(id);
      toast.success("Atividade excluída com sucesso");
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Ocorreu um erro ao excluir a atividade");
    }
  };
  
  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await toggleFeatured(id, featured);
      toast.success(`Atividade ${featured ? "destacada" : "removida dos destaques"} com sucesso`);
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast.error("Ocorreu um erro ao alterar o status de destaque");
    }
  };
  
  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleActive(id, active);
      toast.success(`Atividade ${active ? "ativada" : "desativada"} com sucesso`);
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast.error("Ocorreu um erro ao alterar o status da atividade");
    }
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