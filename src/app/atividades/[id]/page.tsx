"use client";

import { useEffect, useState } from "react";
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
import { Activity } from "@/lib/store/activitiesStore";
import { usePublicActivity } from "@/lib/services/activityService";
import { cn } from "@/lib/utils";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ActivityPage({ params }: { params: { id: string } }) {
  const { activity, isLoading } = usePublicActivity(params.id);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Lidar com caso 404
  if (!isLoading && !activity) {
    notFound();
  }

  if (isLoading || !activity) {
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
                <TabsList className="mb-6 w-full justify-start bg-transparent border-b rounded-none p-0 h-auto">
                  <TabsTrigger
                    value="info"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-0 px-4"
                  >
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger
                    value="itinerary"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-blue-600 pb-3 pt-0 px-4"
                  >
                    Itinerário
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
                      <span className="bg-gradient-to-r from-blue-600 to-blue-400 h-8 w-1.5 rounded-full mr-3"></span>
                      Itinerário
                    </h2>
                    <div className="relative py-2">
                      {/* Linha de fundo decorativa */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-100 rounded-full"></div>
                      
                      <div className="space-y-8">
                        {activity.itineraries.map((step, index) => (
                          <div 
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
                                <div className="h-1.5 w-10 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full mr-2"></div>
                                <h3 className="font-medium text-blue-700">Etapa {index + 1}</h3>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{step}</p>
                            </div>
                            
                            {/* Linha conectora decorativa */}
                            {index < activity.itineraries.length - 1 && (
                              <div className="absolute left-6 top-12 h-8 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200"></div>
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
                        <div key={index} className="flex items-start gap-3">
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
              <div className="sticky top-24">
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Reservar agora</h3>
                        <div className="text-2xl font-bold text-blue-600">
                          R$ {activity.price.toFixed(2)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Preço por pessoa • {activity.duration}
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantidade
                          </label>
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="px-3 py-2 text-gray-500 hover:bg-gray-100"
                              disabled={quantity <= 1}
                            >
                              -
                            </button>
                            <div className="flex-1 text-center">{quantity}</div>
                            <button
                              onClick={() => setQuantity(Math.min(activity.maxParticipants, quantity + 1))}
                              className="px-3 py-2 text-gray-500 hover:bg-gray-100"
                              disabled={quantity >= activity.maxParticipants}
                            >
                              +
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo: {activity.maxParticipants} pessoas
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex justify-between mb-2">
                            <span>Subtotal</span>
                            <span>R$ {(activity.price * quantity).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>R$ {totalPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6">
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Reservar agora
                        </Button>

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            className="flex-1 mr-2"
                            onClick={() => setIsFavorite(!isFavorite)}
                          >
                            <Heart
                              className={cn(
                                "h-5 w-5 mr-1",
                                isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                              )}
                            />
                            Favorito
                          </Button>
                          <Button variant="outline" className="flex-1 ml-2">
                            <Share2 className="h-5 w-5 mr-1" />
                            Compartilhar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50">
                      <h4 className="font-medium mb-3">Informações rápidas</h4>
                      <div className="space-y-2 text-sm">
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
                      </div>
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