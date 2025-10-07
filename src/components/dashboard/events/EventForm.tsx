"use client";

import { Event } from "@/lib/services/eventService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { MediaSelector } from "@/components/dashboard/media";
import { SupplierSelect } from "@/components/dashboard/SupplierSelect";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { Media } from "@/lib/services/mediaService";
import { parseMediaEntry, serializeMediaEntry } from "@/lib/media";
import { SmartMedia } from "@/components/ui/smart-media";

type EventFormProps = {
  event: Event | null;
  onSubmit: (event: Event) => void;
  onCancel: () => void;
  loading?: boolean;
};

export function EventForm({
  event,
  onSubmit,
  onCancel,
  loading = false
}: EventFormProps) {
  const categories = ["Passeio", "Workshop", "Palestra", "Curso", "Festa", "Gastronomia", "Cultural"];
  
  const [formData, setFormData] = useState<Event>(
    event
      ? { ...event, netRate: event.netRate ?? event.price }
      : {
          id: uuidv4(),
          title: "",
          description: "",
          shortDescription: "",
          date: "",
          time: "",
          location: "",
          address: "",
          price: 0,
          netRate: 0,
          category: categories[0],
          maxParticipants: 100,
          imageUrl: "https://source.unsplash.com/random/800x600/?event",
          galleryImages: [],
          highlights: [],
          includes: [],
          additionalInfo: [],
          isFeatured: false,
          isActive: true,
          isFree: false,
          hasMultipleTickets: false,
          partnerId: "",
          supplierId: undefined,
          speaker: "",
          speakerBio: "",
          whatsappContact: "",
          externalBookingUrl: "",
          createdAt: new Date(),
          updatedAt: new Date()
        }
  );

  const galleryEntries = useMemo(
    () => formData.galleryImages.map(parseMediaEntry),
    [formData.galleryImages],
  );

  const heroEntry = useMemo(() => {
    const baseEntry = parseMediaEntry(formData.imageUrl ?? "");
    const matchingEntry = galleryEntries.find((entry) => entry.url === baseEntry.url);
    return matchingEntry ?? baseEntry;
  }, [formData.imageUrl, galleryEntries]);
  const heroUrl = heroEntry.url ?? "";
  const hasHeroMedia = Boolean(heroUrl && heroUrl.trim() !== "");

  const handleAppendGalleryMedia = useCallback((items: Media[]) => {
    setFormData((prev) => {
      if (items.length === 0) return prev;

      const existing = prev.galleryImages.map(parseMediaEntry);
      const existingUrls = new Set(existing.map((entry) => entry.url));

      const appended = items
        .filter((item) => !existingUrls.has(item.url))
        .map((item) => serializeMediaEntry({ url: item.url, type: item.fileType || undefined }));

      if (appended.length === 0) return prev;

      return {
        ...prev,
        galleryImages: [...prev.galleryImages, ...appended],
      };
    });
  }, []);

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        netRate: event.netRate ?? event.price,
      });
    }
  }, [event]);

  // Form tabs
  const [activeTab, setActiveTab] = useState("basic");
  const [mainMediaPickerOpen, setMainMediaPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  
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
  
  const handleArrayItemChange = (index: number, value: string, fieldName: keyof Event) => {
    const newArray = [...(formData[fieldName] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [fieldName]: newArray });
  };
  
  const handleAddArrayItem = (fieldName: keyof Event) => {
    const newArray = [...(formData[fieldName] as string[]), ""];
    setFormData({ ...formData, [fieldName]: newArray });
  };
  
  const handleRemoveArrayItem = (index: number, fieldName: keyof Event) => {
    const newArray = [...(formData[fieldName] as string[])];
    newArray.splice(index, 1);
    setFormData({ ...formData, [fieldName]: newArray });
  };

  const goToNextTab = () => {
    if (activeTab === "basic") {
      setActiveTab("details");
    } else if (activeTab === "details") {
      setActiveTab("media");
    } else if (activeTab === "media") {
      setActiveTab("additional");
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "details") {
      setActiveTab("basic");
    } else if (activeTab === "media") {
      setActiveTab("details");
    } else if (activeTab === "additional") {
      setActiveTab("media");
    }
  };

  const isLastTab = activeTab === "additional";
  const isFirstTab = activeTab === "basic";

  // Validate form
  const isValid = () => {
    if (!formData.title) {
      toast.error("O título é obrigatório");
      return false;
    }
    if (!formData.description) {
      toast.error("A descrição é obrigatória");
      return false;
    }
    if (!formData.shortDescription) {
      toast.error("A descrição curta é obrigatória");
      return false;
    }
    if (!formData.date) {
      toast.error("A data é obrigatória");
      return false;
    }
    if (!formData.time) {
      toast.error("O horário é obrigatório");
      return false;
    }
    if (!formData.location) {
      toast.error("O local é obrigatório");
      return false;
    }
    if (!formData.address) {
      toast.error("O endereço é obrigatório");
      return false;
    }
    if (formData.netRate < 0) {
      toast.error("A tarifa net não pode ser negativa");
      return false;
    }
    if (formData.netRate > formData.price) {
      toast.error("A tarifa net deve ser menor ou igual ao preço");
      return false;
    }
    if (!formData.category) {
      toast.error("A categoria é obrigatória");
      return false;
    }
    if (!formData.imageUrl) {
      toast.error("A URL da imagem é obrigatória");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLastTab) {
      goToNextTab();
      return;
    }
    
    if (!isValid()) return;
    
    // Submit the form data without ticket validation
    onSubmit(formData);
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
          <TabsTrigger value="media" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            3. Mídia
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            4. Informações Adicionais
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-sm font-medium">Título</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="Nome do evento"
                required 
              />
            </div>
            
            <div className="md:col-span-2">
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
          
          <div className="col-span-2">
            <Label htmlFor="description" className="text-sm font-medium">Descrição Completa</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              rows={4} 
              className="mt-1.5 bg-white shadow-sm"
              placeholder="Descrição detalhada do evento" 
              required 
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
              <Label htmlFor="price" className="text-sm font-medium">
                Preço (R$) {formData.isFree && <span className="text-xs text-gray-500">(Desabilitado - Asset Gratuito)</span>}
              </Label>
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
                disabled={formData.isFree}
                required={!formData.isFree}
              />
            </div>

            <div>
              <Label htmlFor="netRate" className="text-sm font-medium">
                Tarifa net (R$) {formData.isFree && <span className="text-xs text-gray-500">(Desabilitado - Asset Gratuito)</span>}
              </Label>
              <Input 
                id="netRate" 
                name="netRate" 
                type="number" 
                value={formData.netRate} 
                onChange={handleNumberChange} 
                min="0" 
                step="0.01" 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="0.00"
                disabled={formData.isFree}
                required={!formData.isFree}
              />
              <p className="mt-1 text-xs text-slate-500">
                Custo líquido combinado com o fornecedor.
              </p>
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Checkbox
                  id="isFree"
                  checked={formData.isFree || false}
                  onCheckedChange={(checked) => {
                    const isFree = Boolean(checked);
                    setFormData({
                      ...formData,
                      isFree,
                      // Se gratuito, zerar preços
                      price: isFree ? 0 : formData.price,
                      netRate: isFree ? 0 : formData.netRate,
                    });
                  }}
                />
                <Label htmlFor="isFree" className="text-sm font-medium cursor-pointer">
                  Asset Gratuito (sem cobrança)
                </Label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Quando ativado, os usuários não passarão pelo fluxo de pagamento ao fazer reservas.
              </p>
            </div>

            <div className="col-span-2">
              <SupplierSelect
                value={formData.supplierId}
                onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              />
            </div>
          </div>
            
          <div className="grid grid-cols-1 gap-6 p-4 bg-blue-50/50 rounded-lg md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={formData.isActive ? "default" : "outline"}
                size="sm"
                className={formData.isActive ? "bg-green-600 hover:bg-green-700" : "border-gray-300 text-gray-700"}
                onClick={() => {
                  const newState = !formData.isActive;
                  setFormData({ ...formData, isActive: newState });
                  toast.success(newState ? "Evento ativado" : "Evento desativado");
                }}
              >
                {formData.isActive ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-white mr-2" /> 
                    Evento Disponível
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                    Evento Indisponível
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
                  toast.success(newState ? "Evento destacado" : "Destaque removido");
                }}
              >
                <Star className={`h-4 w-4 mr-2 ${formData.isFeatured ? 'fill-white text-white' : ''}`} />
                {formData.isFeatured ? "Em destaque" : "Adicionar aos destaques"}
              </Button>
            </div>
          </div>
        </TabsContent>
        {/* MediaSelector modals */}
        <MediaSelector
          open={mainMediaPickerOpen}
          onOpenChange={setMainMediaPickerOpen}
          initialSelected={heroUrl ? [heroUrl] : []}
          onSelect={() => {}}
          onSelectMedia={([item]) => {
            if (!item) return;
            setFormData((prev) => {
              const serialized = serializeMediaEntry({
                url: item.url,
                type: item.fileType || undefined,
              });
              const hasInGallery = prev.galleryImages.some(
                (entry) => parseMediaEntry(entry).url === item.url,
              );

              return {
                ...prev,
                imageUrl: item.url,
                galleryImages: hasInGallery
                  ? prev.galleryImages
                  : [...prev.galleryImages, serialized],
              };
            });
          }}
        />
        <MediaSelector
          open={galleryPickerOpen}
          onOpenChange={setGalleryPickerOpen}
          multiple
          initialSelected={galleryEntries.map((entry) => entry.url)}
          onSelect={() => {}}
          onSelectMedia={handleAppendGalleryMedia}
        />

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="date" className="text-sm font-medium">Data</Label>
              <Input 
                id="date" 
                name="date" 
                type="date"
                value={formData.date} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="time" className="text-sm font-medium">Horário</Label>
              <Input 
                id="time" 
                name="time" 
                type="time"
                value={formData.time} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="location" className="text-sm font-medium">Local</Label>
              <Input 
                id="location" 
                name="location" 
                value={formData.location} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="Nome do local"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
              <Input 
                id="address" 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="Endereço completo"
                required 
              />
            </div>
          </div>

          <div>
            <Label htmlFor="whatsappContact" className="text-sm font-medium">Contato WhatsApp (opcional)</Label>
            <Input 
              id="whatsappContact" 
              name="whatsappContact" 
              value={formData.whatsappContact || ""} 
              onChange={handleInputChange} 
              className="mt-1.5 bg-white shadow-sm"
              placeholder="ex: 5511999999999 (apenas números)"
              type="tel"
            />
            <p className="text-xs text-gray-500 mt-1">Informe o número no formato internacional (ex: 5511999999999) para que o botão de reserva leve para o chat do WhatsApp</p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="externalBookingUrl" className="text-sm font-medium">Link Externo para Reserva (opcional)</Label>
            <Input 
              id="externalBookingUrl" 
              name="externalBookingUrl" 
              value={formData.externalBookingUrl || ""} 
              onChange={handleInputChange} 
              className="mt-1.5 bg-white shadow-sm"
              placeholder="https://exemplo.com/reserva"
              type="url"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se preenchido, o botão de reserva levará os usuários diretamente para este link externo (ex: Sympla, Eventbrite, site próprio, etc.)
            </p>
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="speaker" className="text-sm font-medium">Palestrante/Anfitrião</Label>
              <Input 
                id="speaker" 
                name="speaker" 
                value={formData.speaker} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm"
                placeholder="Nome do palestrante"
              />
            </div>
            
            <div>
              <Label htmlFor="speakerBio" className="text-sm font-medium">Biografia do Palestrante</Label>
              <Textarea 
                id="speakerBio" 
                name="speakerBio" 
                value={formData.speakerBio} 
                onChange={handleInputChange} 
                className="mt-1.5 bg-white shadow-sm resize-none"
                placeholder="Breve biografia do palestrante"
              />
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          {/* Imagem Principal */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Imagem Principal</Label>
            <div className="flex items-center gap-2">
              <Input
                value={heroUrl}
                readOnly
                placeholder="Nenhuma imagem selecionada"
                className="flex-1 bg-white shadow-sm"
              />
              <Button type="button" onClick={() => setMainMediaPickerOpen(true)}>
                Selecionar da Biblioteca
              </Button>
            </div>
            {hasHeroMedia && (
              <div className="mt-4 relative h-40 overflow-hidden rounded-md">
                <SmartMedia
                  entry={heroEntry}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  imageProps={{ fill: true }}
                  videoProps={{ controls: true, preload: "metadata" }}
                />
              </div>
            )}
          </div>
          {/* Galeria de mídia */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Galeria</Label>
            <div className="flex flex-wrap gap-2">
              {galleryEntries.map((entry, idx) => (
                <div key={`${entry.url}-${idx}`} className="relative h-24 w-24 overflow-hidden rounded">
                  <SmartMedia
                    entry={entry}
                    alt={`Mídia ${idx + 1} da galeria do evento`}
                    className="h-full w-full object-cover"
                    imageProps={{ fill: true }}
                    videoProps={{ controls: true, preload: "metadata" }}
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded-full bg-white p-1 shadow"
                    onClick={() => {
                      const newGallery = [...formData.galleryImages];
                      newGallery.splice(idx, 1);
                      setFormData({ ...formData, galleryImages: newGallery });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
              <Button type="button" onClick={() => setGalleryPickerOpen(true)}>
                Adicionar mídia
              </Button>
            </div>
          </div>  
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value="additional" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Destaques do Evento</Label>
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
            
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {formData.highlights.map((highlight, index) => (
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
                  Adicione os principais destaques do evento
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">O que está incluído</Label>
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
                  Adicione o que está incluído no evento
                </div>
              )}
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
                  Adicione informações adicionais sobre o evento
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
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 border-none text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Processando...
            </>
          ) : isLastTab ? (
            <>
              {event ? "Atualizar" : "Criar"} Evento
            </>
          ) : (
            <>
              Continuar <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
