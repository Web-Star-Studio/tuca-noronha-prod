'use client'

import { useState, useEffect, use } from 'react';
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Clock, 
  MapPin, 
  BedDouble, 
  Utensils, 
  Activity, 
  ArrowLeft,
  Download,
  Share2,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Reservation } from "@/components/cards/ReservationCard"
import Image from 'next/image'

// Dados de exemplo para as reservas (eventualmente virá de uma API ou banco de dados)
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

export default function ReservationDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reservation, setReservation] = useState<Reservation | null>(null)

  useEffect(() => {
    // Simulando uma chamada para API com um pequeno delay
    const fetchReservation = async () => {
      setLoading(true)
      try {
        // Aqui seria uma chamada para API real
        // const response = await fetch(`/api/reservations/${params.id}`)
        // const data = await response.json()
        
        // Por enquanto, usamos dados mockados
        const foundReservation = mockReservations.find(r => r.id === params.id)
        
        // Breve pausa para simular carregamento da rede
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (foundReservation) {
          setReservation(foundReservation as Reservation)
        } else {
          // Reserva não encontrada
          router.push('/reservas')
        }
      } catch (error) {
        console.error('Erro ao buscar reserva:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchReservation()
  }, [params.id, router])

  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando detalhes da reserva...</h2>
          <div className="animate-pulse mt-4 space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="container mx-auto py-10 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Reserva não encontrada</h2>
          <Button onClick={handleGoBack}>Voltar para Reservas</Button>
        </div>
      </div>
    )
  }

  const isRestaurant = reservation.type === 'restaurant'
  const isAccommodation = reservation.type === 'accommodation'
  const isActivity = reservation.type === 'activity'

  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy', às' HH:mm", { locale: ptBR })
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
    <div className="container mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="space-y-6"
      >
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleGoBack}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold flex-1">Detalhes da Reserva</h1>
        </div>
        
        <Card className="overflow-hidden border-gray-100 shadow-md bg-white">
          <div className="relative h-48 md:h-64 bg-gray-100">
            <Image 
              src={reservation.imageUrl} 
              alt={reservation.name} 
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent/30" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center justify-between">
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
                <Badge 
                  className={`${statusColors.bg} ${statusColors.text} ${statusColors.border} px-2.5 py-1 font-medium flex items-center`}
                >
                  <StatusIcon className="mr-1 h-3.5 w-3.5" />
                  {reservation.status === 'confirmed' ? 'Confirmada' : 
                  reservation.status === 'pending' ? 'Pendente' : 'Cancelada'}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold mt-2">{reservation.name}</h2>
              <div className="flex items-center text-sm mt-1">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>{reservation.location}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Informações da Reserva</h3>
                  <Separator className="my-2" />
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Código de Confirmação:</span>
                      <span className="font-semibold">{reservation.confirmationCode}</span>
                    </div>
                    
                    {isRestaurant && reservation.date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Data e Hora:</span>
                        <span>{formatDate(reservation.date)}</span>
                      </div>
                    )}
                    
                    {isAccommodation && reservation.checkIn && reservation.checkOut && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Check-in:</span>
                          <span>{format(reservation.checkIn, "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Check-out:</span>
                          <span>{format(reservation.checkOut, "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duração:</span>
                          <span>5 noites</span>
                        </div>
                      </>
                    )}
                    
                    {isActivity && reservation.date && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Data e Hora:</span>
                          <span>{formatDate(reservation.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duração:</span>
                          <span>{reservation.details.duration}</span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantidade de Pessoas:</span>
                      <span>{reservation.guests}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor Total:</span>
                      <span className="font-semibold">R$ {reservation.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Detalhes</h3>
                  <Separator className="my-2" />
                  
                  <div className="space-y-3 text-sm">
                    {isRestaurant && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo de Mesa:</span>
                          <span>{reservation.details.tableType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Menu:</span>
                          <span>{reservation.details.menu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pedidos Especiais:</span>
                          <span>{reservation.details.specialRequests}</span>
                        </div>
                      </>
                    )}
                    
                    {isAccommodation && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo de Quarto:</span>
                          <span>{reservation.details.roomType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo de Cama:</span>
                          <span>{reservation.details.bedType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Comodidades:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {reservation.details.amenities.map((amenity: string) => (
                              <Badge key={amenity} variant="outline" className="bg-gray-50">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {isActivity && (
                      <>
                        {reservation.details.meetingPoint && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Ponto de Encontro:</span>
                            <span>{reservation.details.meetingPoint}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Itens Inclusos:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {reservation.details.includedItems.map((item: string) => (
                              <Badge key={item} variant="outline" className="bg-gray-50">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <span className="text-gray-500">Política de Cancelamento:</span>
                      <p className="text-sm mt-1">{reservation.details.cancellationPolicy}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Ações</h3>
                    <Link href={`/reservas/${reservation.id}/edit`} passHref>
                      <Button variant="outline" className="bg-white border-gray-200 shadow-sm hover:bg-gray-50">
                        Alterar Reserva
                      </Button>
                    </Link>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Button variant="outline" className="flex items-center justify-center gap-2 bg-white text-gray-700 border-gray-200 shadow-sm hover:bg-gray-50">
                      <Download size={16} />
                      <span>Voucher</span>
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center gap-2 bg-white text-gray-700 border-gray-200 shadow-sm hover:bg-gray-50">
                      <Share2 size={16} />
                      <span>Compartilhar</span>
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center gap-2 bg-white text-gray-700 border-gray-200 shadow-sm hover:bg-gray-50">
                      <MessageCircle size={16} />
                      <span>Contato</span>
                    </Button>
                    
                    {reservation.status !== 'cancelled' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex items-center justify-center gap-2 bg-white text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200">
                            <AlertTriangle size={16} />
                            <span>Cancelar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancelar Reserva</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-md mt-2">
                            <p className="text-sm text-yellow-700">
                              <strong>Política de Cancelamento:</strong> {reservation.details.cancellationPolicy}
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline">Voltar</Button>
                            <Button variant="destructive">Confirmar Cancelamento</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                
                <Card className="bg-blue-50 border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-blue-700">Dicas</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-blue-600 space-y-2">
                    {isRestaurant && (
                      <p>Recomendamos chegar com 10 minutos de antecedência para garantir sua mesa.</p>
                    )}
                    {isAccommodation && (
                      <p>O check-in está disponível a partir das 14h e o check-out deve ser feito até as 12h.</p>
                    )}
                    {isActivity && (
                      <p>Leve protetor solar, água e roupas confortáveis para aproveitar ao máximo sua experiência.</p>
                    )}
                    <p>Em caso de dúvidas, entre em contato com nosso suporte através do WhatsApp.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}