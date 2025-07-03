"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bed, Bath, Users, MapPin, Star, Wifi, Car, Coffee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Review components
import { QuickStats } from "@/components/reviews";

// Mock data para hospedagens
const mockAccommodations = [
  {
    id: "acc-001",
    name: "Pousada Maravilha",
    slug: "pousada-maravilha",
    type: "Pousada",
    shortDescription: "Bangalôs exclusivos com vista para o mar",
    mainImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop",
    pricePerNight: 850,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    location: "Praia da Conceição",
    amenities: ["Wi-Fi", "Ar-condicionado", "Vista para o mar", "Piscina"],
    rating: 4.8,
    totalReviews: 156,
    isFeatured: true,
  },
  {
    id: "acc-002",
    name: "Hotel Atlântis",
    slug: "hotel-atlantis",
    type: "Hotel",
    shortDescription: "Hotel confortável no centro de Vila dos Remédios",
    mainImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop",
    pricePerNight: 450,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    location: "Vila dos Remédios",
    amenities: ["Wi-Fi", "Ar-condicionado", "Piscina", "Recepção 24h"],
    rating: 4.2,
    totalReviews: 89,
    isFeatured: false,
  },
  {
    id: "acc-003",
    name: "Casa do Mar",
    slug: "casa-do-mar",
    type: "Casa",
    shortDescription: "Casa completa com vista privilegiada",
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
    pricePerNight: 1200,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    location: "Praia do Sueste",
    amenities: ["Wi-Fi", "Ar-condicionado", "Vista para o mar", "Cozinha completa"],
    rating: 4.9,
    totalReviews: 67,
    isFeatured: true,
  },
  {
    id: "acc-004",
    name: "Pousada Vila dos Remédios",
    slug: "pousada-vila-remedios",
    type: "Pousada",
    shortDescription: "Aconchegante pousada familiar",
    mainImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
    pricePerNight: 320,
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    location: "Vila dos Remédios",
    amenities: ["Wi-Fi", "Café da manhã", "Estacionamento"],
    rating: 4.0,
    totalReviews: 124,
    isFeatured: false,
  },
];

function AccommodationCard({ accommodation }: { accommodation: typeof mockAccommodations[0] }) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl h-full bg-white">
      <Link href={`/hospedagens/${accommodation.slug}`} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
          <Image
            src={accommodation.mainImage}
            alt={accommodation.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Price badge */}
          <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
            {formatCurrency(accommodation.pricePerNight)}/noite
          </div>
          
          {/* Type badge */}
          <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
            {accommodation.type}
          </div>
          
          {/* Featured badge */}
          {accommodation.isFeatured && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
              Destaque
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-5 flex-1 flex flex-col">
          {/* Title and Rating */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium line-clamp-1 flex-1 mr-2">
              {accommodation.name}
            </h3>
            
            {/* Review Stats */}
            <QuickStats
              averageRating={accommodation.rating}
              totalReviews={accommodation.totalReviews}
              className="text-sm flex-shrink-0"
            />
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
            <MapPin className="h-4 w-4" />
            <span>{accommodation.location}</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {accommodation.shortDescription}
          </p>

          {/* Room details */}
          <div className="flex gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{accommodation.bedrooms} quartos</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{accommodation.bathrooms} banheiros</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{accommodation.maxGuests} hóspedes</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1 mb-4">
            {accommodation.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {accommodation.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{accommodation.amenities.length - 3}
              </Badge>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Disponível</span>
            <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:underline transition-colors">
              Ver detalhes →
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export default function HospedagensPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  // Filter and sort accommodations
  const filteredAccommodations = mockAccommodations
    .filter(acc => {
      const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           acc.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || acc.type.toLowerCase() === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.pricePerNight - b.pricePerNight;
        case "price-high":
          return b.pricePerNight - a.pricePerNight;
        case "rating":
          return b.rating - a.rating;
        case "featured":
        default:
          return b.isFeatured ? 1 : -1;
      }
    });

  return (
    <>
      {/* Hero Section */}
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Hospedagens em Fernando de Noronha
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                Encontre o lugar perfeito para sua estadia no paraíso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <Input
                type="text"
                placeholder="Nome ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="pousada">Pousada</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Destaques</SelectItem>
                  <SelectItem value="price-low">Menor preço</SelectItem>
                  <SelectItem value="price-high">Maior preço</SelectItem>
                  <SelectItem value="rating">Melhor avaliação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setSortBy("featured");
                }}
                variant="outline"
                className="w-full"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Hospedagens disponíveis
          </h2>
          <p className="text-gray-600">
            {filteredAccommodations.length} {filteredAccommodations.length === 1 ? 'hospedagem encontrada' : 'hospedagens encontradas'}
          </p>
        </div>

        {/* Accommodation Grid */}
        {filteredAccommodations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAccommodations.map((accommodation) => (
              <AccommodationCard
                key={accommodation.id}
                accommodation={accommodation}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <Bed className="h-16 w-16 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma hospedagem encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar seus filtros para encontrar mais opções.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setSortBy("featured");
              }}
              variant="outline"
            >
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-blue-50 rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">
              Precisa de ajuda para escolher?
            </h3>
            <p className="text-blue-800 mb-6 max-w-2xl mx-auto">
              Nossa equipe especializada pode te ajudar a encontrar a hospedagem perfeita 
              para sua viagem a Fernando de Noronha.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Falar com especialista
              </Button>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                Ver guia de hospedagens
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}