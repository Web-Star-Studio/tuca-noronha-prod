"use client";

import { Event, EventTicket, useEventTicketsQuery } from "@/lib/services/eventService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, Plus, Star, Trash2, X, Ticket, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    event || {
      id: uuidv4(),
      title: "",
      description: "",
      shortDescription: "",
      date: "",
      time: "",
      location: "",
      address: "",
      price: 0,
      category: categories[0],
      maxParticipants: 100,
      imageUrl: "https://source.unsplash.com/random/800x600/?event",
      galleryImages: [],
      highlights: [],
      includes: [],
      additionalInfo: [],
      isFeatured: false,
      isActive: true,
      hasMultipleTickets: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      partnerId: "",
      speaker: "",
      speakerBio: "",
      tickets: []
    }
  );

  // Use TanStack Query to fetch tickets from database when editing an event
  const { data: dbTickets, isLoading: ticketsLoading, isError: ticketsError } = useEventTicketsQuery(event?.id || null);
  
  // Default tickets state
  const [tickets, setTickets] = useState<EventTicket[]>(() => {
    if (event?.tickets && event.tickets.length > 0) {
      // Usar tickets do evento existente
      return event.tickets;
    } else if (event?.hasMultipleTickets) {
      // Se o evento tem múltiplos ingressos marcado mas não tem tickets
      return [{
        id: uuidv4(),
        eventId: event.id,
        name: "Ingresso Padrão",
        description: "Acesso completo ao evento",
        price: event.price || 0,
        availableQuantity: 100,
        maxPerOrder: 10,
        type: "regular",
        benefits: event.includes || [],
        isActive: true,
        createdAt: new Date()
      }];
    }
    // Caso contrário, retorna array vazio
    return [];
  });
  
  // Update tickets state when database tickets are loaded
  useEffect(() => {
    if (dbTickets && dbTickets.length > 0 && event?.id) {
      setTickets(dbTickets);
      // Also enable multiple tickets if there are tickets in database
      if (!formData.hasMultipleTickets && dbTickets.length > 0) {
        setFormData(prev => ({
          ...prev,
          hasMultipleTickets: true
        }));
      }
    }
  }, [dbTickets, event?.id]);

  // Form tabs
  const [activeTab, setActiveTab] = useState("basic");
  
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
      setActiveTab("tickets");
    } else if (activeTab === "tickets") {
      setActiveTab("additional");
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "details") {
      setActiveTab("basic");
    } else if (activeTab === "media") {
      setActiveTab("details");
    } else if (activeTab === "tickets") {
      setActiveTab("media");
    } else if (activeTab === "additional") {
      setActiveTab("tickets");
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

  // Ticket management
  const addTicket = () => {
    // Se já existem tickets, cria um com base no último adicionado
    const lastTicket = tickets.length > 0 ? tickets[tickets.length - 1] : null;
    
    const newTicket: EventTicket = {
      id: uuidv4(),
      eventId: formData.id,
      name: lastTicket ? `${lastTicket.name} (cópia)` : "Ingresso Padrão",
      description: lastTicket ? lastTicket.description : "Acesso completo ao evento",
      price: lastTicket ? lastTicket.price : formData.price,
      availableQuantity: lastTicket ? lastTicket.availableQuantity : 100,
      maxPerOrder: lastTicket ? lastTicket.maxPerOrder : 10,
      type: lastTicket ? lastTicket.type : "regular",
      benefits: lastTicket ? [...lastTicket.benefits] : [],
      isActive: true,
      createdAt: new Date()
    };
    
    // Adiciona notificação
    toast.success("Novo tipo de ingresso adicionado");
    
    setTickets([...tickets, newTicket]);
  };

  const updateTicket = (index: number, field: keyof EventTicket, value: any) => {
    const updatedTickets = [...tickets];
    updatedTickets[index] = {
      ...updatedTickets[index],
      [field]: value
    };
    setTickets(updatedTickets);
  };

  const removeTicket = (index: number) => {
    // Pegar o nome do ticket para a mensagem
    const ticketName = tickets[index]?.name || "Ingresso";
    
    const updatedTickets = [...tickets];
    updatedTickets.splice(index, 1);
    setTickets(updatedTickets);
    
    // Adiciona notificação
    toast.error(`"${ticketName}" removido`);
    
    // Se não sobrou nenhum ticket, cria um novo automaticamente
    if (updatedTickets.length === 0) {
      // Desativa múltiplos ingressos se não houver mais tickets
      setFormData({
        ...formData,
        hasMultipleTickets: false
      });
      
      toast.info("Opção de múltiplos ingressos foi desativada");
    }
  };

  const addTicketBenefit = (ticketIndex: number) => {
    const updatedTickets = [...tickets];
    updatedTickets[ticketIndex].benefits.push("");
    setTickets(updatedTickets);
  };

  const updateTicketBenefit = (ticketIndex: number, benefitIndex: number, value: string) => {
    const updatedTickets = [...tickets];
    updatedTickets[ticketIndex].benefits[benefitIndex] = value;
    setTickets(updatedTickets);
  };

  const removeTicketBenefit = (ticketIndex: number, benefitIndex: number) => {
    const updatedTickets = [...tickets];
    updatedTickets[ticketIndex].benefits.splice(benefitIndex, 1);
    setTickets(updatedTickets);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLastTab) {
      goToNextTab();
      return;
    }
    
    if (!isValid()) return;
    
    // Validar ingressos se múltiplos ingressos estiver ativado
    if (formData.hasMultipleTickets && tickets.length === 0) {
      toast.error("É necessário adicionar pelo menos um ingresso quando a opção 'múltiplos ingressos' está ativada");
      setActiveTab("tickets");
      return;
    }
    
    // Validar preenchimento dos campos de ingressos
    if (formData.hasMultipleTickets) {
      const invalidTickets = tickets.filter(ticket => !ticket.name || !ticket.description);
      if (invalidTickets.length > 0) {
        toast.error("Todos os ingressos precisam ter nome e descrição");
        setActiveTab("tickets");
        return;
      }
    }
    
    // Update the form data with the tickets
    const updatedFormData = {
      ...formData,
      tickets,
      hasMultipleTickets: formData.hasMultipleTickets
    };
    
    console.log("Submitting form with tickets:", tickets);
    console.log("Multiple tickets enabled:", formData.hasMultipleTickets);
    
    onSubmit(updatedFormData);
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
          <TabsTrigger value="tickets" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            4. Ingressos
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            5. Informações Adicionais
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
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
                placeholder="Nome do evento"
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

          <div className="grid grid-cols-2 gap-6">
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

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-2 gap-6">
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

          <div className="grid grid-cols-2 gap-6">
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

          <div className="grid grid-cols-2 gap-6">
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Galeria de Imagens</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-0 bg-white/80"
                onClick={() => handleAddArrayItem("galleryImages")}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Imagem
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {formData.galleryImages.map((image, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={image}
                    onChange={(e) => handleArrayItemChange(index, e.target.value, "galleryImages")}
                    placeholder="URL da imagem"
                    className="bg-white shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArrayItem(index, "galleryImages")}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {formData.galleryImages.length === 0 && (
                <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                  Adicione imagens para a galeria
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          {ticketsLoading && event?.id && (
            <div className="flex items-center justify-center p-6 bg-blue-50/30 rounded-lg">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-2" />
              <span className="text-blue-800">Carregando ingressos...</span>
            </div>
          )}
          
          {ticketsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar ingressos</AlertTitle>
              <AlertDescription>
                Não foi possível carregar os ingressos do banco de dados. Por favor, tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <Label htmlFor="hasMultipleTickets" className="font-medium">Habilitar múltiplos tipos de ingressos</Label>
                <Switch 
                  id="hasMultipleTickets" 
                  checked={formData.hasMultipleTickets}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      hasMultipleTickets: checked
                    });
                    
                    // Adicione automaticamente um ticket ao ativar, se não houver nenhum
                    if (checked && tickets.length === 0) {
                      addTicket();
                    }
                  }}
                />
              </div>
              
              <Button
                type="button"
                variant={formData.hasMultipleTickets ? "default" : "outline"}
                size="sm"
                className={formData.hasMultipleTickets ? "bg-blue-600 text-white mt-0" : "mt-0 bg-white/80 text-gray-400"}
                onClick={addTicket}
                disabled={!formData.hasMultipleTickets}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Ingresso
              </Button>
            </div>
            
            {!formData.hasMultipleTickets ? (
              <div className="p-6 bg-blue-50/50 rounded-lg border border-blue-100 text-blue-800">
                <div className="flex items-start gap-3">
                  <Ticket className="h-5 w-5 mt-0.5 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Ingresso único</h3>
                    <p className="text-sm mt-1">
                      O evento terá apenas um tipo de ingresso com o preço básico configurado na etapa 1.
                      Para oferecer diferentes tipos de ingressos (ex: VIP, padrão, promocional), ative o switch acima.
                    </p>
                    <div className="mt-4 flex">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            hasMultipleTickets: true
                          });
                          // Adicione automaticamente um ticket
                          if (tickets.length === 0) {
                            addTicket();
                          }
                        }}
                      >
                        Ativar múltiplos ingressos
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {tickets.length === 0 ? (
                  <div className="py-12 text-center border border-dashed rounded-md bg-blue-50/30">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                    <p className="text-gray-700 font-medium">Nenhum ingresso adicionado</p>
                    <p className="text-gray-500 mt-2 mb-4">Clique no botão abaixo para adicionar seu primeiro tipo de ingresso</p>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={addTicket}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Adicionar primeiro ingresso
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
                    {tickets.map((ticket, ticketIndex) => (
                      <div key={ticket.id} className="border border-gray-200 rounded-md p-4 bg-white shadow-sm">
                        <div className="flex justify-between mb-4">
                          <h3 className="font-semibold text-lg flex items-center">
                            <Ticket className="h-5 w-5 mr-2 text-blue-600" />
                            Ingresso #{ticketIndex + 1}
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTicket(ticketIndex)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor={`ticket-name-${ticketIndex}`} className="text-sm font-medium">Nome</Label>
                            <Input 
                              id={`ticket-name-${ticketIndex}`}
                              value={ticket.name} 
                              onChange={(e) => updateTicket(ticketIndex, 'name', e.target.value)}
                              className="mt-1 bg-white shadow-sm"
                              placeholder="ex: Ingresso VIP"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`ticket-type-${ticketIndex}`} className="text-sm font-medium">Tipo</Label>
                            <Select 
                              value={ticket.type}
                              onValueChange={(value) => updateTicket(ticketIndex, 'type', value)}
                            >
                              <SelectTrigger id={`ticket-type-${ticketIndex}`} className="mt-1 bg-white shadow-sm">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                                <SelectItem value="discount">Promocional</SelectItem>
                                <SelectItem value="free">Gratuito</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <Label htmlFor={`ticket-desc-${ticketIndex}`} className="text-sm font-medium">Descrição</Label>
                          <Textarea 
                            id={`ticket-desc-${ticketIndex}`}
                            value={ticket.description} 
                            onChange={(e) => updateTicket(ticketIndex, 'description', e.target.value)}
                            className="mt-1 bg-white shadow-sm"
                            placeholder="Descrição do ingresso"
                            rows={2}
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label htmlFor={`ticket-price-${ticketIndex}`} className="text-sm font-medium">Preço (R$)</Label>
                            <Input 
                              id={`ticket-price-${ticketIndex}`}
                              type="number"
                              value={ticket.price}
                              onChange={(e) => updateTicket(ticketIndex, 'price', parseFloat(e.target.value))}
                              min="0"
                              step="0.01"
                              className="mt-1 bg-white shadow-sm"
                              placeholder="0.00"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`ticket-qty-${ticketIndex}`} className="text-sm font-medium">Quantidade disponível</Label>
                            <Input 
                              id={`ticket-qty-${ticketIndex}`}
                              type="number"
                              value={ticket.availableQuantity}
                              onChange={(e) => updateTicket(ticketIndex, 'availableQuantity', parseInt(e.target.value))}
                              min="1"
                              className="mt-1 bg-white shadow-sm"
                              placeholder="100"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`ticket-max-${ticketIndex}`} className="text-sm font-medium">Máximo por pedido</Label>
                            <Input 
                              id={`ticket-max-${ticketIndex}`}
                              type="number"
                              value={ticket.maxPerOrder}
                              onChange={(e) => updateTicket(ticketIndex, 'maxPerOrder', parseInt(e.target.value))}
                              min="1"
                              className="mt-1 bg-white shadow-sm"
                              placeholder="10"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Benefícios inclusos</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-0 bg-white"
                              onClick={() => addTicketBenefit(ticketIndex)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Adicionar
                            </Button>
                          </div>
                          
                          <div className="space-y-2 pl-2">
                            {ticket.benefits.length > 0 ? (
                              ticket.benefits.map((benefit, benefitIndex) => (
                                <div key={benefitIndex} className="flex items-center gap-2">
                                  <Input
                                    value={benefit}
                                    onChange={(e) => updateTicketBenefit(ticketIndex, benefitIndex, e.target.value)}
                                    placeholder="Benefício incluído"
                                    className="bg-white shadow-sm text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTicketBenefit(ticketIndex, benefitIndex)}
                                    className="h-8 w-8"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="py-3 text-center text-sm text-gray-400 border border-dashed rounded-md">
                                Nenhum benefício adicionado
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                          <Switch 
                            id={`ticket-active-${ticketIndex}`}
                            checked={ticket.isActive}
                            onCheckedChange={(checked) => updateTicket(ticketIndex, 'isActive', checked)}
                            className="mr-2"
                          />
                          <Label htmlFor={`ticket-active-${ticketIndex}`} className="text-sm">
                            {ticket.isActive ? 'Ingresso ativo' : 'Ingresso inativo'}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
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