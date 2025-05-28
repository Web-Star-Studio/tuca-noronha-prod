"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  Users,
  ArrowLeft,
  Info,
  Heart,
  Share2,
  Star,
  ShoppingBag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Compass,
  Gauge,
} from "lucide-react";
import { usePublicActivity } from "@/lib/services/activityService";
import { cn, formatCurrency } from "@/lib/utils";
import { ActivityBookingForm } from "@/components/bookings";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function ActivityPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { activity, isLoading } = usePublicActivity(params.id);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Initialize ticket quantities when activity is loaded
  useEffect(() => {
    if (activity?.tickets && activity.tickets.length > 0) {
      const initialQuantities: Record<string, number> = {};
      activity.tickets.forEach(ticket => {
        initialQuantities[ticket.id] = 1;
      });
      setTicketQuantities(initialQuantities);
    } else {
      // Default ticket (single ticket case)
      setTicketQuantities({ "default": 1 });
    }
  }, [activity?.tickets]);

  const updateTicketQuantity = (ticketId: string, amount: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [ticketId]: Math.max(1, (prev[ticketId] || 1) + amount)
    }));
  };

  // Lidar com caso 404
  if (!isLoading && !activity) {
    notFound();
  }

  if (isLoading || !activity) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="animate-pulse space-y-8">
          {/* Loading skeleton */}
          <div className="h-10 w-40 bg-gray-200 rounded" />
          <div className="h-96 w-full bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-gray-200 rounded" />
            <div className="h-6 w-1/2 bg-gray-200 rounded" />
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Calcular preço total
  const totalPrice = activity.price * quantity;

  return (
    <>
      <main className="pb-20">
        {/* Hero Image Section */}
        <div className="relative w-full h-[70vh] overflow-hidden">
          <Image
            src={activity.imageUrl}
            alt={activity.title}
            fill
            className="object-cover brightness-[0.85]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white container mx-auto">
            <div className="max-w-3xl">
              <Link
                href="/atividades"
                className={cn(
                  "inline-flex absolute -top-12 left-10 items-center text-sm gap-1 transition-colors font-medium",
                  "text-white hover:text-white/90 hover:underline hover:underline-offset-2"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar para Atividades</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm"
                >
                  {activity.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/40 text-white"
                >
                  {activity.difficulty}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-shadow-sm">
                {activity.title}
              </h1>
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-yellow-400" />
                <span className="font-medium">{activity.rating.toFixed(1)}</span>
                <span className="text-white/80 text-sm">(124 avaliações)</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{activity.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>Até {activity.maxParticipants} pessoas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" />
                  <span>Dificuldade: {activity.difficulty}</span>
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
                    value="itinerary"
                    className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-0 px-4 font-medium"
                  >
                    Itinerário
                  </TabsTrigger>
                  {activity.hasMultipleTickets && (
                    <TabsTrigger
                      value="tickets"
                      className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-0 px-4 font-medium"
                    >
                      Ingressos
                    </TabsTrigger>
                  )}
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
                      Sobre a atividade
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {activity.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Destaques</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activity.highlights.map((highlight, index) => (
                        <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                          className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg"
                        >
                          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Includes */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">O que está incluído</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activity.includes.map((item, index) => (
                        <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Excludes */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">O que não está incluído</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activity.excludes.map((item, index) => (
                        <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Informações adicionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activity.additionalInfo.map((info, index) => (
                        <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                          <span>{info}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gallery */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Galeria</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activity.galleryImages.map((image, index) => (
                        <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                          className="relative aspect-video rounded-lg overflow-hidden"
                        >
                          <Image
                            src={image}
                            alt={`${activity.title} - Imagem ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Itinerary tab */}
                <TabsContent value="itinerary" className="space-y-8 mt-2">
                  <div>
                    <h2 className="text-2xl font-serif font-semibold mb-6 text-gray-800 flex items-center">
                      <span className="bg-gradient-to-r from-blue-600 to-blue-400 h-8 w-1.5 rounded-full mr-3" />
                      Itinerário
                    </h2>
                    <div className="relative py-2">
                      {/* Linha de fundo decorativa */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-100 rounded-full" />
                      
                      <div className="space-y-8">
                        {activity.itineraries.map((step, index) => (
                          <div 
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            key={index} 
                            className="relative pl-16 group transition-all duration-300 hover:translate-x-1"
                          >
                            {/* Círculo com número */}
                            <div className="absolute left-0 top-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-200 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
                              <span className="text-white font-bold">{index + 1}</span>
                            </div>
                            
                            {/* Conteúdo */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                              <div className="flex items-center mb-2">
                                <div className="h-1.5 w-10 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full mr-2" />
                                <h3 className="font-medium text-blue-700">Etapa {index + 1}</h3>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{step}</p>
                            </div>
                            
                            {/* Linha conectora decorativa */}
                            {index < activity.itineraries.length - 1 && (
                              <div className="absolute left-6 top-12 h-8 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Informação adicional */}
                    <div className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center text-blue-800 mb-2">
                        <Info className="h-5 w-5 mr-2" />
                        <h3 className="font-medium">Informação importante</h3>
                      </div>
                      <p className="text-blue-700 text-sm">O itinerário pode sofrer alterações dependendo das condições climáticas e da maré. Nosso guia sempre priorizará sua segurança e conforto.</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Tickets tab */}
                {activity.hasMultipleTickets && (
                  <TabsContent value="tickets" className="space-y-6 mt-2">
                    <h2 className="text-2xl font-semibold mb-4">
                      Ingressos Disponíveis
                    </h2>
                    
                    <div className="space-y-4">
                      {/* Multiple tickets case */}
                      {activity.tickets && activity.tickets.length > 0 ? (
                        activity.tickets.map((ticket) => (
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
                        <p className="text-gray-600">Nenhum ingresso disponível no momento.</p>
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* Policies tab */}
                <TabsContent value="policies" className="space-y-8 mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Política de cancelamento</h2>
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <AlertTitle className="text-amber-800 font-medium">Importante</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Leia atentamente nossa política de cancelamento antes de reservar.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="mt-6 space-y-4">
                      {activity.cancelationPolicy.map((policy, index) => (
                        <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                          className="flex items-start gap-3"
                        >
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                          <p className="text-gray-700">{policy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Activity Booking Form */}
                <ActivityBookingForm
                  activityId={params.id as any}
                  activity={{
                    title: activity.title,
                    price: activity.price,
                    minParticipants: activity.minParticipants,
                    maxParticipants: activity.maxParticipants,
                    hasMultipleTickets: activity.hasMultipleTickets,
                  }}
                  onBookingSuccess={(booking) => {
                    // Redirect to confirmation page
                    window.location.href = `/test-bookings/confirmation?code=${booking.confirmationCode}&type=activity`;
                  }}
                />

                {/* Quick Info Card */}
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-4">Informações rápidas</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Duração: {activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>Mínimo: {activity.minParticipants} pessoas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-gray-500" />
                        <span>Categoria: {activity.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-gray-500" />
                        <span>Dificuldade: {activity.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Avaliação: {activity.rating.toFixed(1)}/5</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsFavorite(!isFavorite)}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 mr-2",
                            isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                          )}
                        />
                        Favorito
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}