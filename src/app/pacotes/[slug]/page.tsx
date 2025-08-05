"use client";

import { useEffect, useState, use } from "react";
import { ChevronLeft, Users, Star, Heart, Share2, Clock, Check, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
// Tipo removido pois não está sendo utilizado
// import type { PackageWithDetails } from "../../../../convex/domains/packages/types";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PackageDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const { userId } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);

  // Buscar dados do pacote
  const packageData = useQuery(api.packages.getPackageBySlug, { 
    slug: params.slug 
  });

  // Verificar se está nos favoritos
  const isInWishlist = useQuery(
    api.wishlist.isInWishlist,
    userId && packageData ? {
      itemType: "package",
      itemId: packageData._id,
    } : undefined
  );

  // Verificar se está na comparação
  const isInComparison = useQuery(
    api.packageComparison.isInComparison,
    userId && packageData ? {
      packageId: packageData._id as any,
    } : undefined
  );

  // Buscar estatísticas de avaliações
  const reviewStats = useQuery(
    api.reviews.getItemReviewStats,
    packageData ? {
      itemType: "package",
      itemId: packageData._id,
    } : undefined
  );

  // Buscar avaliações
  const reviews = useQuery(
    api.reviews.getItemReviews,
    packageData ? {
      itemType: "package",
      itemId: packageData._id,
      limit: 5,
    } : undefined
  );

  // Mutations
  const addToWishlist = useMutation(api.wishlist.addToWishlist);
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist);
  const addToComparison = useMutation(api.packageComparison.addToComparison);
  const removeFromComparison = useMutation(api.packageComparison.removeFromComparison);

  useEffect(() => {
    if (packageData) {
      const images = [packageData.mainImage, ...(packageData.galleryImages || [])];
      setAllImages(images);
    }
  }, [packageData]);

  const handleToggleWishlist = async () => {
    if (!userId || !packageData) return;

    try {
      if (isInWishlist) {
        await removeFromWishlist({
          itemType: "package",
          itemId: packageData._id,
        });
        toast.success("Removido dos favoritos");
      } else {
        await addToWishlist({
          itemType: "package",
          itemId: packageData._id,
        });
        toast.success("Adicionado aos favoritos");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleComparison = async () => {
    if (!userId || !packageData) return;

    try {
      if (isInComparison) {
        await removeFromComparison({
          packageId: packageData._id as any,
        });
        toast.success("Removido da comparação");
      } else {
        await addToComparison({
          packageId: packageData._id as any,
        });
        toast.success("Adicionado à comparação");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleImageChange = (index: number) => {
    setActiveImageIndex(index);
  };

  const calculateDiscountedPrice = () => {
    if (!packageData?.discountPercentage) return packageData?.basePrice;
    return packageData.basePrice * (1 - packageData.discountPercentage / 100);
  };

  if (packageData === undefined) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-96 bg-gray-200 rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-8" />
            </div>
            <div>
              <div className="h-64 bg-gray-200 rounded mb-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Pacote não encontrado</h1>
        <p className="mb-8">O pacote que você está procurando não existe ou foi removido.</p>
        <Link href="/pacotes">
          <Button>Ver todos os pacotes</Button>
        </Link>
      </div>
    );
  }

  const discountedPrice = calculateDiscountedPrice();

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link
          href="/pacotes"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para pacotes
        </Link>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
              {packageData.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-gray-600 mb-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {packageData.category}
              </Badge>
              <span>•</span>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{packageData.duration} dias</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>Até {packageData.maxGuests} pessoas</span>
              </div>
              {reviewStats && reviewStats.totalReviews > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{reviewStats.averageRating}</span>
                    <span className="text-gray-500 ml-1">({reviewStats.totalReviews} avaliações)</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWishlist}
              className="flex items-center gap-2"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
                )}
              />
              Favorito
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleComparison}
              className="flex items-center gap-2"
            >
              <span>Comparar</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-6">
          {packageData.discountPercentage && (
            <span className="text-lg text-gray-500 line-through">
              R$ {packageData.basePrice.toFixed(2)}
            </span>
          )}
          <span className="text-3xl font-bold text-green-600">
            R$ {discountedPrice?.toFixed(2)}
          </span>
          <span className="text-gray-600">por pessoa</span>
          {packageData.discountPercentage && (
            <Badge variant="destructive">
              -{packageData.discountPercentage}%
            </Badge>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-96 relative rounded-xl overflow-hidden">
            {allImages.length > 0 && (
              <Image
                src={allImages[activeImageIndex]}
                alt={packageData.name}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {allImages.slice(1, 5).map((image, index) => (
              <Button
                key={`image-${index + 1}`}
                className="h-[11.5rem] relative rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 p-0"
                onClick={() => handleImageChange(index + 1)}
                variant="ghost"
              >
                <Image
                  src={image}
                  alt={`${packageData.name} - imagem ${index + 2}`}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-300"
                />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center justify-center py-3">Visão Geral</TabsTrigger>
              <TabsTrigger value="itinerary" className="flex items-center justify-center py-3">Roteiro</TabsTrigger>
              <TabsTrigger value="includes" className="flex items-center justify-center py-3">O que inclui</TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center justify-center py-3">Avaliações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Sobre este pacote</h3>
                <p className="text-gray-700 leading-relaxed">
                  {packageData.description_long}
                </p>
              </div>

              {packageData.highlights && packageData.highlights.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Destaques</h3>
                  <ul className="space-y-2">
                    {packageData.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Accommodation */}
              {packageData.accommodation && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Hospedagem Incluída</h3>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={packageData.accommodation.mainImage}
                            alt={packageData.accommodation.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold">{packageData.accommodation.name}</h4>
                          <p className="text-gray-600">{packageData.accommodation.type}</p>
                          <p className="text-sm text-green-600 font-medium">
                            R$ {packageData.accommodation.pricePerNight}/noite incluído
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Vehicle */}
              {packageData.vehicle && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Transporte Incluído</h3>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={packageData.vehicle.imageUrl || '/images/default-car.jpg'}
                            alt={`${packageData.vehicle.brand} ${packageData.vehicle.model}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {packageData.vehicle.brand} {packageData.vehicle.model}
                          </h4>
                          <p className="text-gray-600">{packageData.vehicle.category}</p>
                          <p className="text-sm text-green-600 font-medium">
                            R$ {packageData.vehicle.pricePerDay}/dia incluído
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-4 mt-6">
              <h3 className="text-xl font-bold mb-4">Roteiro Detalhado</h3>
              {packageData.itinerary && packageData.itinerary.length > 0 ? (
                <div className="space-y-4">
                  {packageData.itinerary.map((day, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            Dia {day.day}
                          </span>
                          {day.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-3">{day.description}</p>
                        {day.activities && day.activities.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Atividades:</h5>
                            <ul className="space-y-1">
                              {day.activities.map((activity, actIndex) => (
                                <li key={actIndex} className="flex items-center text-sm text-gray-600">
                                  <Check className="h-4 w-4 text-green-500 mr-2" />
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Roteiro detalhado será fornecido após a reserva.</p>
              )}
            </TabsContent>

            <TabsContent value="includes" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Includes */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-green-600">O que está incluído</h3>
                  <ul className="space-y-2">
                    {packageData.includes.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Excludes */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-red-600">O que não está incluído</h3>
                  <ul className="space-y-2">
                    {packageData.excludes.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6 mt-6">
              {reviewStats && reviewStats.totalReviews > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">
                      Avaliações ({reviewStats.totalReviews})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-lg font-semibold">{reviewStats.averageRating}</span>
                    </div>
                  </div>

                  {/* Rating distribution */}
                  <div className="mb-6">
                    {Object.entries(reviewStats.ratingDistribution)
                      .reverse()
                      .map(([rating, count]) => (
                        <div key={rating} className="flex items-center gap-2 mb-2">
                          <span className="text-sm w-3">{rating}</span>
                          <Star className="h-4 w-4 text-yellow-500" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{
                                width: `${reviewStats.totalReviews > 0 ? (Number(count) / reviewStats.totalReviews) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">{Number(count)}</span>
                        </div>
                      ))}
                  </div>

                  {/* Reviews list */}
                  {reviews && reviews.reviews.length > 0 && (
                    <div className="space-y-4">
                      {reviews.reviews.map((review) => (
                        <Card key={review._id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  {review.user?.image ? (
                                    <Image
                                      src={review.user.image}
                                      alt={review.user.name}
                                      width={40}
                                      height={40}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <span className="text-sm font-medium text-gray-600">
                                      {review.user?.name?.charAt(0) || "?"}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-medium">{review.user?.name}</h5>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          "h-4 w-4",
                                          i < review.rating
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-gray-300"
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <h6 className="font-medium mb-2">{review.title}</h6>
                            <p className="text-gray-700">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Nenhuma avaliação ainda
                  </h3>
                  <p className="text-gray-600">
                    Seja o primeiro a avaliar este pacote após sua experiência.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle>Reserve este pacote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-800 mb-2">Preço por pessoa</p>
                  <p className="text-2xl font-bold text-blue-900">
                    R$ {discountedPrice?.toFixed(2)}
                  </p>
                  {packageData.discountPercentage && (
                    <p className="text-sm text-blue-700">
                      Economia de R$ {(packageData.basePrice - discountedPrice!).toFixed(2)}
                    </p>
                  )}
                </div>
                <Button className="w-full" size="lg">
                  Reservar Agora
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Você não será cobrado ainda
                </p>
              </CardContent>
            </Card>

            {/* Package Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pacote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duração</span>
                  <span className="font-medium">{packageData.duration} dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Máximo de pessoas</span>
                  <span className="font-medium">{packageData.maxGuests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Categoria</span>
                  <Badge variant="outline">{packageData.category}</Badge>
                </div>
                {packageData.tags && packageData.tags.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {packageData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 