'use client'

import { useState } from 'react'
import { useUser } from "@clerk/nextjs"
import { 
  Search, 
  X, 
  SlidersHorizontal 
} from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import ReservationCard, { Reservation } from "@/components/cards/ReservationCard"

// Dados de exemplo para as reservas
const mockReservations = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Sol & Mar Noronha',
    date: new Date(2024, 7, 15, 19, 30),
    guests: 2,
    status: 'confirmed',
    location: 'Vila dos Remédios, Fernando de Noronha',
    imageUrl: '/images/restaurant-1.jpg',
    price: 450,
    confirmationCode: 'RES-24071530',
    details: {
      tableType: 'Vista para o mar',
      menu: 'À la carte',
      specialRequests: 'Mesa em área externa',
      cancellationPolicy: 'Gratuita até 24h antes',
    }
  },
  {
    id: '2',
    type: 'accommodation',
    name: 'Pousada Mar Azul',
    checkIn: new Date(2024, 7, 20),
    checkOut: new Date(2024, 7, 25),
    guests: 2,
    status: 'confirmed',
    location: 'Praia do Sueste, Fernando de Noronha',
    imageUrl: '/images/accommodation-1.jpg',
    price: 3750,
    confirmationCode: 'ACC-24072025',
    details: {
      roomType: 'Suíte com Vista para o Mar',
      bedType: 'Cama King',
      amenities: ['Wi-Fi', 'Ar-condicionado', 'Café da manhã', 'Piscina'],
      cancellationPolicy: 'Gratuita até 7 dias antes',
    }
  },
  {
    id: '3',
    type: 'activity',
    name: 'Passeio de Barco - Baía dos Golfinhos',
    date: new Date(2024, 7, 22, 10, 0),
    guests: 2,
    status: 'confirmed',
    location: 'Baía dos Golfinhos, Fernando de Noronha',
    imageUrl: '/images/activity-1.jpg',
    price: 320,
    confirmationCode: 'ACT-24072210',
    details: {
      duration: '3 horas',
      includedItems: ['Equipamento de snorkel', 'Bebidas', 'Guia local'],
      meetingPoint: 'Porto de Santo Antônio',
      cancellationPolicy: 'Gratuita até 48h antes',
    }
  },
  {
    id: '4',
    type: 'restaurant',
    name: 'Cantinho do Sabor',
    date: new Date(2024, 8, 5, 20, 0),
    guests: 4,
    status: 'pending',
    location: 'Vila dos Remédios, Fernando de Noronha',
    imageUrl: '/images/restaurant-2.jpg',
    price: 620,
    confirmationCode: 'RES-24080520',
    details: {
      tableType: 'Interna',
      menu: 'Degustação',
      specialRequests: 'Aniversário',
      cancellationPolicy: 'Gratuita até 24h antes',
    }
  },
  {
    id: '5',
    type: 'activity',
    name: 'Mergulho nas Ilhas Rasas',
    date: new Date(2024, 8, 7, 9, 0),
    guests: 2,
    status: 'cancelled',
    location: 'Ilhas Rasas, Fernando de Noronha',
    imageUrl: '/images/activity-2.jpg',
    price: 450,
    confirmationCode: 'ACT-24080709',
    details: {
      duration: '4 horas',
      includedItems: ['Equipamento completo', 'Instrutor', 'Lanche'],
      meetingPoint: 'Centro de Mergulho Noronha',
      cancellationPolicy: 'Gratuita até 72h antes',
    }
  }
]

// Variantes para animações
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

// Hook para media queries
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useState(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query)
      setMatches(media.matches)

      const listener = () => setMatches(media.matches)
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    }
  })

  return matches
}

// Página principal
export default function ReservasPage() {
  const { user } = useUser()
  const router = useRouter()
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")
  
  // Filtrar reservas
  const filteredReservations = mockReservations.filter(reservation => {
    if (filters.type !== 'all' && reservation.type !== filters.type) {
      return false
    }
    
    if (filters.status !== 'all' && reservation.status !== filters.status) {
      return false
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return reservation.name.toLowerCase().includes(searchLower) || 
             reservation.location.toLowerCase().includes(searchLower)
    }
    
    return true
  })
  
  // Navegar para a página de detalhes
  const handleViewDetails = (id: string) => {
    router.push(`/reservas/${id}`)
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Minhas Reservas
        </h1>
        <p className="text-gray-500 mt-2">
          Gerencie todas as suas reservas em um só lugar
        </p>
      </div>
      
      {/* Filtros */}
      <div className="mb-6">
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm mb-6"
        >
          <div className="flex flex-1 items-center gap-4 flex-wrap">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar reservas..."
                className="pl-9 h-10 bg-white border-gray-200 shadow-sm"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  search: e.target.value
                }))}
              />
              {filters.search && (
                <button
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {isMobile ? (
              <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 bg-white border-gray-200 shadow-sm hover:bg-gray-50">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="text-left">
                    <DrawerTitle>Filtros</DrawerTitle>
                    <DrawerDescription>
                      Filtre suas reservas por tipo ou status.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select 
                        value={filters.type} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm">
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-md">
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          <SelectItem value="restaurant">Restaurantes</SelectItem>
                          <SelectItem value="accommodation">Hospedagens</SelectItem>
                          <SelectItem value="activity">Atividades</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select 
                        value={filters.status} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm">
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-md">
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="confirmed">Confirmadas</SelectItem>
                          <SelectItem value="pending">Pendentes</SelectItem>
                          <SelectItem value="cancelled">Canceladas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DrawerFooter className="pt-2">
                    <Button 
                      variant="outline" 
                      className="bg-white border-gray-200 shadow-sm hover:bg-gray-50"
                      onClick={() => setFilters({ type: 'all', status: 'all', search: '' })}
                    >
                      Limpar Filtros
                    </Button>
                    <DrawerClose asChild>
                      <Button>Aplicar</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ) : (
              <div className="flex items-center gap-2">
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-[160px] h-10 bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-md">
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="restaurant">Restaurantes</SelectItem>
                    <SelectItem value="accommodation">Hospedagens</SelectItem>
                    <SelectItem value="activity">Atividades</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[160px] h-10 bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-md">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="confirmed">Confirmadas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
                
                {(filters.type !== 'all' || filters.status !== 'all' || filters.search) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white border-gray-200 shadow-sm hover:bg-gray-50"
                    onClick={() => setFilters({ type: 'all', status: 'all', search: '' })}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Lista de reservas */}
      {filteredReservations.length === 0 ? (
        <Card className="bg-white shadow-md">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Você ainda não possui reservas</p>
            <Button className="mt-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-300" asChild>
              <a href="/">Explorar Opções</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation as Reservation}
              onClick={() => handleViewDetails(reservation.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}