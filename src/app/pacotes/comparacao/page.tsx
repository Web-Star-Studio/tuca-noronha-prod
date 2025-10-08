"use client";

import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Star, Users, Clock, Check, Car, Building } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
// cn removido (não utilizado)

export default function PackageComparisonPage() {
  const { userId } = useAuth();

  // Buscar dados da comparação
  const comparison = useQuery(
    api.packageComparison.getUserComparison,
    userId ? {} : undefined
  );

  // Buscar estatísticas de avaliações para cada pacote
  // reviewStats removido (não utilizado)
  // const reviewStats = useQuery(
  //   comparison?.packages && comparison.packages.length > 0 
  //     ? api.reviews.getItemReviewStats 
  //     : undefined,
  //   comparison?.packages?.[0] ? {
  //     itemType: "package",
  //     itemId: comparison.packages[0]._id,
  //   } : undefined
  // );

  // Mutations
  const removeFromComparison = useMutation(api.packageComparison.removeFromComparison);
  const clearComparison = useMutation(api.packageComparison.clearComparison);

  const handleRemovePackage = async (packageId: string) => {
    if (!userId) return;

    try {
      await removeFromComparison({
        packageId: packageId as any,
      });
      toast.success("Pacote removido da comparação");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;

    try {
      await clearComparison({});
      toast.success("Comparação limpa");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Faça login para comparar pacotes</h1>
        <p className="text-gray-600 mb-8">
          Você precisa estar logado para usar a funcionalidade de comparação.
        </p>
        <Link href="/sign-in">
          <Button>Fazer Login</Button>
        </Link>
      </div>
    );
  }

  if (!comparison || !comparison.packages || comparison.packages.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Nenhum pacote para comparar</h1>
        <p className="text-gray-600 mb-8">
          Adicione pacotes à sua lista de comparação para visualizá-los lado a lado.
        </p>
        <Link href="/pacotes">
          <Button>Explorar Pacotes</Button>
        </Link>
      </div>
    );
  }

  const packages = comparison.packages;

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Comparação de Pacotes</h1>
          <p className="text-gray-600">
            Compare até 3 pacotes para escolher o melhor para sua viagem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearAll}>
            Limpar Todos
          </Button>
          <Link href="/pacotes">
            <Button variant="outline">Adicionar Mais</Button>
          </Link>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Package Headers */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
            <div></div> {/* Empty cell for row labels */}
            {packages.map((pkg) => (
              <Card key={pkg._id} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => handleRemovePackage(pkg._id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardContent className="p-4">
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={pkg.mainImage}
                      alt={pkg.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{pkg.name}</h3>
                  <Badge variant="secondary" className="mb-2">{pkg.category}</Badge>
                  <div className="flex items-center gap-2">
                    {pkg.discountPercentage && (
                      <span className="text-sm text-gray-500 line-through">
                        R$ {pkg.basePrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xl font-bold text-green-600">
                      R$ {(pkg.basePrice * (1 - (pkg.discountPercentage || 0) / 100)).toFixed(2)}
                    </span>
                  </div>
                  <Link href={`/pacotes/${pkg.slug}`}>
                    <Button className="w-full mt-3" size="sm">
                      Ver Detalhes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Rows */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Duration */}
                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Duração
                    </div>
                    {packages.map((pkg) => (
                      <div key={`duration-${pkg._id}`} className="text-center p-2 bg-gray-50 rounded">
                        {pkg.duration} dias
                      </div>
                    ))}
                  </div>

                  {/* Max Guests */}
                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Máximo de pessoas
                    </div>
                    {packages.map((pkg) => (
                      <div key={`guests-${pkg._id}`} className="text-center p-2 bg-gray-50 rounded">
                        {pkg.maxGuests} pessoas
                      </div>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Avaliação
                    </div>
                    {packages.map((pkg) => (
                      <div key={`rating-${pkg._id}`} className="text-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>4.5</span>
                          <span className="text-gray-500 text-sm">(12)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accommodation */}
            <Card>
              <CardHeader>
                <CardTitle>Hospedagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                  <div className="font-medium flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Hospedagem Incluída
                  </div>
                  {packages.map((pkg) => (
                    <div key={`accommodation-${pkg._id}`} className="p-2 bg-gray-50 rounded">
                      {pkg.accommodation ? (
                        <div className="text-center">
                          <div className="font-medium text-sm">{pkg.accommodation.name}</div>
                          <div className="text-xs text-gray-600">{pkg.accommodation.type}</div>
                          <div className="text-xs text-green-600 font-medium">
                            R$ {pkg.accommodation.pricePerNight}/noite
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 text-sm">
                          Não incluído
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transportation */}
            <Card>
              <CardHeader>
                <CardTitle>Transporte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                  <div className="font-medium flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    Veículo Incluído
                  </div>
                  {packages.map((pkg) => (
                    <div key={`vehicle-${pkg._id}`} className="p-2 bg-gray-50 rounded">
                      {pkg.vehicle ? (
                        <div className="text-center">
                          <div className="font-medium text-sm">
                            {pkg.vehicle.brand} {pkg.vehicle.model}
                          </div>
                          <div className="text-xs text-gray-600">{pkg.vehicle.category}</div>
                          <div className="text-xs text-green-600 font-medium">
                            R$ {pkg.vehicle.pricePerDay ?? 0}/dia
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 text-sm">
                          Não incluído
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Includes */}
            <Card>
              <CardHeader>
                <CardTitle>O que está incluído</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                  <div className="font-medium">Itens incluídos</div>
                  {packages.map((pkg) => (
                    <div key={`includes-${pkg._id}`} className="p-2 bg-gray-50 rounded">
                      <div className="space-y-1">
                        {pkg.includes.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-xs flex items-start">
                            <Check className="h-3 w-3 text-green-500 mr-1 mt-0.5" />
                            <span className="line-clamp-1">{item}</span>
                          </div>
                        ))}
                        {pkg.includes.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{pkg.includes.length - 3} mais itens
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activities Count */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades e Experiências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium">Atividades incluídas</div>
                    {packages.map((pkg) => (
                      <div key={`activities-${pkg._id}`} className="text-center p-2 bg-gray-50 rounded">
                        {pkg.includedActivitiesCount} atividades
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium">Restaurantes incluídos</div>
                    {packages.map((pkg) => (
                      <div key={`restaurants-${pkg._id}`} className="text-center p-2 bg-gray-50 rounded">
                        {pkg.includedRestaurantsCount} restaurantes
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium">Eventos incluídos</div>
                    {packages.map((pkg) => (
                      <div key={`events-${pkg._id}`} className="text-center p-2 bg-gray-50 rounded">
                        {pkg.includedEventsCount} eventos
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Preços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium">Preço por pessoa</div>
                    {packages.map((pkg) => {
                      const discountedPrice = pkg.basePrice * (1 - (pkg.discountPercentage || 0) / 100);
                      return (
                        <div key={`price-${pkg._id}`} className="text-center p-2 bg-green-50 rounded">
                          {pkg.discountPercentage && (
                            <div className="text-sm text-gray-500 line-through">
                              R$ {pkg.basePrice.toFixed(2)}
                            </div>
                          )}
                          <div className="text-lg font-bold text-green-600">
                            R$ {discountedPrice.toFixed(2)}
                          </div>
                          {pkg.discountPercentage && (
                            <Badge variant="destructive" className="text-xs">
                              -{pkg.discountPercentage}%
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                    <div className="font-medium">Preço total estimado (4 pessoas)</div>
                    {packages.map((pkg) => {
                      const discountedPrice = pkg.basePrice * (1 - (pkg.discountPercentage || 0) / 100);
                      const totalPrice = discountedPrice * 4;
                      return (
                        <div key={`total-${pkg._id}`} className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">
                            R$ {totalPrice.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-4 mt-8" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
            <div></div>
            {packages.map((pkg) => (
              <Link key={`action-${pkg._id}`} href={`/pacotes/${pkg.slug}`}>
                <Button className="w-full" size="lg">
                  Escolher Este Pacote
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 