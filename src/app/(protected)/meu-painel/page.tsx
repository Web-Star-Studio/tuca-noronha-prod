'use client'

import { motion, AnimatePresence } from "framer-motion"
import ProfileHeroSection from "@/components/hero/ProfileHeroSection"
import MobileBottomNavigation from "@/components/hero/MobileBottomNavigation"

// Import our refactored components
import { useDashboard } from './hooks/useDashboard'
import { getReservationColor, getStatusVariant, getStatusLabel } from './utils/reservations'
import ReservationsSection from './components/ReservationsSection'
import PackageRequestsSection from './components/PackageRequestsSection'
import OverviewSection from './components/OverviewSection'
import FloatingSupportButton from './components/FloatingSupportButton'
import AIRecommendationsSection from '@/components/AIRecommendationsSection'
import ChatsSection from './components/ChatsSection'
import NotificationsSection from './components/NotificationsSection'

export default function Dashboard() {
  const {
    activeSection,
    setActiveSection,
    notifications,
    onMarkAsRead,
    handleNewReservation,
    handleViewReservationDetails,
    handleCancelReservation,
    reservations,
    stats,
    isLoadingReservations
  } = useDashboard()

  // Show loading state while fetching data
  
  const renderPageContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection 
            reservations={reservations}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onSectionChange={setActiveSection}
            stats={stats}
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
      case 'chats':
        return <ChatsSection />
      case 'notificacoes':
        return <NotificationsSection />
      case 'recomendacoes':
        return <AIRecommendationsSection />
      default:
        return (
          <OverviewSection 
            reservations={reservations}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onSectionChange={setActiveSection}
            stats={stats}
          />
        )
    }
  }

  // Show loading state while fetching data
  if (isLoadingReservations) {
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
      <div className="container mx-auto px-4 md:px-6 max-w-screen-2xl py-8 md:py-12 pb-20 md:pb-12">
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </div>
  )
}
