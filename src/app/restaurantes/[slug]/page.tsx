"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { MapPin, Clock, ArrowLeft, Star, UtensilsCrossed } from "lucide-react";
import { useRestaurantBySlug, type Restaurant as RestaurantServiceType } from "@/lib/services/restaurantService";
import { useConvexAuth } from "convex/react";
import { cn } from "@/lib/utils";

import type { Id } from "@/../convex/_generated/dataModel";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantReservationForm } from "@/components/bookings/RestaurantReservationForm";
import { ReviewStats } from "@/components/reviews/ReviewStats";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { useReviewStats } from "@/lib/hooks/useReviews";
import { HelpSection } from "@/components/contact/HelpSection";


export default function RestaurantPage(props: { params: Promise<{ slug:string }> }) {
  const params = use(props.params);
  const { restaurant, isLoading } = useRestaurantBySlug(params.slug);
  
  // Handle 404 case
  if (!isLoading && !restaurant) {
    notFound();
  }

  if (isLoading || !restaurant) {
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

  // O componente principal é renderizado aqui para garantir que `restaurant` não seja nulo
  return <RestaurantDetails restaurant={restaurant} />;
}

// Componente extraído para usar hooks após a verificação de nulidade
function RestaurantDetails({ restaurant }: { restaurant: RestaurantServiceType }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  // Get real review stats
  const { data: reviewStats } = useReviewStats({
    assetType: "restaurant", 
    assetId: restaurant._id!,
  });

  // Format operation hours for display
  const getOperationHoursForToday = () => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = daysOfWeek[new Date().getDay()];
    return restaurant.hours[today]?.join(" e ") || "Fechado hoje";
  };

  return (
    <>
      <main className="pb-20">
        {/* Hero Image Section */}
        <div className="relative w-full h-[70vh] overflow-hidden">
          <Image
            src={restaurant.mainImage}
            alt={restaurant.name}
            fill
            className="object-cover brightness-[0.85]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white container mx-auto">
            <div className="max-w-3xl">
              <Link
                href="/restaurantes"
                className={cn(
                  "inline-flex absolute -top-12 left-10 items-center text-sm gap-1 transition-colors font-medium",
                  "text-white hover:text-white/90 hover:underline hover:underline-offset-2"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar para Restaurantes</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm"
                >
                  {restaurant.cuisine[0]}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm"
                >
                  {restaurant.priceRange}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-shadow-sm">
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-yellow-400" />
                <span className="font-medium">
                  {reviewStats?.averageRating && reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : restaurant.rating.overall.toFixed(1)}
                </span>
                <span className="text-white/80 text-sm">
                  ({reviewStats?.totalReviews && reviewStats.totalReviews > 0 ? reviewStats.totalReviews : restaurant.rating.totalReviews} avaliações)
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.address.neighborhood}, {restaurant.address.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{getOperationHoursForToday()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>{restaurant.diningStyle}</span>
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
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-3 px-4 flex items-center justify-center"
                  >
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger
                    value="photos"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-3 px-4 flex items-center justify-center"
                  >
                    Fotos
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-3 px-4 flex items-center justify-center"
                  >
                    Avaliações ({reviewStats?.totalReviews || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Info tab */}
                <TabsContent value="info" className="space-y-10 mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Sobre o restaurante
                    </h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {restaurant.description_long}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Especialidades culinárias</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {restaurant.cuisine.map((type, index) => (
                        <Badge key={`${restaurant.id}-cuisine-${index}`} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 px-3 py-1">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Comodidades e recursos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      {restaurant.features.map((feature, index) => (
                        <div key={`${restaurant.id}-feature-${index}`} className="flex items-center gap-3 text-gray-700">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Detalhes adicionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Chef Executivo</h4>
                        <p className="text-gray-600">{restaurant.executiveChef}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Código de vestimenta</h4>
                        <p className="text-gray-600">{restaurant.dressCode}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Formas de pagamento</h4>
                        <p className="text-gray-600">{restaurant.paymentOptions.join(", ")}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Estacionamento</h4>
                        <p className="text-gray-600">{restaurant.parkingDetails}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Horário de funcionamento</h3>
                    <div className="space-y-2">
                      {Object.entries(restaurant.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                          <span className="font-medium">{day}</span>
                          <span className="text-gray-600">
                            {hours.length > 0 ? hours.join(" e ") : "Fechado"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="photos">
                  <h2 className="text-2xl font-semibold mb-4">Fotos do local</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {restaurant.galleryImages.map((src, index) => (
                      <div key={`${restaurant.id}-gallery-${index}`} className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={src}
                          alt={`Galeria ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="space-y-8">
                  <h2 className="text-2xl font-semibold mb-4">Avaliações</h2>
                  
                  {reviewStats && (
                    <ReviewStats
                      totalReviews={reviewStats.totalReviews}
                      averageRating={reviewStats.averageRating}
                      ratingDistribution={reviewStats.ratingDistribution}
                      recommendationPercentage={reviewStats.recommendationPercentage}
                      detailedAverages={reviewStats.detailedAverages}
                    />
                  )}
                  
                  <ReviewsList
                    itemType="restaurant"
                    itemId={restaurant._id!}
                    showCreateForm={true}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {isAuthenticated ? (
                  <RestaurantReservationForm
                    restaurantId={restaurant._id as Id<"restaurants">}
                    restaurant={{
                      name: restaurant.name,
                      address: restaurant.address,
                      maximumPartySize: restaurant.maximumPartySize,
                      acceptsReservations: restaurant.acceptsReservations,
                      price: restaurant.price,
                      acceptsOnlinePayment: restaurant.acceptsOnlinePayment,
                      requiresUpfrontPayment: restaurant.requiresUpfrontPayment,
                    }}
                  />
                ) : (
                  <Card className="shadow-lg">
                    <CardContent className="p-6">
                      <Button
                        onClick={() => router.push("/sign-in")}
                        className="w-full"
                      >
                        Fazer login para reservar
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <HelpSection 
                  className="mt-4"
                  customMessage={`Olá! Gostaria de tirar dúvidas sobre o restaurante ${restaurant.name}. Vocês podem me ajudar?`}
                  showDropdown={false}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      
    </>
  );
}
