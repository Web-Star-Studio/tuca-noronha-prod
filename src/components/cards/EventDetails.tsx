"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  CalendarCheck,
  Tag,
  Heart,
  Share2,
  Star,
} from "lucide-react";
import { formatDate, cn, formatCurrency } from "@/lib/utils";
import type { Event } from "@/lib/services/eventService";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EventDetailsProps {
  event: Event;
}

export default function EventDetails({ event }: EventDetailsProps) {
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Initialize ticket quantities
  useEffect(() => {
    if (event.tickets && event.tickets.length > 0) {
      const initialQuantities: Record<string, number> = {};
      event.tickets.forEach(ticket => {
        initialQuantities[ticket.id] = 1;
      });
      setTicketQuantities(initialQuantities);
    } else {
      // Default ticket (single ticket case)
      setTicketQuantities({ "default": 1 });
    }
  }, [event.tickets]);
  
  const updateTicketQuantity = (ticketId: string, amount: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [ticketId]: Math.max(1, (prev[ticketId] || 1) + amount)
    }));
  };
  
  // Format date for display
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);

  return (
    <main className="pb-20">
      {/* Hero Image Section */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className={`object-cover brightness-[0.85] transition-opacity duration-700 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          priority
          onLoad={() => setIsImageLoaded(true)}
        />
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white container mx-auto">
          <div className="max-w-3xl">
            <Link
              href="/eventos"
              className={cn(
                "inline-flex absolute -top-12 left-10 items-center text-sm gap-1 transition-colors font-medium",
                "text-white hover:text-white/90 hover:underline hover:underline-offset-2"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar para Eventos</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge
                variant="secondary"
                className="bg-white/20 backdrop-blur-sm"
              >
                {event.category}
              </Badge>
              <Badge
                variant={event.isActive ? "outline" : "secondary"}
                className={event.isActive ? "border-white/40 text-white" : "bg-gray-500/90"}
              >
                {event.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-shadow-sm">
              {event.title}
            </h1>
            <div className="flex items-center gap-1 text-yellow-400 mb-4">
              <Star className="h-5 w-5 fill-yellow-400" />
              <span className="font-medium">4.8</span>
              <span className="text-white/80 text-sm">(124 avaliações)</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  {event.time}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{event.maxParticipants > 0 ? `${event.maxParticipants} vagas disponíveis` : 'Vagas ilimitadas'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sticky Sidebar */}
      <div className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="mb-6 w-full justify-start bg-transparent rounded-none p-3 h-auto">
                <TabsTrigger
                  value="info"
                  className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-0 px-4 font-medium"
                >
                  Detalhes
                </TabsTrigger>
                <TabsTrigger
                  value="tickets"
                  className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-0 px-4 font-medium"
                >
                  Ingressos
                </TabsTrigger>
                <TabsTrigger
                  value="policies"
                  className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-0 px-4 font-medium"
                >
                  Políticas
                </TabsTrigger>
              </TabsList>

              {/* Info tab */}
              <TabsContent value="info" className="space-y-10 mt-2">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Sobre o evento
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-5">
                    Detalhes do evento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100">
                      <CardContent className="p-5">
                        <div className="flex items-start">
                          <div className="bg-blue-50 p-2 rounded-full mr-4">
                            <CalendarCheck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Data e Hora</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {formattedDate}
                            </p>
                            <p className="text-sm text-gray-600">
                              {event.time}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100">
                      <CardContent className="p-5">
                        <div className="flex items-start">
                          <div className="bg-blue-50 p-2 rounded-full mr-4">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Local</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.location}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.address}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100">
                      <CardContent className="p-5">
                        <div className="flex items-start">
                          <div className="bg-blue-50 p-2 rounded-full mr-4">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Capacidade</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.maxParticipants > 0 ? `${event.maxParticipants} lugares no total` : 'Capacidade ilimitada'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Vagas disponíveis
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-100">
                      <CardContent className="p-5">
                        <div className="flex items-start">
                          <div className="bg-blue-50 p-2 rounded-full mr-4">
                            <Tag className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Organizador</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.creatorName || 'Turismo Nativo'}
                            </p>
                            <p className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer mt-1">
                              Ver todos os eventos
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {event.highlights && event.highlights.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Destaques
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {event.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <Star className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-gray-700">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tickets tab */}
              <TabsContent value="tickets" className="space-y-6 mt-2">
                <h2 className="text-2xl font-semibold mb-4">
                  Ingressos Disponíveis
                </h2>
                
                <div className="space-y-4">
                  {/* Multiple tickets case */}
                  {event.hasMultipleTickets && event.tickets && event.tickets.length > 0 ? (
                    event.tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className={`transition-all border-gray-200 hover:border-blue-300 ${
                          selectedTicketId === ticket.id
                            ? "ring-2 ring-blue-500 border-blue-300 shadow-md"
                            : "shadow-sm"
                        }`}
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                              <div className="flex items-center">
                                <h3 className="text-lg font-semibold">
                                  {ticket.name}
                                </h3>
                                {ticket.type === "vip" && (
                                  <Badge className="ml-2 bg-amber-500">
                                    VIP
                                  </Badge>
                                )}
                                {ticket.type === "discount" && (
                                  <Badge className="ml-2 bg-green-500">
                                    Promocional
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mt-1">
                                {ticket.description}
                              </p>

                              {ticket.benefits && ticket.benefits.length > 0 && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium text-gray-800">
                                    Inclui:
                                  </h4>
                                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                    {ticket.benefits.map((item, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start"
                                      >
                                        <span className="text-blue-500 mr-1.5">
                                          ✓
                                        </span>{" "}
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="text-xl font-bold text-gray-900 mb-2">
                                {ticket.price > 0 ? formatCurrency(ticket.price) : 'Gratuito'}
                              </div>
                              <div className="text-sm text-gray-500 mb-3">
                                {ticket.availableQuantity > 0 ? `${ticket.availableQuantity} vagas disponíveis` : 'Vagas ilimitadas'}
                              </div>

                              <div className="flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTicketQuantity(ticket.id, -1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100"
                                  disabled={(ticketQuantities[ticket.id] || 1) <= 1}
                                >
                                  -
                                </button>
                                <div className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300 bg-white">
                                  {ticketQuantities[ticket.id] || 1}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTicketQuantity(ticket.id, 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                                  disabled={ticket.availableQuantity > 0 && (ticketQuantities[ticket.id] || 1) >= Math.min(ticket.availableQuantity, ticket.maxPerOrder)}
                                >
                                  +
                                </button>
                              </div>

                              <Button
                                className="mt-4 w-full md:w-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicketId(ticket.id);
                                }}
                              >
                                Selecionar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    // Single ticket case (default)
                    <Card
                      className={`transition-all border-gray-200 hover:border-blue-300 ${
                        selectedTicketId === "default"
                          ? "ring-2 ring-blue-500 border-blue-300 shadow-md"
                          : "shadow-sm"
                      }`}
                      onClick={() => setSelectedTicketId("default")}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="mb-4 md:mb-0">
                            <div className="flex items-center">
                              <h3 className="text-lg font-semibold">
                                Ingresso Padrão
                              </h3>
                              {event.isFeatured && (
                                <Badge className="ml-2 bg-amber-500">
                                  Destaque
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1">
                              Acesso completo ao evento
                            </p>

                            {event.includes && event.includes.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-800">
                                  Inclui:
                                </h4>
                                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                  {event.includes.map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start"
                                    >
                                      <span className="text-blue-500 mr-1.5">
                                        ✓
                                      </span>{" "}
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end">
                            <div className="text-xl font-bold text-gray-900 mb-2">
                              {event.price > 0 ? formatCurrency(event.price) : 'Gratuito'}
                            </div>
                            <div className="text-sm text-gray-500 mb-3">
                              {event.maxParticipants > 0 ? `${event.maxParticipants} vagas disponíveis` : 'Vagas ilimitadas'}
                            </div>

                            <div className="flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTicketQuantity("default", -1);
                                }}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100"
                                disabled={(ticketQuantities["default"] || 1) <= 1}
                              >
                                -
                              </button>
                              <div className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300 bg-white">
                                {ticketQuantities["default"] || 1}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTicketQuantity("default", 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                                disabled={event.maxParticipants > 0 && (ticketQuantities["default"] || 1) >= event.maxParticipants}
                              >
                                +
                              </button>
                            </div>

                            <Button
                              className="mt-4 w-full md:w-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicketId("default");
                              }}
                            >
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Policies tab */}
              <TabsContent value="policies" className="space-y-6 mt-2">
                <h2 className="text-2xl font-semibold mb-4">Políticas do Evento</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Política de Cancelamento</h3>
                    <p className="text-gray-700">
                      Cancelamentos realizados com até 48 horas de antecedência do evento serão reembolsados em 100%. 
                      Cancelamentos com menos de 48 horas não serão reembolsados.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Política de Reembolso</h3>
                    <p className="text-gray-700">
                      Reembolsos são processados em até 10 dias úteis após a solicitação de cancelamento. 
                      O valor será creditado na mesma forma de pagamento utilizada na compra.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Termos e Condições</h3>
                    <p className="text-gray-700">
                      Ao adquirir ingressos para este evento, você concorda com os termos e condições estabelecidos pelo organizador. 
                      É proibida a revenda de ingressos. Menores de 18 anos devem estar acompanhados de responsável legal.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Sticky on desktop */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold mb-2">Resumo</h3>
                  <div className="text-gray-600 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span className="font-medium text-gray-800">{formattedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horário:</span>
                      <span className="font-medium text-gray-800">{event.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Local:</span>
                      <span className="font-medium text-gray-800">{event.location}</span>
                    </div>
                    
                    {/* Show selected ticket info if available */}
                    {event.hasMultipleTickets && event.tickets && selectedTicketId ? (
                      <>
                        {event.tickets.find(t => t.id === selectedTicketId) && (
                          <>
                            <div className="flex justify-between">
                              <span>Ingresso:</span>
                              <span className="font-medium text-gray-800">
                                {event.tickets.find(t => t.id === selectedTicketId)?.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Preço unitário:</span>
                              <span className="font-medium text-gray-800">
                                {formatCurrency(event.tickets.find(t => t.id === selectedTicketId)?.price || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quantidade:</span>
                              <span className="font-medium text-gray-800">
                                {ticketQuantities[selectedTicketId] || 1}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 mt-2">
                              <span>Total:</span>
                              <span className="font-medium text-gray-800">
                                {formatCurrency(
                                  (event.tickets.find(t => t.id === selectedTicketId)?.price || 0) * 
                                  (ticketQuantities[selectedTicketId] || 1)
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Default ticket info */}
                        <div className="flex justify-between">
                          <span>Ingresso:</span>
                          <span className="font-medium text-gray-800">Padrão</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Preço unitário:</span>
                          <span className="font-medium text-gray-800">
                            {event.price > 0 ? formatCurrency(event.price) : 'Gratuito'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantidade:</span>
                          <span className="font-medium text-gray-800">
                            {ticketQuantities["default"] || 1}
                          </span>
                        </div>
                        {event.price > 0 && (
                          <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 mt-2">
                            <span>Total:</span>
                            <span className="font-medium text-gray-800">
                              {formatCurrency(event.price * (ticketQuantities["default"] || 1))}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <Button 
                    className="w-full mb-3 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!selectedTicketId}
                  >
                    Reservar agora
                  </Button>
                  
                  <div className="flex justify-between gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      <span className="hidden sm:inline">Favoritar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Compartilhar</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gallery preview */}
            {event.galleryImages && event.galleryImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Galeria</h3>
                <div className="grid grid-cols-3 gap-2">
                  {event.galleryImages.slice(0, 6).map((image, idx) => (
                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden">
                      <Image
                        src={image}
                        alt={`Imagem ${idx + 1} do evento`}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}