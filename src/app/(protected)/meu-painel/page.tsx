'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Utensils, 
  Activity, 
  CreditCard, 
  Award, 
  Sparkles
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import MobileBottomNavigation from "@/components/hero/MobileBottomNavigation"

// Import our refactored components
import { useDashboard } from './hooks/useDashboard'
import { getReservationColor, getStatusVariant, getStatusLabel } from './utils/reservations'
import ReservationsSection from './components/ReservationsSection'
import PackageRequestsSection from './components/PackageRequestsSection'
import OverviewSection from './components/OverviewSection'
import FloatingSupportButton from './components/FloatingSupportButton'
import RecommendationCard from './components/RecommendationCard'
import AIRecommendationsSection from '@/components/AIRecommendationsSection'
import ChatsSection from './components/ChatsSection'

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

  // Sync activeSection with local state
  const [activeTab, setActiveTab] = useState(activeSection)

  // Keep activeTab in sync with activeSection from useDashboard hook
  useEffect(() => {
    setActiveTab(activeSection)
  }, [activeSection])

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
      case 'recomendacoes':
        return <AIRecommendationsSection />
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
