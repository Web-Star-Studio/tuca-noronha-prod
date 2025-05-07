'use client'

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { CalendarDays, Clock, Mail, MapPin, Users, User, ListChecks, BedDouble, Utensils, Activity, Bell, Star, CreditCard, Award, Sparkles, BookCheckIcon, Gift, HomeIcon, CheckCircle2, Heart, Search, X, SlidersHorizontal, WhatsappIcon, HelpCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import PersonalizationForm from "@/components/profile/PersonalizationForm"

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
  }
]

// Dados de exemplo para notificações
const mockNotifications = [
  {
    id: '1',
    title: 'Reserva confirmada',
    description: 'Sua reserva no restaurante Sol & Mar Noronha foi confirmada.',
    date: new Date(2025, 4, 5, 10, 30),
    read: false,
    type: 'success'
  },
  {
    id: '2',
    title: 'Pontos adicionados',
    description: 'Você recebeu 500 pontos pela sua última reserva.',
    date: new Date(2025, 4, 5, 9, 15),
    read: true,
    type: 'info'
  },
  {
    id: '3',
    title: 'Oferta especial',
    description: 'Você recebeu um desconto especial de 10% na sua próxima reserva.',
    date: new Date(2025, 4, 4, 14, 25),
    read: true,
    type: 'promotion'
  },
  {
    id: '4',
    title: 'Bem-vindo ao programa de fidelidade',
    description: 'Você agora faz parte do nosso programa de fidelidade e pode acumular pontos.',
    date: new Date(2025, 4, 1, 12, 0),
    read: true,
    type: 'info'
  }
]

// Dados de exemplo para recomendações
const mockRecommendations = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Mergulho Gastronômico',
    description: 'Restaurante de frutos do mar com vista para o mar, perfeito para casais.',
    imageUrl: '/images/restaurant-2.jpg',
    rating: 4.9,
    tags: ['Frutos do Mar', 'Vista para o Mar', 'Romântico']
  },
  {
    id: '2',
    type: 'accommodation',
    name: 'Pousada Horizonte Azul',
    description: 'Pousada com vista panorâmica para o oceano, com café da manhã incluso.',
    imageUrl: '/images/accommodation-2.jpg',
    rating: 4.8,
    tags: ['Vista para o Mar', 'Café da Manhã', 'Piscina']
  },
  {
    id: '3',
    type: 'activity',
    name: 'Mergulho em Águas Cristalinas',
    description: 'Explore a vida marinha em um dos melhores pontos de mergulho da ilha.',
    imageUrl: '/images/activity-2.jpg',
    rating: 4.7,
    tags: ['Aventura', 'Mergulho', 'Natureza']
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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
}

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.3 } }
}

// Componente para o card de estatísticas
const StatCard = ({ icon: Icon, title, value, color, bgColor, children }: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}) => {
  return (
    <motion.div 
      className={`rounded-lg shadow-md ${bgColor} p-4 flex flex-col`}
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase">{title}</span>
      </div>
      <div className="flex flex-col space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {children}
      </div>
    </motion.div>
  )
}

// Componente para notificação
const NotificationItem = ({ notification, onClick }: {
  notification: {
    id: string;
    title: string;
    description: string;
    date: Date;
    read: boolean;
    type: 'success' | 'info' | 'promotion';
  };
  onClick?: () => void;
}) => {
  const { title, description, date, read, type } = notification
  
  const getIconByType = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'promotion':
        return <Gift className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }
  
  return (
    <motion.div 
      className={`p-3 border-b border-gray-100 ${!read ? 'bg-blue-50' : ''}`}
      whileHover={{ backgroundColor: '#F0F9FF' }}
      onClick={onClick}
    >
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          {getIconByType()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {title}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Componente para card de recomendação
const RecommendationCard = ({ item }: {
  item: {
    id: string;
    type: string;
    name: string;
    description: string;
    imageUrl: string;
    rating: number;
    tags: string[];
  };
}) => {
  const { type, name, description, rating, tags } = item
  
  const getIconByType = () => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="h-5 w-5" />
      case 'accommodation':
        return <HomeIcon className="h-5 w-5" />
      case 'activity':
        return <Activity className="h-5 w-5" />
      default:
        return <Star className="h-5 w-5" />
    }
  }
  
  const getTypeLabel = () => {
    switch (type) {
      case 'restaurant':
        return 'Restaurante'
      case 'accommodation':
        return 'Hospedagem'
      case 'activity':
        return 'Atividade'
      default:
        return 'Recomendação'
    }
  }
  
  const getBgColor = () => {
    switch (type) {
      case 'restaurant':
        return 'bg-orange-100'
      case 'accommodation':
        return 'bg-blue-100'
      case 'activity':
        return 'bg-green-100'
      default:
        return 'bg-purple-100'
    }
  }
  
  const getTextColor = () => {
    switch (type) {
      case 'restaurant':
        return 'text-orange-700'
      case 'accommodation':
        return 'text-blue-700'
      case 'activity':
        return 'text-green-700'
      default:
        return 'text-purple-700'
    }
  }
  
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full"
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-40 bg-gray-100 relative">
        <div className="absolute top-2 left-2">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getBgColor()} ${getTextColor()} text-xs font-medium`}>
            {getIconByType()}
            <span>{getTypeLabel()}</span>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-white text-yellow-500 text-xs font-medium shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            <span>{rating}</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-3 flex-1">{description}</p>
        <div className="flex flex-wrap gap-1 mt-auto">
          {tags.map((tag, idx) => (
            <div key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              {tag}
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-gray-100 flex justify-between items-center">
        <button className="text-sm text-blue-600 flex items-center space-x-1 hover:text-blue-800">
          <span>Ver detalhes</span>
        </button>
        <button className="text-sm text-gray-500 flex items-center space-x-1 hover:text-gray-700">
          <Heart className="h-4 w-4" />
          <span>Salvar</span>
        </button>
      </div>
    </motion.div>
  )
}

// Hook para detectar media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Componente para o botão flutuante de suporte
const FloatingSupportButton = () => {
  const [open, setOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button 
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center" 
              aria-label="Abrir suporte"
            >
              <HelpCircle className="h-6 w-6 text-white" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Como podemos ajudar?</DrawerTitle>
              <DrawerDescription>
                Escolha uma das opções abaixo para entrar em contato conosco.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <Button 
                className="w-full justify-start bg-green-500 hover:bg-green-600" 
                onClick={() => window.open('https://wa.me/5581999999999', '_blank')}
              >
                <WhatsappIcon className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
              <Button 
                className="w-full justify-start" 
                onClick={() => window.open('mailto:suporte@webstar.com.br')}
              >
                <Mail className="mr-2 h-5 w-5" />
                E-mail
              </Button>
              <form className="space-y-3">
                <textarea 
                  className="w-full min-h-24 rounded-md border border-gray-200 p-3 text-sm"
                  placeholder="Ou descreva seu problema aqui..."
                />
                <Button type="submit" className="w-full">
                  Enviar Mensagem
                </Button>
              </form>
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center" 
              aria-label="Abrir suporte"
            >
              <HelpCircle className="h-6 w-6 text-white" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Como podemos ajudar?</DialogTitle>
              <DialogDescription>
                Escolha uma das opções abaixo para entrar em contato conosco.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button 
                className="justify-start bg-green-500 hover:bg-green-600" 
                onClick={() => window.open('https://wa.me/5581999999999', '_blank')}
              >
                <WhatsappIcon className="mr-2 h-5 w-5" />
                Contato via WhatsApp
              </Button>
              <Button 
                className="justify-start" 
                onClick={() => window.open('mailto:suporte@webstar.com.br')}
              >
                <Mail className="mr-2 h-5 w-5" />
                Contato via E-mail
              </Button>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Ou envie uma mensagem:</h3>
                <textarea 
                  className="w-full min-h-24 rounded-md border border-gray-200 p-3 text-sm"
                  placeholder="Descreva seu problema..."
                />
                <Button type="submit">
                  Enviar Mensagem
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useUser()
  const [profileTab, setProfileTab] = useState('reservas')
  const [viewAllNotifications, setViewAllNotifications] = useState(false)
  const [reservationFilters, setReservationFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  interface PreferencesType {
    cuisines: string[];
    accommodations: string[];
    activities: string[];
    travelStyles: string[];
    budget: string;
    specialRequests: string;
    [key: string]: string | string[];
  }
  
  const [preferences, setPreferences] = useState<PreferencesType>({
    cuisines: [],
    accommodations: [],
    activities: [],
    travelStyles: [],
    budget: 'medio',
    specialRequests: '',
  })
  // Efeito para animação inicial
  useEffect(() => {
    // Animação configurada via framer-motion
    // Sem necessidade de carregamento de dados nesse momento
  }, [])

  const handleSavePreferences = (updatedPreferences: PreferencesType) => {
    // Aqui seria feita a chamada à API para salvar as preferências
    setPreferences(updatedPreferences)
    toast.success("Preferências salvas com sucesso!", {
      description: "Suas recomendações serão personalizadas de acordo com suas preferências."
    })
  }

  // Filtrando as reservas baseado nos filtros selecionados
  const filteredReservations = mockReservations.filter(reservation => {
    // Filtro por tipo
    if (reservationFilters.type !== 'all' && reservation.type !== reservationFilters.type) {
      return false
    }
    
    // Filtro por status
    if (reservationFilters.status !== 'all' && reservation.status !== reservationFilters.status) {
      return false
    }
    
    // Filtro por busca
    if (reservationFilters.search) {
      const searchLower = reservationFilters.search.toLowerCase()
      return (
        reservation.name.toLowerCase().includes(searchLower) ||
        reservation.location.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const formatDateTime = (date: Date) => {
    return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
  }

  // Calcular número de notificações não lidas
  const unreadNotificationsCount = mockNotifications.filter(n => !n.read).length
  
  // Obter notificações para exibição (limitadas a 3 ou todas, dependendo do estado)
  const notificationsToDisplay = viewAllNotifications 
    ? mockNotifications 
    : mockNotifications.slice(0, 3)
    
  return (
    <div className="container py-10 px-4 md:px-6 max-w-7xl">
      <motion.header 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">Painel</h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo de volta, <span className="font-medium text-blue-600">{user?.firstName || 'Visitante'}</span>
        </p>
      </motion.header>
      
      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={BookCheckIcon} 
          title="Reservas Ativas" 
          value={mockReservations.length} 
          color="bg-blue-600" 
          bgColor="bg-white"
        >
          <p className="text-xs text-gray-500">Suas próximas reservas</p>
        </StatCard>
        
        <StatCard 
          icon={Award} 
          title="Pontos Acumulados" 
          value="1.500" 
          color="bg-purple-600" 
          bgColor="bg-white"
        >
          <p className="text-xs text-gray-500">No programa de fidelidade</p>
        </StatCard>
        
        <StatCard 
          icon={CreditCard} 
          title="Valor Economizado" 
          value="R$ 350,00" 
          color="bg-green-600" 
          bgColor="bg-white"
        >
          <p className="text-xs text-gray-500">Com descontos e promoções</p>
        </StatCard>
        
        <StatCard 
          icon={Sparkles} 
          title="Status" 
          value="Silver" 
          color="bg-amber-600" 
          bgColor="bg-white"
        >
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">500 pts para Gold</p>
        </StatCard>
      </div>

      {/* Conteúdo principal com seção lateral */}
      <div className="flex flex-col lg:flex-row gap-6 pb-24"> {/* Adicionado padding-bottom para dar espaço ao botão flutuante */}
        {/* Conteúdo principal */}
        <motion.div 
          className="flex-1 rounded-xl overflow-hidden shadow-md" 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
        <Tabs defaultValue="reservas" onValueChange={setProfileTab}>
          <TabsList className="text-white bg-gradient-to-r from-blue-600 to-blue-500 p-1.5 w-full overflow-x-auto flex-nowrap md:flex-wrap scrollbar-hide">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 rounded-md"
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="reservas" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 rounded-md"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Minhas Reservas
            </TabsTrigger>

            <TabsTrigger 
              value="perfil" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 rounded-md"
            >
              <User className="mr-2 h-4 w-4" />
              Personalização
            </TabsTrigger>
            <TabsTrigger 
              value="recomendacoes" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 rounded-md"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Recomendações
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {profileTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabVariants}
                className="p-4 bg-gradient-to-b from-white to-gray-50"
              >
                <div className="grid gap-6">
                  <motion.div 
                    className="flex justify-between items-center"
                    variants={itemVariants}
                  >
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <HomeIcon className="mr-2 h-5 w-5 text-blue-600" />
                      Resumo da sua conta
                    </h2>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/95 backdrop-blur-sm shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <Award className="h-5 w-5 text-purple-500 mr-2" />
                          Programa de Fidelidade
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <p className="text-gray-500 text-sm">Seu nível atual</p>
                              <p className="text-2xl font-bold text-amber-600">Silver</p>
                            </div>
                            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                              <Award className="h-8 w-8 text-amber-600" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Pontos acumulados</span>
                              <span className="font-semibold">1.500 pts</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>1.000 pts</span>
                              <span>2.000 pts (Gold)</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium mb-2">Vantagens do próximo nível:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li className="flex items-center">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mr-2" />
                                Check-in prioritário
                              </li>
                              <li className="flex items-center">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mr-2" />
                                10% de desconto em reservas
                              </li>
                              <li className="flex items-center">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mr-2" />
                                Late check-out gratuito
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/95 backdrop-blur-sm shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <Activity className="h-5 w-5 text-blue-500 mr-2" />
                          Atividade Recente
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockNotifications.slice(0, 4).map(notification => (
                            <div key={notification.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                              {notification.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />}
                              {notification.type === 'info' && <Bell className="h-5 w-5 text-blue-500 mt-0.5" />}
                              {notification.type === 'promotion' && <Gift className="h-5 w-5 text-purple-500 mt-0.5" />}
                              <div>
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-xs text-gray-500">{notification.description}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {format(notification.date, "dd/MM/yyyy")}  
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                          Ver todas atividades
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
            {profileTab === "reservas" && (
              <motion.div
                key="reservas"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabVariants}
                className="p-4 bg-gradient-to-b from-white to-gray-50"
              >
          <div className="grid gap-6">
            <motion.div 
              className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              variants={itemVariants}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <ListChecks className="mr-2 h-5 w-5 text-blue-600" />
                  Suas Reservas
                </h2>
                <Badge variant="outline" className="px-3 py-1 bg-blue-50 border-blue-100 text-blue-700 font-semibold shadow-sm">
                  {filteredReservations.length} Reservas
                </Badge>
              </div>
              
              {/* Controles de filtro */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar reservas..."
                    className="pl-9 h-10 bg-white"
                    value={reservationFilters.search}
                    onChange={(e) => setReservationFilters(prev => ({
                      ...prev,
                      search: e.target.value
                    }))}
                  />
                  {reservationFilters.search && (
                    <button
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setReservationFilters(prev => ({ ...prev, search: '' }))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {isMobile ? (
                  <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
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
                            value={reservationFilters.type} 
                            onValueChange={(value) => setReservationFilters(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione um tipo" />
                            </SelectTrigger>
                            <SelectContent>
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
                            value={reservationFilters.status} 
                            onValueChange={(value) => setReservationFilters(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione um status" />
                            </SelectTrigger>
                            <SelectContent>
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
                          onClick={() => setReservationFilters({ type: 'all', status: 'all', search: '' })}
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
                      value={reservationFilters.type} 
                      onValueChange={(value) => setReservationFilters(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="restaurant">Restaurantes</SelectItem>
                        <SelectItem value="accommodation">Hospedagens</SelectItem>
                        <SelectItem value="activity">Atividades</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={reservationFilters.status} 
                      onValueChange={(value) => setReservationFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="confirmed">Confirmadas</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="cancelled">Canceladas</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {(reservationFilters.type !== 'all' || reservationFilters.status !== 'all' || reservationFilters.search) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReservationFilters({ type: 'all', status: 'all', search: '' })}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {filteredReservations.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm shadow-md">
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
                {filteredReservations.map((reservation, index) => {
                  const isRestaurant = reservation.type === 'restaurant'
                  const isAccommodation = reservation.type === 'accommodation'
                  const isActivity = reservation.type === 'activity'

                  return (
                    <motion.div key={reservation.id} variants={itemVariants} custom={index}>
                      <Card className="overflow-hidden border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 bg-white/95 backdrop-blur-sm">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 h-40 md:h-auto bg-gray-100 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                          <div className="absolute top-2 left-2">
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
                        </div>
                        <div className="p-5 md:p-6 md:w-3/4 space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{reservation.name}</h3>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{reservation.location}</span>
                            </div>
                          </div>
                          
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                            {isRestaurant && (
                              <>
                                <div className="flex items-center">
                                  <CalendarDays className="h-4 w-4 text-blue-600 mr-2" />
                                  <div className="text-sm">
                                    <p className="text-gray-500">Data</p>
                                    <p className="font-medium text-gray-900">{reservation.date && formatDate(reservation.date)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 text-blue-600 mr-2" />
                                  <div className="text-sm">
                                    <p className="text-gray-500">Horário</p>
                                    <p className="font-medium text-gray-900">{reservation.date && format(reservation.date, 'HH:mm')}</p>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {isAccommodation && (
                              <>
                                <div className="flex items-center">
                                  <CalendarDays className="h-4 w-4 text-blue-600 mr-2" />
                                  <div className="text-sm">
                                    <p className="text-gray-500">Check-in</p>
                                    <p className="font-medium text-gray-900">{reservation.checkIn && formatDate(reservation.checkIn)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <CalendarDays className="h-4 w-4 text-blue-600 mr-2" />
                                  <div className="text-sm">
                                    <p className="text-gray-500">Check-out</p>
                                    <p className="font-medium text-gray-900">{reservation.checkOut && formatDate(reservation.checkOut)}</p>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {isActivity && (
                              <div className="flex items-center">
                                <CalendarDays className="h-4 w-4 text-blue-600 mr-2" />
                                <div className="text-sm">
                                  <p className="text-gray-500">Data</p>
                                  <p className="font-medium text-gray-900">{reservation.date && formatDateTime(reservation.date)}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-blue-600 mr-2" />
                              <div className="text-sm">
                                <p className="text-gray-500">Pessoas</p>
                                <p className="font-medium text-gray-900">{reservation.guests}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2 flex justify-between items-center">
                            <Badge variant={reservation.status === 'confirmed' ? 'outline' : 'secondary'} className={`
                              px-2 py-1 
                              ${reservation.status === 'confirmed' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-yellow-50 text-yellow-700 border-yellow-100'}
                            `}>
                              {reservation.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                            </Badge>
                            
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="border-gray-200">
                                Detalhes
                              </Button>
                              {reservation.status === 'confirmed' && (
                                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
              </motion.div>
            )}
            

            
            {profileTab === "perfil" && (
              <motion.div
                key="perfil"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabVariants}
                className="p-4 bg-gradient-to-b from-white to-gray-50"
              >
                <PersonalizationForm 
                  initialPreferences={preferences} 
                  onSave={handleSavePreferences} 
                />
              </motion.div>
            )}
            
            {profileTab === "recomendacoes" && (
              <motion.div
                key="recomendacoes"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabVariants}
                className="p-4 bg-gradient-to-b from-white to-gray-50"
              >
                <div className="grid gap-6">
                  <motion.div 
                    className="flex justify-between items-center"
                    variants={itemVariants}
                  >
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                      Recomendações para você
                    </h2>
                  </motion.div>
                  
                  <p className="text-sm text-gray-500">Baseadas nas suas preferências e histórico de reservas</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockRecommendations.map(item => (
                      <RecommendationCard key={item.id} item={item} />
                    ))}
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      Ver mais recomendações
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
        </motion.div>
        
        {/* Seção lateral - Notificações */}
        <motion.div 
          className="lg:w-80 rounded-xl overflow-hidden shadow-md bg-white"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-medium flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </h3>
              {unreadNotificationsCount > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadNotificationsCount} nova{unreadNotificationsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {notificationsToDisplay.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhuma notificação no momento
              </div>
            ) : (
              <>
                {notificationsToDisplay.map(notification => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                  />
                ))}
                
                <div className="p-3 flex justify-center">
                  <button 
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                    onClick={() => setViewAllNotifications(!viewAllNotifications)}
                  >
                    {viewAllNotifications ? 'Ver menos' : 'Ver todas as notificações'}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Botão flutuante de suporte */}
      <FloatingSupportButton />
    </div>
  )
}
