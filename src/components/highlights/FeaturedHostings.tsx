'use client'

import HostingCard from "@/components/cards/HostingCard";
import { ArrowRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useFeaturedAccommodations } from "@/lib/services/accommodationService";
import type { Accommodation } from "@/lib/services/accommodationService";

export default function FeaturedHostings() {
  // Buscar dados reais do Convex
  const { accommodations: featuredAccommodations = [], isLoading } = useFeaturedAccommodations();
  
  // Transformar dados do Convex para o formato esperado pelo HostingCard
  const transformAccommodationToHosting = (accommodation: Accommodation) => ({
    id: accommodation._id || '',
    name: accommodation.name,
    slug: accommodation.slug,
    description: accommodation.description,
    description_long: accommodation.description,
    address: {
      street: accommodation.address.street,
      city: accommodation.address.city,
      state: accommodation.address.state,
      zipCode: accommodation.address.zipCode,
      neighborhood: accommodation.address.neighborhood,
      coordinates: {
        latitude: accommodation.address.coordinates.latitude,
        longitude: accommodation.address.coordinates.longitude
      }
    },
    phone: accommodation.phone,
    website: accommodation.website || '',
    type: accommodation.type,
    checkInTime: accommodation.policies?.checkIn || "14:00",
    checkOutTime: accommodation.policies?.checkOut || "11:00",
    pricePerNight: accommodation.pricing.pricePerNight,
    currency: "BRL",
    discountPercentage: 0,
    taxes: accommodation.pricing.taxes,
    cleaningFee: accommodation.pricing.cleaningFee,
    totalRooms: 1,
    maxGuests: accommodation.maximumGuests,
    bedrooms: accommodation.rooms.bedrooms,
    bathrooms: accommodation.rooms.bathrooms,
    beds: {
      single: 0,
      double: accommodation.rooms.beds || 2,
      queen: 0,
      king: 0
    },
    area: 35,
    amenities: accommodation.amenities,
    houseRules: accommodation.houseRules || [],
    cancellationPolicy: accommodation.policies?.cancellation || "Política de cancelamento padrão",
    petsAllowed: false,
    smokingAllowed: false,
    eventsAllowed: false,
    minimumStay: accommodation.minimumStay || 1,
    mainImage: accommodation.mainImage,
    galleryImages: accommodation.galleryImages || [],
    rating: {
      overall: accommodation.rating.overall,
      cleanliness: accommodation.rating.cleanliness,
      location: accommodation.rating.location,
      checkin: accommodation.rating.checkIn,
      value: accommodation.rating.value,
      accuracy: accommodation.rating.accuracy,
      communication: accommodation.rating.communication,
      totalReviews: accommodation.rating.totalReviews
    },
    isActive: accommodation.isActive,
    isFeatured: accommodation.isFeatured,
    tags: [],
    createdAt: accommodation._creationTime?.toString() || '',
    updatedAt: accommodation._creationTime?.toString() || ''
  });

  if (isLoading) {
    return (
      <section className="py-24 relative overflow-hidden bg-blue-50/30">
        {/* Background design elements */}
        <div className="absolute top-0 right-0 -z-10 opacity-10">
          <Home className="w-72 h-72 text-blue-200" />
        </div>
        <div className="absolute bottom-20 left-10 -z-10 opacity-5">
          <Image 
            src="/images/bg-pattern.png" 
            alt="Pattern" 
            width={500} 
            height={500} 
            className="opacity-20"
          />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
                Onde Se Hospedar
              </h2>
              <p className="text-xl text-muted-foreground">
                Carregando as melhores acomodações em Fernando de Noronha...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!featuredAccommodations.length) {
    return (
      <section className="py-24 relative overflow-hidden bg-blue-50/30">
        {/* Background design elements */}
        <div className="absolute top-0 right-0 -z-10 opacity-10">
          <Home className="w-72 h-72 text-blue-200" />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
                Onde Se Hospedar
              </h2>
              <p className="text-xl text-muted-foreground">
                Encontre as melhores acomodações em Fernando de Noronha
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-6 md:mt-0"
            >
              <Link href="/hospedagens" className="text-blue-600 font-medium flex items-center group hover:underline">
                Ver todas as hospedagens
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="text-center py-10">
            <p className="text-lg text-gray-500">
              Nenhuma hospedagem em destaque no momento
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-24 relative overflow-hidden bg-blue-50/30">
      {/* Background design elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <Home className="w-72 h-72 text-blue-200" />
      </div>
      <div className="absolute bottom-20 left-10 -z-10 opacity-5">
        <Image 
          src="/images/bg-pattern.png" 
          alt="Pattern" 
          width={500} 
          height={500} 
          className="opacity-20"
        />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
              Onde Se Hospedar
            </h2>
            <p className="text-xl text-muted-foreground">
              Encontre as melhores acomodações em Fernando de Noronha
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 md:mt-0"
          >
            <Link href="/hospedagens" className="text-blue-600 font-medium flex items-center group hover:underline">
              Ver todas as hospedagens
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {featuredAccommodations.map((accommodation) => (
            <motion.div
              key={accommodation._id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <HostingCard hosting={transformAccommodationToHosting(accommodation)} />
            </motion.div>
          ))}
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-10">
              <h3 className="text-2xl font-bold mb-2">Procurando hospedagem ideal?</h3>
              <p className="text-gray-600">Temos opções para todos os perfis e orçamentos.</p>
            </div>
            <Link 
              href="/hospedagens" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Explorar opções
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
