"use client";

import { useEffect, useState, use } from "react";
import { useHostingDetailStore, useHostingsStore } from "@/lib/store/hostingsStore";
import { ChevronLeft, Users, Bath, Home, BedDouble, Check, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AccommodationBookingForm } from "@/components/bookings/AccommodationBookingForm";

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
  const { hostings } = useHostingsStore();
  const { hosting, setHosting, isLoading, setLoading } = useHostingDetailStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);

  // Estado para as datas de check-in e check-out
  // const [dateRange] = useState<DateRange | undefined>({
  //  from: addDays(new Date(), 1),
  //  to: addDays(new Date(), 6)
  // });

  // Estado para quantidade de hóspedes (variáveis comentadas são usadas em funcionalidades futuras)
  // const [guestCount, setGuestCount] = useState(2);
  // const [adultCount, setAdultCount] = useState(2);
  // const [childCount, setChildCount] = useState(0);

  // const nightCount = dateRange?.from && dateRange?.to 
  //  ? differenceInCalendarDays(dateRange.to, dateRange.from) 
  //  : 0;

  useEffect(() => {
    const currentHosting = hostings.find((h) => h.slug === params.slug);
    
    if (currentHosting) {
      setHosting(currentHosting);
      
      // Combinar imagem principal com galeria para exibição
      const images = [currentHosting.mainImage, ...currentHosting.galleryImages];
      setAllImages(images);
    }
    
    setLoading(false);
  }, [hostings, params.slug, setHosting, setLoading]);

  // Formatação do preço para moeda brasileira (função será usada em implementação futura)
  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat('pt-BR', {
  //     style: 'currency',
  //     currency: 'BRL'
  //   }).format(value);
  // };

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

  if (!hosting) {
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
          {hosting.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-gray-600">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
            {hosting.type}
          </span>
          <span>•</span>
          <span>{hosting.address.neighborhood}, {hosting.address.city}</span>
          <span>•</span>
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1">⭐</span>
            <span className="font-medium">{hosting.rating.overall.toFixed(1)}</span>
            <span className="text-gray-500 ml-1">({hosting.rating.totalReviews} avaliações)</span>
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
                alt={hosting.name}
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
                  alt={`${hosting.name} - imagem ${index + 2}`}
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
                {hosting.type} inteira
              </h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
                <li className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Até {hosting.maxGuests} hóspedes</span>
                </li>
                <li className="flex items-center">
                  <BedDouble className="h-4 w-4 mr-2" />
                  <span>{hosting.bedrooms} quarto{hosting.bedrooms !== 1 ? 's' : ''}</span>
                </li>
                <li className="flex items-center">
                  <Bath className="h-4 w-4 mr-2" />
                  <span>{hosting.bathrooms} banheiro{hosting.bathrooms !== 1 ? 's' : ''}</span>
                </li>
                <li className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  <span>{hosting.area}m²</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Description */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">Sobre esta acomodação</h3>
            <p className="text-gray-700 whitespace-pre-line mb-6">
              {hosting.description_long}
            </p>
          </div>

          {/* Amenities */}
          <div className="mb-10 pb-10 border-b">
            <h3 className="text-xl font-bold mb-6">O que esta acomodação oferece</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4">
              {hosting.amenities.map((amenity, index) => (
                <div key={`${hosting.id}-${index}`} className="flex items-center">
                  <Check className="text-blue-600 h-5 w-5 mr-3" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House rules */}
          <div className="mb-10 pb-10 border-b">
            <h3 className="text-xl font-bold mb-6">Regras da casa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 mb-8">
              <div>
                <h4 className="font-medium mb-3">Check-in e Check-out</h4>
                <div className="text-gray-700">
                  <div className="mb-1">Check-in: {hosting.checkInTime}</div>
                  <div>Check-out: {hosting.checkOutTime}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Estadia mínima</h4>
                <div className="text-gray-700">
                  {hosting.minimumStay} noite{hosting.minimumStay !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {hosting.houseRules.map((rule, index) => (
                <div key={`${hosting.id}-${index}`} className="flex items-start">
                  <Check className="text-blue-600 h-5 w-5 mr-3 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}
              
              <div className="flex items-start">
                <span className={`h-5 w-5 mr-3 mt-0.5 flex items-center justify-center ${hosting.petsAllowed ? 'text-blue-600' : 'text-red-500'}`}>
                  {hosting.petsAllowed ? <Check /> : <X />}
                </span>
                <span>Animais de estimação {hosting.petsAllowed ? 'permitidos' : 'não permitidos'}</span>
              </div>
              
              <div className="flex items-start">
                <span className={`h-5 w-5 mr-3 mt-0.5 flex items-center justify-center ${hosting.smokingAllowed ? 'text-blue-600' : 'text-red-500'}`}>
                  {hosting.smokingAllowed ? <Check /> : <X />}
                </span>
                <span>Fumar {hosting.smokingAllowed ? 'permitido' : 'não permitido'}</span>
              </div>
              
              <div className="flex items-start">
                <span className={`h-5 w-5 mr-3 mt-0.5 flex items-center justify-center ${hosting.eventsAllowed ? 'text-blue-600' : 'text-red-500'}`}>
                  {hosting.eventsAllowed ? <Check /> : <X />}
                </span>
                <span>Eventos e festas {hosting.eventsAllowed ? 'permitidos' : 'não permitidos'}</span>
              </div>
            </div>
          </div>

          {/* Cancellation policy */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">Política de cancelamento</h3>
            <p className="text-gray-700">
              {hosting.cancellationPolicy}
            </p>
          </div>
        </div>

        {/* Booking card */}
        <div>
          <div className="sticky top-32">
            <AccommodationBookingForm
              hotelId={hosting.id}
              hotelName={hosting.name}
              onBookingSubmit={handleBookingSubmit}
            />

            {/* Apenas um resumo das políticas abaixo do formulário */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600 border border-gray-100">
              <p className="mb-2 font-medium">Informações importantes:</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Check-in a partir das {hosting.checkInTime}
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Check-out até {hosting.checkOutTime}
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Estadia mínima: {hosting.minimumStay} noite(s)
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {hosting.cancellationPolicy.split('.')[0]}.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}