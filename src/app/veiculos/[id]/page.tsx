"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Star, Calendar, Fuel, Users } from "lucide-react";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { VehicleBookingForm } from "@/components/bookings/VehicleBookingForm";
import { cn } from "@/lib/utils";
import { parseMediaEntry } from "@/lib/media";
import { SmartMedia } from "@/components/ui/smart-media";

import { HelpSection } from "@/components/contact";

// Review components
import { ReviewStats, ReviewsList } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";
import { getCategoryLabel } from "@/lib/constants/vehicleCategories";

export default function VehiclePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  
  // Get WhatsApp link generator
  // WhatsApp link removido
  
  // Fetch vehicle data from Convex
  const vehicle = useQuery(api.domains.vehicles.queries.getVehicle, {
    id: params.id as Id<"vehicles">
  });

  // Get review stats for this vehicle
  const { data: reviewStats } = useReviewStats({
    assetId: params.id,
    assetType: 'vehicle'
  });

  // Handle 404 case
  if (vehicle === undefined) {
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

  if (vehicle === null) {
    notFound();
  }

  const galleryEntries = (vehicle?.galleryImages ?? []).map(parseMediaEntry);
  const heroBaseEntry = parseMediaEntry(vehicle?.imageUrl ?? "");
  const heroGalleryEntry = galleryEntries.find(
    (entry) => entry.url === heroBaseEntry.url,
  );
  const heroEntry = heroGalleryEntry ?? heroBaseEntry;
  const hasHeroMedia = Boolean(heroEntry.url && heroEntry.url.trim() !== "");

  return (
    <>
      <main className="pb-20">
        {/* Hero Image Section */}
        <div className="relative w-full h-[70vh] overflow-hidden">
          {hasHeroMedia ? (
            <SmartMedia
              entry={heroEntry}
              alt={vehicle.name}
              className="h-full w-full object-cover brightness-[0.85]"
              imageProps={{ fill: true, priority: true }}
              videoProps={{
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true,
                controls: false,
              }}
            />
          ) : (
            <Image
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
              alt={vehicle.name}
              fill
              className="object-cover brightness-[0.85]"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white container mx-auto">
            <div className="max-w-3xl">
              <Link
                href="/veiculos"
                className={cn(
                  "inline-flex absolute -top-12 left-10 items-center text-sm gap-1 transition-colors font-medium",
                  "text-white hover:text-white/90 hover:underline hover:underline-offset-2"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar para Veículos</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm"
                >
                  {getCategoryLabel(vehicle.category)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm"
                >
                  {vehicle.transmission}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-shadow-sm">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-yellow-400" />
                <span className="font-medium">
                  {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : '4.8'}
                </span>
                <span className="text-white/80 text-sm">
                  ({reviewStats?.totalReviews || 0} avaliações)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Ano {vehicle.year}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{vehicle.seats} lugares</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Fuel className="h-4 w-4" />
                  <span>{vehicle.fuelType}</span>
                </div>
                <div className="ml-auto">
                  <WishlistButton
                    itemType="vehicle"
                    itemId={vehicle._id}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    showText={false}
                  />
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
                    value="features"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-3 px-4 flex items-center justify-center"
                  >
                    Características
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
                      Sobre este veículo
                    </h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {vehicle.description || `O ${vehicle.brand} ${vehicle.model} é um veículo ${vehicle.category.toLowerCase()} ideal para explorar a ilha de Fernando de Noronha. Com seu motor ${vehicle.fuelType.toLowerCase()} e transmissão ${vehicle.transmission.toLowerCase()}, oferece excelente desempenho e economia de combustível.`}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Especificações técnicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Marca</span>
                        <span>{vehicle.brand}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Modelo</span>
                        <span>{vehicle.model}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Ano</span>
                        <span>{vehicle.year}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Categoria</span>
                        <span>{getCategoryLabel(vehicle.category)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Cor</span>
                        <span>{vehicle.color}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Lugares</span>
                        <span>{vehicle.seats}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Combustível</span>
                        <span>{vehicle.fuelType}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">Transmissão</span>
                        <span>{vehicle.transmission}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Features tab */}
                <TabsContent value="features" className="space-y-10 mt-2">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Características e comodidades</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      {vehicle.features.map((feature) => (
                        <div key={`feature-${feature}`} className="flex items-center gap-3 text-gray-700">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Photos tab */}
                <TabsContent value="photos" className="space-y-10 mt-2">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Galeria</h3>
                    {galleryEntries.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {galleryEntries.map((mediaEntry, index) => (
                          <div
                            key={`${vehicle._id}-gallery-${index}`}
                            className="relative aspect-video overflow-hidden rounded-lg"
                          >
                            <SmartMedia
                              entry={mediaEntry}
                              alt={`${vehicle.brand} ${vehicle.model} - Mídia ${index + 1}`}
                              className="h-full w-full object-cover"
                              imageProps={{ fill: true }}
                              videoProps={{ controls: true, preload: "metadata" }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="relative aspect-video overflow-hidden rounded-lg">
                          <Image
                            src={
                              vehicle.imageUrl ||
                              "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
                            }
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-lg">
                          <Image
                            src="https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
                            alt="Interior do veículo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Reviews tab */}
                <TabsContent value="reviews" className="space-y-8 mt-2">
                  <h2 className="text-2xl font-semibold mb-4">Avaliações</h2>
                  
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
                  
                  <ReviewsList
                    itemType="vehicle"
                    itemId={params.id}
                    showCreateForm={true}
                    className="space-y-4"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {isAuthenticated ? (
                  <VehicleBookingForm 
                    vehicleId={vehicle._id} 
                    estimatedPricePerDay={vehicle.estimatedPricePerDay ?? 0} 
                    className="shadow-sm"
                  />
                ) : (
                  <Card className="shadow-sm">
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
                  customMessage={`Olá! Gostaria de tirar dúvidas sobre o aluguel do veículo ${vehicle.brand} ${vehicle.model}. Vocês podem me ajudar?`}
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
