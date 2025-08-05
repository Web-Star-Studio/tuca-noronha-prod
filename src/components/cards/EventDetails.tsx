"use client";

import { useState } from "react";
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
  MessageCircle,
} from "lucide-react";
import { formatDate, cn, formatCurrency } from "@/lib/utils";
import type { Event } from "@/lib/services/eventService";
import { EventBookingForm } from "@/components/bookings";
import { useWhatsAppLink } from "@/lib/hooks/useSystemSettings";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Review components
import { ReviewStats, ReviewsList } from "@/components/reviews";
import { HelpSection } from "../contact/HelpSection";

interface EventDetailsProps {
  event: Event;
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    recommendationPercentage: number;
    detailedAverages?: any;
  } | null;
}

export default function EventDetails({ event, reviewStats }: EventDetailsProps) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  // selectedTicketId removido (não utilizado)
  const { generateWhatsAppLink } = useWhatsAppLink();

  // Format date for display
  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate);

  return (
    <main className="pb-20">
      {/* Hero Image Section */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        {event.imageUrl && event.imageUrl.trim() !== '' ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className={`object-cover brightness-[0.85] transition-opacity duration-700 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            priority
            onLoad={() => setIsImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <Calendar className="h-24 w-24 text-gray-500" />
          </div>
        )}
        {!isImageLoaded && event.imageUrl && event.imageUrl.trim() !== '' && (
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

            {/* Review Stats in Hero */}
            <div className="flex items-center gap-1 text-yellow-400 mb-4">
              <Star className="h-5 w-5 fill-yellow-400" />
              <span className="font-medium">
                {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : '4.8'}
              </span>
              <span className="text-white/80 text-sm">
                ({reviewStats?.totalReviews || 0} avaliações)
              </span>
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
                  className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-3 px-4 font-medium flex items-center justify-center"
                >
                  Detalhes
                </TabsTrigger>
                {event.symplaUrl && (
                  <TabsTrigger
                    value="tickets"
                    className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-3 px-4 font-medium flex items-center justify-center"
                  >
                    Ingressos
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="reviews"
                  className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-3 px-4 font-medium flex items-center justify-center"
                >
                  Avaliações
                </TabsTrigger>
                <TabsTrigger
                  value="policies"
                  className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-3 px-4 font-medium flex items-center justify-center"
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
                  {event.symplaUrl ? (
                    <div
                      className="text-gray-700 leading-relaxed prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>

                {event.additionalInfo && event.additionalInfo.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Informações Adicionais
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                      <div className="space-y-3">
                        {event.additionalInfo.map((info, idx) => (
                          <div key={idx} className="flex items-start">
                            <div className="bg-blue-100 p-1.5 rounded-full mt-0.5 mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-gray-700">{info}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

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
                  Comprar Ingressos
                </h2>

                {event.symplaUrl ? (
                  <div className="p-4 bg-blue-50/80 rounded-lg mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-blue-800 font-medium">Comprar Ingressos</h3>
                      <div className="text-xs text-gray-500 flex items-center">
                        via
                        <Image
                          src="https://www.sympla.com.br/images/public/logo-sympla-new-blue@3x.png"
                          alt="Sympla"
                          className="ml-1 h-4"
                          width={50}
                          height={16}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Os ingressos para este evento são vendidos através da plataforma Sympla.
                    </p>
                    <a
                      href={event.symplaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Comprar Ingressos
                    </a>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                    Não há ingressos disponíveis para este evento no momento.
                  </div>
                )}
              </TabsContent>

              {/* Reviews tab */}
              <TabsContent value="reviews" className="space-y-6 mt-2">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Avaliações</h2>

                  {/* Review Stats */}
                  <div className="mb-8">
                    {reviewStats && (
                      <ReviewStats
                        totalReviews={reviewStats.totalReviews}
                        averageRating={reviewStats.averageRating}
                        ratingDistribution={reviewStats.ratingDistribution}
                        recommendationPercentage={reviewStats.recommendationPercentage}
                        detailedAverages={reviewStats.detailedAverages}
                        className="bg-white border border-gray-200 rounded-lg p-6"
                      />
                    )}
                  </div>

                  {/* Reviews List */}
                  <ReviewsList
                    itemId={event.id}
                    itemType="events"
                    className="space-y-4"
                  />
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
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
            {/* Event Booking Form - Only show if no Sympla URL */}
            {!event.symplaUrl && (
              isAuthenticated ? (
                <EventBookingForm
                  eventId={event.id as any}
                  event={{
                    title: event.title,
                    date: event.date,
                    time: event.time,
                    location: event.location,
                    price: event.price,
                    hasMultipleTickets: event.hasMultipleTickets,
                    acceptsOnlinePayment: event.acceptsOnlinePayment,
                    requiresUpfrontPayment: event.requiresUpfrontPayment,
                  }}
                  onBookingSuccess={(booking) => {
                    // Redirect to booking details page using booking ID
                    window.location.href = `/reservas/${booking.bookingId}`;
                  }}
                />
              ) : (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <Button
                      onClick={() => router.push("/sign-in")}
                      className="w-full"
                    >
                      Fazer login para reservar
                    </Button>
                  </CardContent>
                </Card>
              )
            )}

            <HelpSection
              className="mt-4"
              customMessage={`Olá! Gostaria de tirar dúvidas sobre o evento ${event.title}. Vocês podem me ajudar?`}
              showDropdown={false}
            />

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
                        className="object-cover hover:scale-105 transition-transform duration-300"
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