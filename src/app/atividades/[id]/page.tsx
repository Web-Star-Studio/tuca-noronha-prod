"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
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
import { useConvexAuth } from "convex/react";
import { cn, formatCurrency } from "@/lib/utils";
import { ActivityBookingForm } from "@/components/bookings";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { WishlistButton } from "@/components/ui/wishlist-button";

// Review components
import { ReviewStats, ReviewsList } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";
import type { Id } from "@/../convex/_generated/dataModel";

export default function ActivityPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { activity, isLoading } = usePublicActivity(params.id);
  
  // Get review stats for this activity
  const { data: reviewStats } = useReviewStats({
    assetId: params.id,
    assetType: 'activity'
  });

  // Handle 404 case
  if (!isLoading && !activity) {
    notFound();
  }

  if (isLoading || !activity) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center">
        <div className="animate-pulse space-y-8">
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

  const shareUrl = `${window.location.origin}/atividades/${params.id}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activity.title,
          text: activity.shortDescription,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Erro ao compartilhar:", error);
      }
    } else {
      // Fallback: copiar URL para clipboard
      navigator.clipboard.writeText(shareUrl);
      alert("Link copiado para a área de transferência!");
    }
  };

  const handleBookingClick = () => {
    if (isAuthenticated) {
      setShowBookingForm(true);
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-[70vh] overflow-hidden">
          <Image
            src={activity.imageUrl || "/images/bg-pattern.png"}
            alt={activity.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />

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
              
              {/* Review Stats in Hero */}
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-yellow-400" />
                <span className="font-medium">
                  {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : activity.rating && typeof activity.rating === 'number' ? activity.rating.toFixed(1) : 'N/A'}
                </span>
                <span className="text-white/80 text-sm">
                  ({reviewStats?.totalReviews || 0} avaliações)
                </span>
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
                    className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-3 px-4 font-medium flex items-center justify-center"
                  >
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger
                    value="itinerary"
                    className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-3 px-4 font-medium flex items-center justify-center"
                  >
                    Itinerário
                  </TabsTrigger>
                  {activity.hasMultipleTickets && (
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
                  {activity.galleryImages && activity.galleryImages.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Galeria de fotos</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {activity.galleryImages.map((image, index) => (
                          <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden"
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
                  )}
                </TabsContent>

                {/* Itinerary tab */}
                <TabsContent value="itinerary" className="space-y-6 mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Itinerário</h2>
                    <div className="space-y-4">
                      {activity.itinerary && activity.itinerary.length > 0 ? (
                        activity.itinerary.map((item, index) => (
                          <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            key={index}
                            className="border-l-4 border-blue-500 pl-4 py-2"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-600">{item.time}</span>
                            </div>
                            <h4 className="font-medium mb-1">{item.title}</h4>
                            <p className="text-gray-600 text-sm">{item.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600">Itinerário detalhado será fornecido no momento da reserva.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tickets tab */}
                {activity.hasMultipleTickets && (
                  <TabsContent value="tickets" className="space-y-6 mt-2">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4">Tipos de ingresso</h2>
                      <div className="space-y-4">
                        {activity.ticketTypes && activity.ticketTypes.length > 0 ? (
                          activity.ticketTypes.map((ticket, index) => (
                            <Card
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                              key={index}
                              className="border-gray-200"
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{ticket.name}</h4>
                                  <span className="font-semibold text-blue-600">
                                    {formatCurrency(ticket.price)}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Disponível: {ticket.available}</span>
                                  <span>Máximo: {ticket.maxPerPerson} por pessoa</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <p className="text-gray-600">Informações sobre ingressos serão fornecidas no momento da reserva.</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* Reviews tab */}
                <TabsContent value="reviews" className="space-y-6 mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Avaliações</h2>
                    
                    {/* Review Stats */}
                    <div className="mb-8">
                      <ReviewStats
                        totalReviews={reviewStats?.totalReviews || 0}
                        averageRating={reviewStats?.averageRating || 0}
                        ratingDistribution={reviewStats?.ratingDistribution || {}}
                        recommendationPercentage={reviewStats?.recommendationPercentage || 0}
                        detailedAverages={reviewStats?.detailedAverages}
                        className="bg-white border border-gray-200 rounded-lg p-6"
                      />
                    </div>

                    {/* Reviews List */}
                    <ReviewsList
                      itemType="activities"
                      itemId={params.id}
                      className="space-y-4"
                    />
                  </div>
                </TabsContent>

                {/* Policies tab */}
                <TabsContent value="policies" className="space-y-6 mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Políticas</h2>
                    
                    {/* Cancellation Policy */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Política de cancelamento</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-yellow-800">
                              {activity.cancelationPolicy?.join(' ') || 
                                "Cancelamento gratuito até 24 horas antes da atividade. Após esse período, será cobrada taxa de 50% do valor total."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Requisitos</h3>
                      <div className="space-y-2">
                        {activity.requirements && activity.requirements.length > 0 ? (
                          activity.requirements.map((req, index) => (
                            <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                              key={index}
                              className="flex items-start gap-2"
                            >
                              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{req}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600 text-sm">
                            Não há requisitos específicos para esta atividade.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Safety Guidelines */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Diretrizes de segurança</h3>
                      <div className="space-y-2">
                        {activity.safetyGuidelines && activity.safetyGuidelines.length > 0 ? (
                          activity.safetyGuidelines.map((guideline, index) => (
                            <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                              key={index}
                              className="flex items-start gap-2"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{guideline}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600 text-sm">
                            Diretrizes de segurança serão fornecidas no momento da atividade.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Pricing card */}
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(activity.price)}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">por pessoa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <WishlistButton
                          itemId={params.id}
                          itemType="activities"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                          className="h-10 w-10 p-0"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleBookingClick}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Reservar agora
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick info */}
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
                        <span>Avaliação: {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : activity.rating && typeof activity.rating === 'number' ? activity.rating.toFixed(1) : 'N/A'}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Reservar atividade</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBookingForm(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <ActivityBookingForm
                activityId={params.id as Id<"activities">}
                activity={activity}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}