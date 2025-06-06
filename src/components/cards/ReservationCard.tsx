import React from 'react'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Users, 
  BedDouble, 
  Utensils, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock3
} from "lucide-react"

import {
  Card,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'

// Variantes para animações
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
}

// Tipo para a propriedade reservation
export type Reservation = {
  id: string
  type: 'restaurant' | 'accommodation' | 'activity'
  name: string
  date?: Date
  checkIn?: Date
  checkOut?: Date
  guests: number
  status: 'confirmed' | 'pending' | 'cancelled'
  location: string
  imageUrl: string
  price: number
  confirmationCode: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>
}

interface ReservationCardProps {
  reservation: Reservation
  onClick: () => void 
}

export default function ReservationCard({ reservation, onClick }: ReservationCardProps) {
  const isRestaurant = reservation.type === 'restaurant'
  const isAccommodation = reservation.type === 'accommodation'
  const isActivity = reservation.type === 'activity'
  
  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR })
  }
  
  // Determinar cores baseadas no status
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: CheckCircle2
        }
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          icon: Clock3
        }
      case 'cancelled':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: AlertTriangle
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: Clock
        }
    }
  }
  
  const statusColors = getStatusColors(reservation.status)
  const StatusIcon = statusColors.icon
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/4 h-40 md:h-auto bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <div className="absolute top-2 left-2 z-20">
              <Badge className={`px-2 py-1 font-medium ${
                isRestaurant ? 'bg-orange-100 text-orange-700 border-orange-200' :
                isAccommodation ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-green-100 text-green-700 border-green-200'
              }`}>
                {isRestaurant && (
                  <>
                    <Utensils className="mr-1 h-3 w-3" />
                    Restaurante
                  </>
                )}
                {isAccommodation && (
                  <>
                    <BedDouble className="mr-1 h-3 w-3" />
                    Hospedagem
                  </>
                )}
                {isActivity && (
                  <>
                    <Activity className="mr-1 h-3 w-3" />
                    Atividade
                  </>
                )}
              </Badge>
            </div>
            {reservation.imageUrl && reservation.imageUrl.trim() !== '' ? (
              <Image 
                src={reservation.imageUrl} 
                alt={reservation.name} 
                fill
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gray-300 flex items-center justify-center">
                {isRestaurant && <Utensils className="h-12 w-12 text-gray-500" />}
                {isAccommodation && <BedDouble className="h-12 w-12 text-gray-500" />}
                {isActivity && <Activity className="h-12 w-12 text-gray-500" />}
              </div>
            )}
          </div>
          
          <div className="p-5 md:p-6 md:w-3/4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <h3 className="text-lg font-semibold">{reservation.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{reservation.location}</span>
                </div>
              </div>
              
              <Badge 
                className={`${statusColors.bg} ${statusColors.text} ${statusColors.border} px-2.5 py-1 font-medium flex items-center`}
              >
                <StatusIcon className="mr-1 h-3.5 w-3.5" />
                {reservation.status === 'confirmed' ? 'Confirmada' : 
                 reservation.status === 'pending' ? 'Pendente' : 'Cancelada'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              {isRestaurant && reservation.date && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                  {formatDate(reservation.date)}
                </div>
              )}
              
              {isAccommodation && reservation.checkIn && reservation.checkOut && (
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                    Check-in: {format(reservation.checkIn, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                    Check-out: {format(reservation.checkOut, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              )}
              
              {isActivity && reservation.date && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                  {formatDate(reservation.date)}
                </div>
              )}
              
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                {reservation.guests} {reservation.guests === 1 ? 'Pessoa' : 'Pessoas'}
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                {isRestaurant && 'Horário reservado'}
                {isAccommodation && '5 noites'}
                {isActivity && reservation.details.duration}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">Valor total</span>
                <p className="font-semibold text-lg">R$ {reservation.price.toFixed(2).replace('.', ',')}</p>
              </div>
              
              <Button 
                onClick={onClick} 
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}