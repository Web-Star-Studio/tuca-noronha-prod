"use client";

import React from 'react';
import { motion } from "framer-motion";
import { Calendar, Award, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsOverviewCardProps {
  stats?: {
    totalReservations: number;
    activeReservations: number;
    totalSpent: number;
    favoriteLocations: string[];
    completedTrips: number;
  };
}

const StatsOverviewCard: React.FC<StatsOverviewCardProps> = ({ stats }) => {
  if (!stats) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Suas Estatísticas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 mx-auto mb-3 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsData = [
    { 
      icon: Calendar, 
      label: "Reservas Ativas", 
      value: stats.activeReservations.toString(), 
      bgColor: "bg-blue-100",
      textColor: "text-blue-600"
    },
    { 
      icon: Award, 
      label: "Viagens Completas", 
      value: stats.completedTrips.toString(), 
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600"
    },
    { 
      icon: Star, 
      label: "Total de Reservas", 
      value: stats.totalReservations.toString(), 
      bgColor: "bg-amber-100",
      textColor: "text-amber-600"
    },
    { 
      icon: TrendingUp, 
      label: "Total Investido", 
      value: `R$ ${stats.totalSpent.toLocaleString('pt-BR')}`, 
      bgColor: "bg-green-100",
      textColor: "text-green-600"
    }
  ];

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Suas Estatísticas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow duration-200"
            >
              <div className={`w-10 h-10 mx-auto mb-3 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsOverviewCard; 