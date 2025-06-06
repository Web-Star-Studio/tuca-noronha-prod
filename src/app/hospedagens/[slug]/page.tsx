"use client";

import { useEffect, useState, use } from "react";
import { ChevronLeft, Users, Bath, Home, BedDouble, Check, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AccommodationBookingForm } from "@/components/bookings/AccommodationBookingForm";
import { useAccommodationBySlug } from "@/lib/services/accommodationService";
import type { Accommodation } from "@/lib/services/accommodationService";

// Definir o tipo para o objeto de reserva
type BookingData = {
  hotelId?: string;
  hotelName?: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  guests: number;
};

export default function HostingDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);

  // Buscar dados reais do Convex
  const { accommodation, isLoading } = useAccommodationBySlug(params.slug);

  useEffect(() => {
    if (accommodation) {
      // Combinar imagem principal com galeria para exibição
      const images = [accommodation.mainImage, ...(accommodation.galleryImages || [])];
      setAllImages(images);
    }
  }, [accommodation]);

  // Manipulador de eventos para a submissão de reserva
  const handleBookingSubmit = (booking: BookingData) => {
    console.log("Booking submitted:", booking);
    alert(`Reserva de hospedagem confirmada para ${booking.guests} hóspede(s) de ${format(booking.checkIn, "PPP", { locale: ptBR })} a ${format(booking.checkOut, "PPP", { locale: ptBR })}`);
  };

  // Manipulador de mudança de imagem acessível
  const handleImageChange = (index: number) => {
    setActiveImageIndex(index);
  };

  if (isLoading) {
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

  if (!accommodation) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Hospedagem não encontrada</h1>
        <p className="mb-8">A hospedagem que você está procurando não existe ou foi removida.</p>
        <Link href="/hospedagens">
          <Button>
            Ver todas as hospedagens
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link
          href="/hospedagens"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para hospedagens
        </Link>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
          {accommodation.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-gray-600">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
            {accommodation.type}
          </span>
          <span>•</span>
          <span>{accommodation.address.neighborhood}, {accommodation.address.city}</span>
          <span>•</span>
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1">⭐</span>
            <span className="font-medium">{accommodation.rating.overall.toFixed(1)}</span>
            <span className="text-gray-500 ml-1">({accommodation.rating.totalReviews} avaliações)</span>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-96 relative rounded-xl overflow-hidden">
            {allImages.length > 0 && (
              <Image
                src={allImages[activeImageIndex]}
                alt={accommodation.name}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {allImages.slice(1, 5).map((image, index) => (
              <Button
                key={`image-${index + 1}`}
                className="h-[11.5rem] relative rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => handleImageChange(index + 1)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleImageChange(index + 1);
                  }
                }}
                aria-label={`Ver imagem ${index + 2} de ${allImages.length}`}
              >
                <Image
                  src={image}
                  alt={`${accommodation.name} - imagem ${index + 2}`}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-300"
                />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Host and basic info */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 pb-8 border-b">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {accommodation.type} inteira
              </h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
                <li className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Até {accommodation.maximumGuests} hóspedes</span>
                </li>
                <li className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  <span>{accommodation.rooms.bedrooms} quartos</span>
                </li>
                <li className="flex items-center">
                  <BedDouble className="h-4 w-4 mr-2" />
                  <span>{accommodation.rooms.beds || 2} camas</span>
                </li>
                <li className="flex items-center">
                  <Bath className="h-4 w-4 mr-2" />
                  <span>{accommodation.rooms.bathrooms} banheiros</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xl font-bold mb-4">Sobre esta acomodação</h3>
            <p className="text-gray-700 leading-relaxed">
              {accommodation.description}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-xl font-bold mb-6">O que este local oferece</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accommodation.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-xl font-bold mb-4">Onde você vai ficar</h3>
            <div className="text-gray-700">
              <p className="mb-2">
                <strong>{accommodation.address.neighborhood}</strong>, {accommodation.address.city}, {accommodation.address.state}
              </p>
              <p className="text-sm text-gray-600">
                {accommodation.address.street}, {accommodation.address.zipCode}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          {(accommodation.phone || accommodation.website) && (
            <div>
              <h3 className="text-xl font-bold mb-4">Informações de contato</h3>
              <div className="space-y-2">
                {accommodation.phone && (
                  <p className="text-gray-700">
                    <strong>Telefone:</strong> {accommodation.phone}
                  </p>
                )}
                {accommodation.website && (
                  <p className="text-gray-700">
                    <strong>Website:</strong>{" "}
                    <a 
                      href={accommodation.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {accommodation.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Booking Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">R$ {accommodation.pricing.pricePerNight.toLocaleString()}</span>
                  <span className="text-gray-600 ml-1">/noite</span>
                </div>
                {accommodation.pricing.taxes && (
                  <p className="text-sm text-gray-600 mt-1">
                    + R$ {accommodation.pricing.taxes} de taxas
                  </p>
                )}
                {accommodation.pricing.cleaningFee && (
                  <p className="text-sm text-gray-600">
                    + R$ {accommodation.pricing.cleaningFee} taxa de limpeza
                  </p>
                )}
              </div>

              <AccommodationBookingForm
                accommodationId={accommodation._id || ''}
                accommodationName={accommodation.name}
                pricePerNight={accommodation.pricing.pricePerNight}
                maxGuests={accommodation.maximumGuests}
                onSubmit={handleBookingSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}