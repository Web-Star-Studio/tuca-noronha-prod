"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  CalendarCheck,
  Tag,
  Info,
  Heart,
  Share2,
  Star,
  ShoppingBag,
} from "lucide-react";
import { Event, useEventsStore } from "@/lib/store/eventsStore";
import { formatDate, cn } from "@/lib/utils";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { events } = useEventsStore();

  useEffect(() => {
    // Simulate API call with mock data
    setIsLoading(true);
    const eventId = parseInt(params.id);

    // Find event in mock data
    setTimeout(() => {
      const foundEvent = events.find((e) => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      }
      setIsLoading(false);
    }, 500);
  }, [params.id, events]);

  // Handle 404 case
  if (!isLoading && !event) {
    notFound();
  }

  if (isLoading || !event) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="animate-pulse space-y-8">
          {/* Loading skeleton */}
          <div className="h-10 w-40 bg-gray-200 rounded"></div>
          <div className="h-96 w-full bg-gray-200 rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-gray-200 rounded"></div>
            <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
            <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);

  return (
    <>
      <main className="pb-20">
        {/* Hero Image Section */}
        <div className="relative w-full h-[70vh] overflow-hidden">
          <Image
            src={event.image_url}
            alt={event.name}
            fill
            className="object-cover brightness-[0.85]"
            priority
          />
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
                  variant={
                    event.status === "scheduled" ? "outline" : "secondary"
                  }
                  className={
                    event.status === "scheduled"
                      ? "border-white/40 text-white"
                      : event.status === "ongoing"
                        ? "bg-green-500/90"
                        : event.status === "completed"
                          ? "bg-gray-500/90"
                          : "bg-red-500/90"
                  }
                >
                  {event.status === "scheduled"
                    ? "Agendado"
                    : event.status === "ongoing"
                      ? "Em andamento"
                      : event.status === "completed"
                        ? "Encerrado"
                        : "Cancelado"}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-shadow-sm">
                {event.name}
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
                    {event.start_time} - {event.end_time}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{event.available_spots} vagas disponíveis</span>
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
                <TabsList className="mb-6 w-full justify-start bg-transparent border-b rounded-none p-0 h-auto">
                  <TabsTrigger
                    value="info"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-0 px-4"
                  >
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger
                    value="tickets"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-0 px-4"
                  >
                    Ingressos
                  </TabsTrigger>
                  <TabsTrigger
                    value="policies"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-0 px-4"
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
                                {event.start_time} - {event.end_time}
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
                              <p className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer mt-1">
                                Ver no mapa
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
                                {event.capacity} lugares no total
                              </p>
                              <p className="text-sm text-gray-600">
                                {event.available_spots} vagas disponíveis
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
                                {event.organizer}
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

                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      O que esperar
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Star className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700">
                            Evento com alta classificação
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <ShoppingBag className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700">
                            Souvenirs disponíveis
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700">
                            Adequado para famílias
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tickets tab */}
                <TabsContent value="tickets" className="space-y-6 mt-2">
                  <h2 className="text-2xl font-semibold mb-4">
                    Ingressos Disponíveis
                  </h2>
                  {event.tickets && event.tickets.length > 0 ? (
                    <div className="space-y-4">
                      {event.tickets.map((ticket) => (
                        <Card
                          key={ticket.id}
                          className={`transition-all border-gray-200 hover:border-blue-300 ${
                            selectedTicketId === ticket.id
                              ? "ring-2 ring-blue-500 border-blue-300 shadow-md"
                              : "shadow-sm"
                          }`}
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
                                    <Badge className="ml-2 bg-green-600">
                                      Desconto
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm mt-1">
                                  {ticket.description}
                                </p>

                                {ticket.benefits &&
                                  ticket.benefits.length > 0 && (
                                    <div className="mt-3">
                                      <h4 className="text-sm font-medium text-gray-800">
                                        Inclui:
                                      </h4>
                                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                        {ticket.benefits.map((benefit, idx) => (
                                          <li
                                            key={idx}
                                            className="flex items-start"
                                          >
                                            <span className="text-blue-500 mr-1.5">
                                              ✓
                                            </span>{" "}
                                            {benefit}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                              </div>

                              <div className="flex flex-col items-end">
                                <div className="text-xl font-bold text-gray-900 mb-2">
                                  R$ {ticket.price.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500 mb-3">
                                  {ticket.available_quantity} disponíveis
                                </div>
                                <Button
                                  onClick={() => setSelectedTicketId(ticket.id)}
                                  variant={
                                    selectedTicketId === ticket.id
                                      ? "default"
                                      : "outline"
                                  }
                                  className={
                                    selectedTicketId === ticket.id
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : ""
                                  }
                                >
                                  Selecionar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-5 w-5" />
                      <AlertTitle>Sem ingressos disponíveis</AlertTitle>
                      <AlertDescription>
                        Este evento não tem ingressos disponíveis no momento.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Policies tab */}
                <TabsContent value="policies" className="space-y-6 mt-2">
                  <h2 className="text-2xl font-semibold mb-4">
                    Políticas do Evento
                  </h2>
                  {event.policies ? (
                    <div className="prose max-w-none">
                      <div className="p-6 rounded-lg bg-gray-50 border border-gray-100">
                        <h3 className="text-lg font-medium mb-3">
                          Termos e Condições
                        </h3>
                        <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                          {event.policies}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Alert className="bg-gray-50 border-gray-200">
                      <Info className="h-5 w-5 text-blue-500" />
                      <AlertTitle>Sem informações de políticas</AlertTitle>
                      <AlertDescription>
                        Este evento não possui políticas específicas
                        registradas.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky Sidebar - Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-20">
                {/* Price display with indicator */}
                <div className="flex items-center mb-4">
                  <div className="bg-blue-50 p-2 rounded-full mr-3">
                    <Tag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Preço por pessoa</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedTicketId
                        ? `R$ ${(event.tickets?.find((t) => t.id === selectedTicketId)?.price || 0).toFixed(2)}`
                        : `R$ ${event.price.toFixed(2)}`}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <Separator className="my-4" />

                {event.status === "scheduled" ? (
                  <>
                    <div className="space-y-4 mb-5">
                      {selectedTicketId ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              Tipo de ingresso
                            </span>
                            <span className="font-medium">
                              {event.tickets?.find(
                                (t) => t.id === selectedTicketId
                              )?.name || "Ingresso"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">
                              Quantidade
                            </span>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  setTicketQuantity((prev) =>
                                    Math.max(1, prev - 1)
                                  )
                                }
                                disabled={ticketQuantity <= 1}
                              >
                                -
                              </Button>
                              <span className="w-6 text-center font-medium">
                                {ticketQuantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  setTicketQuantity((prev) =>
                                    Math.min(
                                      event.tickets?.find(
                                        (t) => t.id === selectedTicketId
                                      )?.max_per_order || 4,
                                      prev + 1
                                    )
                                  )
                                }
                                disabled={
                                  ticketQuantity >=
                                  (event.tickets?.find(
                                    (t) => t.id === selectedTicketId
                                  )?.max_per_order || 4)
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Data</span>
                            <span className="font-medium">{formattedDate}</span>
                          </div>

                          <Separator className="my-2" />

                          <div className="flex justify-between">
                            <span className="text-gray-900 font-medium">
                              Total
                            </span>
                            <span className="text-blue-600 font-bold">
                              R${" "}
                              {(
                                (event.tickets?.find(
                                  (t) => t.id === selectedTicketId
                                )?.price || 0) * ticketQuantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="bg-blue-50 rounded-lg p-4 text-center space-y-3">
                          <CalendarCheck className="h-6 w-6 mx-auto text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              Selecione um ingresso
                            </p>
                            <p className="text-sm text-gray-600">
                              Escolha seu ingresso na aba de ingressos
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full mb-3 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
                      disabled={!selectedTicketId}
                    >
                      Reservar agora
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-300"
                        onClick={() => setIsFavorite(!isFavorite)}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 mr-2",
                            isFavorite && "fill-red-500 text-red-500"
                          )}
                        />
                        Salvar
                      </Button>

                      <Button
                        variant="outline"
                        className="flex-1 border-gray-300"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>

                    {/* Prompt for user */}
                    <div className="mt-5 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-gray-600 text-sm text-center">
                        Este evento tem alta procura. Recomendamos reservar o
                        quanto antes.
                      </p>
                    </div>
                  </>
                ) : event.status === "completed" ? (
                  <Alert className="bg-gray-50 border-gray-200">
                    <Info className="h-5 w-5 text-blue-500" />
                    <AlertTitle>Evento encerrado</AlertTitle>
                    <AlertDescription>
                      Este evento já aconteceu e não está mais disponível para
                      reservas.
                    </AlertDescription>
                  </Alert>
                ) : event.status === "cancelled" ? (
                  <Alert className="bg-gray-50 border-gray-200">
                    <Info className="h-5 w-5 text-blue-500" />
                    <AlertTitle>Evento cancelado</AlertTitle>
                    <AlertDescription>
                      Este evento foi cancelado e não está disponível para
                      reservas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-gray-50 border-gray-200">
                    <Info className="h-5 w-5 text-blue-500" />
                    <AlertTitle>Evento em andamento</AlertTitle>
                    <AlertDescription>
                      Este evento está acontecendo agora e pode não estar mais
                      disponível para reservas.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
