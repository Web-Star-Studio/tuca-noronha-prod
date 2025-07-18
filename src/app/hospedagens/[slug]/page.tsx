"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bed,
  Bath,
  Users,
  Wifi,
  Car,
  Coffee,
  Waves,
  Star,
  Heart,
  Share2,
  ShoppingBag,
  MapPin,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WishlistButton } from "@/components/ui/wishlist-button";

// Review components
import { ReviewStats, ReviewsList } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";

// Mock data para hospedagem (em um cenário real, viria de uma API)
const getMockAccommodation = (slug: string) => {
  const accommodations = {
    "pousada-maravilha": {
      id: "acc-001",
      name: "Pousada Maravilha",
      slug: "pousada-maravilha",
      type: "Pousada",
      description: "Localizada em uma das praias mais belas de Fernando de Noronha, a Pousada Maravilha oferece uma experiência única de hospedagem com vista privilegiada para o mar. Nossos bangalôs foram projetados para proporcionar máximo conforto e privacidade, permitindo que você desfrute da natureza exuberante da ilha.",
      shortDescription: "Bangalôs exclusivos com vista para o mar",
      mainImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop",
      galleryImages: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2032&auto=format&fit=crop",
      ],
      pricePerNight: 850,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      location: "Praia da Conceição",
      address: "Estrada da Conceição, s/n - Fernando de Noronha, PE",
      amenities: [
        "Wi-Fi gratuito",
        "Ar-condicionado",
        "Vista para o mar",
        "Café da manhã incluído",
        "Estacionamento gratuito",
        "Piscina",
        "Restaurante",
        "Bar",
        "Serviço de quarto",
        "Transfer gratuito",
      ],
      highlights: [
        "Vista panorâmica do mar",
        "Bangalôs privativos",
        "Localização privilegiada",
        "Café da manhã gourmet",
        "Atendimento personalizado",
        "Piscina com deck",
      ],
      policies: {
        checkIn: "15:00",
        checkOut: "12:00",
        cancellation: "Cancelamento gratuito até 48 horas antes da chegada",
        children: "Crianças de todas as idades são bem-vindas",
        pets: "Animais de estimação não são permitidos",
        smoking: "Proibido fumar em todas as áreas",
      },
      rating: 4.8,
      totalReviews: 156,
    },
    "hotel-atlantis": {
      id: "acc-002", 
      name: "Hotel Atlântis",
      slug: "hotel-atlantis",
      type: "Hotel",
      description: "O Hotel Atlântis é uma opção confortável e acessível para sua estadia em Fernando de Noronha. Localizado no centro de Vila dos Remédios, oferece fácil acesso a restaurantes, lojas e pontos turísticos. Nossos quartos são equipados com todas as comodidades necessárias para uma estadia agradável.",
      shortDescription: "Hotel confortável no centro de Vila dos Remédios",
      mainImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop",
      galleryImages: [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2032&auto=format&fit=crop",
      ],
      pricePerNight: 450,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      location: "Vila dos Remédios",
      address: "Rua Nice Cordeiro, 123 - Vila dos Remédios, Fernando de Noronha, PE",
      amenities: [
        "Wi-Fi gratuito",
        "Ar-condicionado",
        "Café da manhã incluído",
        "Estacionamento",
        "Piscina",
        "Recepção 24h",
      ],
      highlights: [
        "Localização central",
        "Ótimo custo-benefício",
        "Perto de restaurantes",
        "Acesso fácil às praias",
      ],
      policies: {
        checkIn: "14:00",
        checkOut: "12:00",
        cancellation: "Cancelamento gratuito até 24 horas antes da chegada",
        children: "Crianças de todas as idades são bem-vindas",
        pets: "Animais de estimação não são permitidos",
        smoking: "Área para fumantes disponível",
      },
      rating: 4.2,
      totalReviews: 89,
    },
  };

  return accommodations[slug as keyof typeof accommodations] || null;
};

export default function AccommodationDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const accommodation = getMockAccommodation(params.slug);

  // Get review stats for this accommodation
  const { data: reviewStats } = useReviewStats({
    assetId: accommodation?.id || '',
    assetType: 'accommodation'
  });

  if (!accommodation) {
    notFound();
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/hospedagens/${params.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: accommodation.name,
          text: accommodation.shortDescription,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Erro ao compartilhar:", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-[70vh] overflow-hidden">
          <Image
            src={accommodation.mainImage}
            alt={accommodation.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white container mx-auto">
            <div className="max-w-3xl">
              <Link
                href="/hospedagens"
                className={cn(
                  "inline-flex absolute -top-12 left-10 items-center text-sm gap-1 transition-colors font-medium",
                  "text-white hover:text-white/90 hover:underline hover:underline-offset-2"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar para Hospedagens</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm"
                >
                  {accommodation.type}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/40 text-white"
                >
                  {accommodation.location}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-shadow-sm">
                {accommodation.name}
              </h1>
              
              {/* Review Stats in Hero */}
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-yellow-400" />
                <span className="font-medium">
                  {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : accommodation.rating.toFixed(1)}
                </span>
                <span className="text-white/80 text-sm">
                  ({reviewStats?.totalReviews || accommodation.totalReviews} avaliações)
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4" />
                  <span>{accommodation.bedrooms} quartos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4" />
                  <span>{accommodation.bathrooms} banheiros</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>Até {accommodation.maxGuests} hóspedes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{accommodation.location}</span>
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
                    value="amenities"
                    className="hover:cursor-pointer rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 pb-3 pt-3 px-4 font-medium flex items-center justify-center"
                  >
                    Comodidades
                  </TabsTrigger>
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
                      Sobre a hospedagem
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {accommodation.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Destaques</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accommodation.highlights.map((highlight, index) => (
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

                  {/* Gallery */}
                  {accommodation.galleryImages && accommodation.galleryImages.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Galeria de fotos</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {accommodation.galleryImages.map((image, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden"
                          >
                            <Image
                              src={image}
                              alt={`${accommodation.name} - Imagem ${index + 1}`}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Amenities tab */}
                <TabsContent value="amenities" className="space-y-6 mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Comodidades</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accommodation.amenities.map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
                      itemId={accommodation.id}
                      itemType="accommodations"
                      className="space-y-4"
                    />
                  </div>
                </TabsContent>

                {/* Policies tab */}
                <TabsContent value="policies" className="space-y-6 mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Políticas da hospedagem</h2>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Check-in</h3>
                          <p className="text-gray-700">{accommodation.policies.checkIn}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-2">Check-out</h3>
                          <p className="text-gray-700">{accommodation.policies.checkOut}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Política de cancelamento</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">
                              {accommodation.policies.cancellation}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Crianças</h3>
                          <p className="text-gray-700">{accommodation.policies.children}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-2">Animais de estimação</h3>
                          <p className="text-gray-700">{accommodation.policies.pets}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-2">Fumar</h3>
                          <p className="text-gray-700">{accommodation.policies.smoking}</p>
                        </div>
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
                          {formatCurrency(accommodation.pricePerNight)}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">por noite</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <WishlistButton
                          itemId={accommodation.id}
                          itemType="accommodations"
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
                      onClick={() => setShowBookingForm(true)}
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
                        <Bed className="h-4 w-4 text-gray-500" />
                        <span>{accommodation.bedrooms} quartos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="h-4 w-4 text-gray-500" />
                        <span>{accommodation.bathrooms} banheiros</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>Até {accommodation.maxGuests} hóspedes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{accommodation.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>
                          Avaliação: {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : accommodation.rating.toFixed(1)}/5
                        </span>
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
                <h3 className="text-xl font-semibold">Reservar hospedagem</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBookingForm(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Para fazer sua reserva, entre em contato conosco através do WhatsApp ou telefone.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Informações da reserva:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Hospedagem:</strong> {accommodation.name}</p>
                    <p><strong>Preço:</strong> {formatCurrency(accommodation.pricePerNight)}/noite</p>
                    <p><strong>Capacidade:</strong> {accommodation.maxGuests} hóspedes</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBookingForm(false)}
                  className="w-full"
                  variant="outline"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}