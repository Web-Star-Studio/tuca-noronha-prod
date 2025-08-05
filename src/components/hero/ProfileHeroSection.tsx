"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Calendar, Star, Award } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import ProfileHeroNavigation from "./ProfileHeroNavigation";

interface ProfileHeroSectionProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  stats?: {
    totalReservations: number;
    activeReservations: number;
    totalSpent: number;
    favoriteLocations: string[];
    completedTrips: number;
  };
}

const ProfileHeroSection: React.FC<ProfileHeroSectionProps> = ({ 
  activeSection, 
  onSectionChange,
  stats
}) => {
  const { user } = useUser();

  const getSectionInfo = (section: string) => {
    const sectionData = {
      overview: {
        title: "Meu Painel",
        subtitle: "Visão geral das suas atividades e reservas",
        gradient: "from-blue-500 to-blue-600",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
      },
      reservas: {
        title: "Minhas Reservas", 
        subtitle: "Gerencie todas as suas reservas em um só lugar",
        gradient: "from-indigo-500 to-indigo-600",
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
      },
      notificacoes: {
        title: "Notificações",
        subtitle: "Acompanhe todas as suas notificações e atualizações importantes",
        gradient: "from-purple-500 to-purple-600",
        image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
      },
      chats: {
        title: "Conversas",
        subtitle: "Acompanhe todas as suas conversas e mensagens",
        gradient: "from-green-500 to-green-600",
        image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
      },
      pacotes: {
        title: "Minhas Solicitações",
        subtitle: "Acompanhe o status das suas solicitações de pacotes personalizados", 
        gradient: "from-orange-500 to-orange-600",
        image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
      },
      recomendacoes: {
        title: "Recomendações Personalizadas",
        subtitle: "Descobra opções perfeitas para você",
        gradient: "from-purple-500 to-purple-600",
        image: "https://images.unsplash.com/photo-1614722860207-909e0e8dfd99?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3"
      }
    };
    
    return sectionData[section as keyof typeof sectionData] || sectionData.overview;
  };

  const sectionInfo = getSectionInfo(activeSection);

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <motion.div 
        key={activeSection}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('${sectionInfo.image}')`,
          }}
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-black/50" />
        <div className={`absolute inset-0 bg-gradient-to-r ${sectionInfo.gradient} opacity-40`} />
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute right-0 top-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl opacity-60" />
      <div className="absolute left-10 bottom-1/4 w-52 h-52 rounded-full bg-white/5 blur-3xl opacity-50" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 pt-16 pb-24 md:pb-16">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Greeting */}
          {activeSection === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-3 md:mb-4"
            >
              <p className="text-white/90 text-base md:text-lg">
                Olá, {user?.firstName || 'Viajante'}! 👋
              </p>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 text-shadow-lg leading-tight"
          >
            {sectionInfo.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/90 text-base md:text-lg lg:text-xl max-w-2xl mx-auto text-shadow-sm leading-relaxed px-4 md:px-0"
          >
            {sectionInfo.subtitle}
          </motion.p>

          {/* Stats Preview (apenas na overview) */}
          {activeSection === 'overview' && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto px-4 md:px-0"
            >
              {[
                { 
                  icon: Calendar, 
                  label: "Reservas", 
                  value: stats.activeReservations.toString(), 
                  color: "text-blue-200" 
                },
                { 
                  icon: Award, 
                  label: "Viagens", 
                  value: stats.completedTrips.toString(), 
                  color: "text-indigo-200" 
                },
                { 
                  icon: Star, 
                  label: "Total", 
                  value: stats.totalReservations.toString(), 
                  color: "text-amber-200" 
                },
                { 
                  icon: User, 
                  label: "Investido", 
                  value: `R$ ${stats.totalSpent.toLocaleString('pt-BR')}`, 
                  color: "text-green-200" 
                }
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-white font-bold text-lg md:text-xl">{stat.value}</div>
                  <div className="text-white/70 text-xs md:text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}
          
          {/* Loading Stats */}
          {activeSection === 'overview' && !stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto px-4 md:px-0"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
                  <div className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 bg-white/20 rounded animate-pulse" />
                  <div className="bg-white/20 h-5 md:h-6 rounded mb-1 animate-pulse" />
                  <div className="bg-white/10 h-3 md:h-4 rounded animate-pulse" />
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <ProfileHeroNavigation 
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </div>
    </section>
  );
};

export default ProfileHeroSection; 