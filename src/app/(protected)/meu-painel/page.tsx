'use client'

import React from 'react'
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Utensils, 
  Activity, 
  CreditCard, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle 
} from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import ProfileHeroSection from "@/components/hero/ProfileHeroSection"
import PreferencesSection from "./PreferencesSection"

// Import our refactored components
import { useDashboard } from './hooks/useDashboard'
import { getReservationColor, getStatusVariant, getStatusLabel } from './utils/reservations'
import ReservationsSection from './components/ReservationsSection'
import PackageRequestsSection from './components/PackageRequestsSection'
import OverviewSection from './components/OverviewSection'
import FloatingSupportButton from './components/FloatingSupportButton'
import RecommendationCard from './components/RecommendationCard'
import FavoritesSection from '@/components/profile/FavoritesSection'

// Mock data para recomendações
const mockRecommendations = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Beijupirá',
    description: 'Culinária regional de Fernando de Noronha',
    rating: 4.8,
    imageUrl: '/images/restaurants/beijupira.jpg',
    tags: ['Frutos do Mar', 'Regional', 'Premium'],
    isActive: true,
    isFeatured: false
  },
  {
    id: '2',
    type: 'activity',
    name: 'Mergulho com Cilindro',
    description: 'Explore as águas cristalinas de Noronha',
    rating: 4.9,
    imageUrl: '/images/activities/diving.jpg',
    tags: ['Aventura', 'Mergulho', 'Natureza'],
    isActive: true,
    isFeatured: true
  },
  {
    id: '3',
    type: 'accommodation',
    name: 'Pousada Maravilha',
    description: 'Vista incrível para o mar',
    rating: 4.7,
    imageUrl: '/images/accommodations/maravilha.jpg',
    tags: ['Hospedagem Premium', 'Vista Mar', 'Luxo'],
    isActive: true,
    isFeatured: false
  }
];

export default function Dashboard() {
  const { user } = useUser()
  
  const {
    activeSection,
    setActiveSection,
    notifications,
    markNotificationAsRead,
    handleNewReservation,
    handleViewReservationDetails,
    handleCancelReservation,
    reservations,
    stats,
    isLoadingReservations,
    isLoadingNotifications,
    isLoadingStats
  } = useDashboard()

  // Show loading state while fetching data
  const isLoading = isLoadingReservations || isLoadingNotifications || isLoadingStats;

  const renderPageContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection 
            reservations={reservations}
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onSectionChange={setActiveSection}
          />
        )
      case 'reservas':
        return (
          <ReservationsSection
            reservations={reservations}
            getReservationColor={getReservationColor}
            getStatusVariant={getStatusVariant}
            getStatusLabel={getStatusLabel}
            onNewReservation={handleNewReservation}
            onViewDetails={handleViewReservationDetails}
            onCancelReservation={handleCancelReservation}
          />
        )
      case 'pacotes':
        return <PackageRequestsSection />
      case 'recomendacoes':
        return (
          <div className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Recomendações Personalizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockRecommendations.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case 'favoritos':
        return <FavoritesSection />
      case 'personalizacao':
        return <PreferencesSection />
      case 'ajuda':
        return (
          <div className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                    Reservas e Cancelamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <p>Aprenda como fazer, alterar ou cancelar reservas.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full text-primary">Ver detalhes</Button>
                </CardFooter>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    Pagamentos e Reembolsos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <p>Informações sobre formas de pagamento e política de reembolso.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full text-primary">Ver detalhes</Button>
                </CardFooter>
              </Card>
            </div>
            
            <Separator />
            
            <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-700">Contato Direto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-600 mb-4">
                  Precisa de ajuda personalizada? Entre em contato conosco:
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-emerald-700">
                    <strong>WhatsApp:</strong> (81) 99999-9999
                  </p>
                  <p className="text-sm text-emerald-700">
                    <strong>Email:</strong> suporte@tucanoronha.com.br
                  </p>
                  <p className="text-sm text-emerald-700">
                    <strong>Horário:</strong> Segunda a Sexta, 8h às 18h
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return (
          <OverviewSection 
            reservations={reservations}
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onSectionChange={setActiveSection}
          />
        )
    }
  }

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen w-full">
        <ProfileHeroSection 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          stats={stats}
        />
        <div className="container mx-auto px-4 md:px-6 max-w-screen-2xl py-8 md:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando suas reservas...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <ProfileHeroSection 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        stats={stats}
      />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 max-w-screen-2xl py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-6 md:space-y-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPageContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Floating Support Button */}
      <FloatingSupportButton />
    </div>
  )
}
