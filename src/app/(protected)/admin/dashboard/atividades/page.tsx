"use client"

import activitiesStore, { type Activity } from "@/lib/store/activitiesStore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Star, Trash2, ChevronLeft, ChevronRight, Loader2, ExternalLink, Clock } from "lucide-react"
import Link from "next/link"
import { useState, useMemo } from "react"
import Image from "next/image"
import { useCreateActivity, useActivities, useUpdateActivity, useDeleteActivity, useToggleFeatured, useToggleActive } from "@/lib/services/activityService"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function ActivityCard({ activity, onEdit, onDelete, onToggleFeatured, onToggleActive }: { 
  activity: Activity; 
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <div
        className={cn(
          "group overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col",
          !activity.isActive && "opacity-75 hover:opacity-90"
        )}
        onClick={() => onEdit(activity)}
      >
        <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
          {activity.imageUrl && activity.imageUrl.trim() !== '' ? (
            <Image
              src={activity.imageUrl}
              alt={activity.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-sm">Sem imagem</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Badge de categoria */}
          <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
            {activity.category}
          </div>
          
          {/* Badge de preço */}
          <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md">
            R$ {activity.price.toFixed(2)}
          </div>
          
          {activity.isFeatured && (
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 shadow-md px-2.5 py-1 rounded-full text-xs font-medium text-black flex items-center gap-1">
                <Star className="h-3 w-3 fill-black" /> Destaque
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col grow p-5">
          <div className="mb-2 flex justify-between items-start">
            <h3 className="text-lg font-medium line-clamp-1">{activity.title}</h3>
            <div className="flex gap-1.5">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-50 hover:bg-amber-100 transition-colors duration-200 shadow-sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onToggleFeatured(activity.id, !activity.isFeatured);
                }}
              >
                <Star className={`h-4 w-4 ${activity.isFeatured ? "fill-amber-500 text-amber-500" : "text-amber-400"}`} />
                <span className="sr-only">{activity.isFeatured ? "Remover destaque" : "Destacar"}</span>
              </motion.button>
              
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href={`/atividades/${activity.id}`} 
                  target="_blank"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200 shadow-sm"
                >
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                  <span className="sr-only">Ver página</span>
                </Link>
              </motion.div>
              
              <button 
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 shadow-sm cursor-pointer",
                  "bg-red-50 hover:bg-red-100 hover:shadow-md hover:scale-105 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                )}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete(activity.id);
                }}
                aria-label="Excluir atividade"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {activity.shortDescription}
          </p>
          
          <div className="mt-auto space-y-3">
            <div className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{activity.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span>{activity.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="line-clamp-1">Dificuldade: {activity.difficulty}</span>
              </div>
              
              <button
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 shadow-sm cursor-pointer",
                  "hover:shadow-md hover:scale-105 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  activity.isActive 
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 focus-visible:ring-emerald-500' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 focus-visible:ring-gray-500'
                )}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onToggleActive(activity.id, !activity.isActive);
                }}
                aria-label={activity.isActive ? "Desativar atividade" : "Ativar atividade"}
              >
                {activity.isActive ? "Ativo" : "Inativo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActivityForm({ activity, onSave, onCancel }: { 
  activity?: Activity;
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}) {
  const categories = activitiesStore(state => state.categories);
  const { user, isAuthenticated } = useCurrentUser();
  
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Activity>(
    activity || {
      id: "",
      title: "",
      description: "",
      shortDescription: "",
      price: 0,
      category: "",
      duration: "",
      maxParticipants: 1,
      minParticipants: 1,
      difficulty: "Fácil",
      rating: 5,
      imageUrl: "",
      galleryImages: [],
      highlights: [],
      includes: [],
      itineraries: [],
      excludes: [],
      additionalInfo: [],
      cancelationPolicy: [],
      isFeatured: false,
      isActive: true,
      hasMultipleTickets: false,
      tickets: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as Activity
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
      
      // Pass the form data to the parent component which will handle the API calls
      // This prevents duplicate activity creation
      onSave(formData);
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
        <TabsList className="mb-6 bg-white/80 backdrop-blur-sm border-none shadow-sm w-full flex overflow-x-auto sticky top-0 z-10">
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
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={formData.isActive ? "default" : "outline"}
                size="sm"
                className={formData.isActive ? "bg-green-600 hover:bg-green-700" : "border-gray-300 text-gray-700"}
                onClick={() => {
                  const newState = !formData.isActive;
                  setFormData({ ...formData, isActive: newState });
                  toast.success(newState ? "Atividade ativada" : "Atividade desativada");
                }}
              >
                {formData.isActive ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-white mr-2" /> 
                    Atividade Disponível
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                    Atividade Indisponível
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={formData.isFeatured ? "default" : "outline"}
                size="sm"
                className={formData.isFeatured ? "bg-amber-500 hover:bg-amber-600" : "border-gray-300 text-gray-700"}
                onClick={() => {
                  const newState = !formData.isFeatured;
                  setFormData({ ...formData, isFeatured: newState });
                  toast.success(newState ? "Atividade destacada" : "Destaque removido");
                }}
              >
                <Star className={`h-4 w-4 mr-2 ${formData.isFeatured ? 'fill-white text-white' : ''}`} />
                {formData.isFeatured ? "Em destaque" : "Adicionar aos destaques"}
              </Button>
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
            
            {formData.imageUrl && formData.imageUrl.trim() !== '' && (
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
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 border-none text-white"
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
  
  // Fetch activities from Convex - use useMemo to avoid unnecessary re-renders
  const { activities: activitiesData } = useActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const toggleFeatured = useToggleFeatured();
  const toggleActive = useToggleActive();
  
  // Store activities in a memoized value to prevent unnecessary re-renders
  const allActivities = useMemo(() => activitiesData || [], [activitiesData]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const categories = activitiesStore(state => state.categories);
  
  // Filtered activities based on search and filters - memoize to prevent re-renders
  const filteredActivities = useMemo(() => {
    return allActivities.filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || activity.category === filterCategory;
      const matchesFeatured = !showFeaturedOnly || activity.isFeatured;
      
      return matchesSearch && matchesCategory && matchesFeatured;
    });
  }, [allActivities, searchQuery, filterCategory, showFeaturedOnly]);

  // Handle CRUD operations
  const handleCreateActivity = async (newActivity: Activity) => {
    if (!isAuthenticated || !user) {
      toast.error("Você precisa estar logado para criar uma atividade");
      return;
    }
    
    try {
      // Use the clerk ID for user identification
      const clerkId = user.id;
      
      // Save the creator information
      await createActivity(newActivity);
      
      // Log the creation for audit purposes
      console.log(`Activity created by user ${user.id} at ${new Date().toISOString()}`);
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
          <DialogContent className="sm:max-w-[850px] bg-white/95 backdrop-blur-md border-none shadow-xl max-h-[90vh] overflow-y-auto">
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
          
          <div className="flex items-center space-x-2 md:pt-6">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${showFeaturedOnly ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            >
              <Star className={`h-4 w-4 ${showFeaturedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              {showFeaturedOnly ? 'Apenas destaques' : 'Todos os itens'}
            </Button>
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
            onToggleActive={handleToggleActive}
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
          <DialogContent className="sm:max-w-[850px] bg-white/95 backdrop-blur-md border-none shadow-xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="bg-white/95 backdrop-blur-md border-none shadow-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta atividade?
                <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200 text-red-700 text-sm">
                  Ao excluir esta atividade, todos os dados associados também serão removidos.
                </div>
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