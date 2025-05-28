'use client'

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { CalendarDays, Clock, MapPin, Users, User, ListChecks, BedDouble, Utensils, Activity, Bell, Star, CreditCard, Award, Sparkles, BookCheckIcon, Gift, HomeIcon, CheckCircle2, Heart, Search, X, SlidersHorizontal, MessageCircle, HelpCircle, Plus, Circle, Eye, Info, Settings, Bookmark, LogOut } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { useConvexPreferences } from "@/lib/hooks/useConvexPreferences"
import type * as React from 'react'
import {
  Card,
  CardContent,
  CardFooter,
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
  DialogFooter,
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { Label } from '@/components/ui/label'
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cardStyles, badgeStyles, buttonStyles, transitionEffects, imageEffects, formStyles } from "@/lib/ui-config"
import { Textarea } from "@/components/ui/textarea"
import NoronhaTravelChatbot from "@/components/NoronhaTravelChatbot"
import PreferencesSection from "./PreferencesSection"
import { BookingManagementDashboard } from "@/components/bookings"

// Dados de exemplo para as reservas
const mockReservations = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Sol & Mar Noronha',
    date: new Date(2024, 7, 15, 19, 30), // Mês é 0-indexado, então 7 é Agosto
    guests: 2,
    status: 'confirmed',
    location: 'Vila dos Remédios, Fernando de Noronha',
    imageUrl: '/images/restaurant-1.jpg', // Placeholder image
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
    imageUrl: '/images/accommodation-1.jpg', // Placeholder image
  },
  {
    id: '3',
    type: 'activity',
    name: 'Passeio de Barco - Baía dos Golfinhos',
    date: new Date(2024, 7, 22, 10, 0),
    guests: 2,
    status: 'confirmed',
    location: 'Baía dos Golfinhos, Fernando de Noronha',
    imageUrl: '/images/activity-1.jpg', // Placeholder image
  }
];

// Dados de exemplo para notificações
type NotificationType = 'success' | 'info' | 'promotion';

interface Notification {
  id: string;
  title: string;
  description: string;
  date: Date;
  read: boolean;
  type: NotificationType;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Reserva confirmada',
    description: 'Sua reserva no restaurante Sol & Mar Noronha foi confirmada.',
    date: new Date(2025, 4, 5, 10, 30), // Mês é 0-indexado, então 4 é Maio
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
];

// Dados de exemplo para recomendações
const mockRecommendations = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Mergulho Gastronômico',
    description: 'Restaurante de frutos do mar com vista para o mar, perfeito para casais.',
    imageUrl: '/images/restaurant-2.jpg', // Placeholder image
    rating: 4.9,
    tags: ['Frutos do Mar', 'Vista para o Mar', 'Romântico'],
    isActive: true,
    isFeatured: false,
  },
  {
    id: '2',
    type: 'accommodation',
    name: 'Pousada Horizonte Azul',
    description: 'Pousada com vista panorâmica para o oceano, com café da manhã incluso.',
    imageUrl: '/images/accommodation-2.jpg', // Placeholder image
    rating: 4.8,
    tags: ['Vista para o Mar', 'Café da Manhã', 'Piscina'],
    isActive: true,
    isFeatured: true,
  },
  {
    id: '3',
    type: 'activity',
    name: 'Mergulho em Águas Cristalinas',
    description: 'Explore a vida marinha em um dos melhores pontos de mergulho da ilha.',
    imageUrl: '/images/activity-2.jpg', // Placeholder image
    rating: 4.7,
    tags: ['Aventura', 'Mergulho', 'Natureza'],
    isActive: false,
    isFeatured: false,
  }
];

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
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.3 } }
};

// ****** START: ADDED/MOVED HELPER FUNCTIONS AND INTERFACES ******
interface Reservation {
  id: string;
  type: string;
  name: string;
  date?: Date;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  status: string;
  location: string;
  imageUrl: string;
}

const getReservationIcon = (type: string) => {
  switch (type) {
    case 'restaurant':
      return <Utensils className="h-5 w-5 text-white" />;
    case 'accommodation':
      return <BedDouble className="h-5 w-5 text-white" />;
    case 'activity':
      return <Activity className="h-5 w-5 text-white" />;
    default:
      return <ListChecks className="h-5 w-5 text-white" />;
  }
};

const getReservationColor = (type: string) => {
  switch (type) {
    case 'restaurant':
      return 'bg-orange-500';
    case 'accommodation':
      return 'bg-blue-500';
    case 'activity':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendente';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Desconhecido';
  }
};

interface ReservationsSectionProps {
  reservations: Reservation[];
  getReservationIcon: (type: string) => React.ReactNode;
  getReservationColor: (type: string) => string;
  getStatusVariant: (status: string) => "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  getStatusLabel: (status: string) => string;
  onNewReservation: () => void;
  onViewDetails: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
}

const ReservationsSection: React.FC<ReservationsSectionProps> = ({
  reservations,
  getReservationIcon,
  getReservationColor,
  getStatusVariant,
  getStatusLabel,
  onNewReservation,
  onViewDetails,
  onCancelReservation
}) => {
  return (
    <motion.div
      className={`${cardStyles.content.default} space-y-6 p-4 sm:p-6 bg-white rounded-xl shadow-lg`} // Enhanced padding, bg, shadow, rounded-xl
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-semibold text-gray-800">Suas Reservas</h2>
        <Button
          className={`${buttonStyles.variant.default} shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto`}
          onClick={onNewReservation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reserva
        </Button>
      </div>

      {reservations.length > 0 ? (
        <motion.div className="grid gap-6" variants={containerVariants}>
          {reservations.map((reservation) => (
            <motion.div key={reservation.id} variants={itemVariants}>
              <Card className={`${cardStyles.base} ${cardStyles.hover.lift} overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 rounded-lg`}>
                <CardContent className={`${cardStyles.content.default} !pt-5 !pb-4 px-5`}>
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className={`p-3 rounded-lg ${getReservationColor(reservation.type)} flex-shrink-0 self-center md:self-start`}>
                      {getReservationIcon(reservation.type)}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
                        <h3 className="font-semibold text-lg text-gray-800">{reservation.name}</h3>
                        <Badge variant={getStatusVariant(reservation.status)} className="mt-1 sm:mt-0 self-start sm:self-center whitespace-nowrap shadow-sm">
                          {getStatusLabel(reservation.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          {reservation.type === 'accommodation' ? (
                            <span>
                              {reservation.checkIn && format(reservation.checkIn, "dd MMM", { locale: ptBR })} - {reservation.checkOut && format(reservation.checkOut, "dd MMM", { locale: ptBR })}
                            </span>
                          ) : (
                            <span>{reservation.date && format(reservation.date, "dd MMM, yyyy", { locale: ptBR })}</span>
                          )}
                        </div>

                        {reservation.type === 'restaurant' && reservation.date && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            <span>{format(reservation.date, "HH:mm", { locale: ptBR })}</span>
                          </div>
                        )}

                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          <span>{reservation.guests} {reservation.guests === 1 ? 'pessoa' : 'pessoas'}</span>
                        </div>

                        <div className="flex items-center col-span-1 sm:col-span-2">
                          <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          <span className="truncate">{reservation.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className={`${cardStyles.footer.default} bg-slate-50 border-t px-5 py-3`}>
                  <div className="flex justify-end w-full gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(reservation.id)} className="text-primary hover:bg-primary/10 font-medium">
                      Detalhes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCancelReservation(reservation.id)} className="text-red-600 hover:text-red-700 hover:bg-red-500/10 font-medium">
                      Cancelar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-16 bg-slate-50 rounded-lg shadow-sm border border-slate-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
        >
          <CalendarDays className="h-16 w-16 mx-auto text-slate-400 mb-5" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Sem reservas ativas</h3>
          <p className="text-slate-500 mb-6 max-w-xs mx-auto">Você não possui nenhuma reserva no momento. Que tal explorar algumas opções?</p>
          <Button className={`${buttonStyles.variant.default} shadow-md hover:shadow-lg transition-shadow`} onClick={onNewReservation}>
             Explorar e Reservar
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
// ****** END: ADDED/MOVED HELPER FUNCTIONS AND INTERFACES ******

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
      className={`${cardStyles.base} ${cardStyles.hover.lift} ${bgColor} p-4 flex flex-col`}
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
  );
};

// Componente para notificação
const NotificationItem = ({ notification, onClick }: {
  notification: Notification;
  onClick?: () => void;
}) => {
  const { title, description, date, read, type } = notification;
  const [isRead, setIsRead] = useState(read);

  const getIconByType = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'promotion':
        return <Gift className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorByType = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'promotion':
        return 'bg-purple-50 border-l-4 border-purple-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const handleReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRead(!isRead);
    // Aqui seria feita a chamada à API para atualizar o status
    toast.success(`Notificação marcada como ${!isRead ? 'lida' : 'não lida'}`);
  };

  return (
    <motion.div
      className={`p-4 ${!isRead ? getColorByType() : 'border-l-4 border-transparent'} ${transitionEffects.appear.fadeIn} hover:bg-gray-50 transition-colors duration-200 cursor-pointer`}
      whileHover={{ backgroundColor: '#F8FAFC' }}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIconByType()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
              {title}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {format(date, "dd/MM HH:mm", { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 rounded-full ${!isRead ? buttonStyles.variant.soft : 'text-gray-400'}`}
                onClick={handleReadToggle}
                aria-label={isRead ? "Marcar como não lida" : "Marcar como lida"}
              >
                <Circle className={`h-3 w-3 ${!isRead ? 'fill-primary stroke-primary' : 'stroke-gray-400'}`} />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {format(date, "'Recebido em' dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Componente para card de recomendação
interface RecommendationItem {
  id: string;
  type: string;
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  tags: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

const RecommendationCard = ({ item }: { item: RecommendationItem }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(item.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(item.isFeatured ?? false);
  const { type, name, description, rating, tags, imageUrl } = item;

  const getIconByType = () => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="h-5 w-5" />;
      case 'accommodation':
        return <HomeIcon className="h-5 w-5" />;
      case 'activity':
        return <Activity className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'restaurant':
        return 'Restaurante';
      case 'accommodation':
        return 'Hospedagem';
      case 'activity':
        return 'Atividade';
      default:
        return 'Recomendação';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'restaurant':
        return 'bg-orange-100';
      case 'accommodation':
        return 'bg-blue-100';
      case 'activity':
        return 'bg-green-100';
      default:
        return 'bg-purple-100';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'restaurant':
        return 'text-orange-700';
      case 'accommodation':
        return 'text-blue-700';
      case 'activity':
        return 'text-green-700';
      default:
        return 'text-purple-700';
    }
  };

  const handleActiveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
    toast.success(`${name} ${!isActive ? 'ativado' : 'desativado'} com sucesso`);
  };

  const handleFeaturedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFeatured(!isFeatured);
    toast.success(`${name} ${!isFeatured ? 'definido como destaque' : 'removido dos destaques'}`);
  };

  const handleCardClick = () => {
    setIsEditing(true);
  };

  return (
    <>
      <motion.div
        className={`${cardStyles.base} ${cardStyles.hover.scale} overflow-hidden flex flex-col h-full cursor-pointer`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleCardClick}
      >
        <div className="h-40 bg-gray-200 relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl || `https://placehold.co/600x400/E2E8F0/A0AEC0?text=${encodeURIComponent(name)}`} 
            alt={`Imagem de ${name}`} 
            className={`w-full h-full object-cover ${imageEffects.hover.scale}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Previne loop de erro
              target.src = "https://placehold.co/600x400/E2E8F0/A0AEC0?text=Imagem+Indisponível";
            }}
          />
          <div className={imageEffects.overlay.dark} />
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
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <Badge 
              variant={isActive ? "success" : "outline"}
              onClick={handleActiveToggle}
              className="cursor-pointer"
            >
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <Badge 
              variant={isFeatured ? "warning" : "outline"}
              onClick={handleFeaturedToggle}
              className="cursor-pointer"
            >
              {isFeatured ? 'Destaque' : 'Normal'}
            </Badge>
          </div>
        </div>
        <div className={`${cardStyles.content.spacious} flex-1 flex flex-col`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-3 flex-1">{description}</p>
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge key={`${name}-${tag}`} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className={`${cardStyles.footer.default} flex justify-between items-center`}>
          <Button variant="ghost" className="text-sm text-blue-600 flex items-center space-x-1 hover:text-blue-800" onClick={handleCardClick}>
            <span>Editar</span>
          </Button>
          <Button variant="ghost" className="text-sm text-gray-500 flex items-center space-x-1 hover:text-gray-700">
            <Heart className="h-4 w-4" />
            <span>Salvar</span>
          </Button>
        </div>
      </motion.div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar {getTypeLabel()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`edit-name-${item.id}`} className="text-right">
                Nome
              </Label>
              <Input id={`edit-name-${item.id}`} defaultValue={name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`edit-description-${item.id}`} className="text-right">
                Descrição
              </Label>
              <Input id={`edit-description-${item.id}`} defaultValue={description} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`edit-rating-${item.id}`} className="text-right">
                Avaliação
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id={`edit-rating-${item.id}`}
                  defaultValue={rating}
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-20"
                />
                <div className="flex text-yellow-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={`rating-star-${item.id}-${star}`}
                      className={`h-5 w-5 ${star <= Math.round(rating) ? 'fill-current' : 'stroke-current fill-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tags</Label>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={`tag-edit-${item.id}-${tag}`} variant="secondary" className="px-3 py-1">
                      {tag}
                      <X className="h-3 w-3 ml-2 cursor-pointer" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Adicionar tag..." className="flex-1" />
                  <Button>Adicionar</Button>
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`edit-active-${item.id}`} className="flex-1">Ativo</Label>
                  <Switch id={`edit-active-${item.id}`} checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`edit-featured-${item.id}`} className="flex-1">Destaque</Label>
                  <Switch id={`edit-featured-${item.id}`} checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={() => {
              setIsEditing(false);
              toast.success(`${name} atualizado com sucesso!`);
            }}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook para detectar media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') { // Garante que o código só roda no client-side
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [matches, query]);

  return matches;
};

// Componente para o botão flutuante de suporte
const FloatingSupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-40">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button 
            className={`${buttonStyles.variant.gradient} ${buttonStyles.size.lg} rounded-full flex items-center shadow-lg`}
            onClick={() => setIsOpen(true)}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Suporte
          </Button>
        </DrawerTrigger>
        <DrawerContent className={`${cardStyles.base} max-w-md mx-auto`}>
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-primary" />
              Como podemos ajudar?
            </DrawerTitle>
            <DrawerDescription>
              Envie sua mensagem e responderemos o mais breve possível.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-subject">Assunto</Label>
                <Select defaultValue="duvida">
                  <SelectTrigger id="support-subject" className={formStyles.select.trigger}>
                    <SelectValue placeholder="Selecione o assunto" />
                  </SelectTrigger>
                  <SelectContent className={formStyles.select.content}>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="problema">Problema</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="cancelamento">Cancelamento</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-message">Mensagem</Label>
                <Textarea 
                  id="support-message" 
                  placeholder="Descreva em detalhes como podemos ajudar..."
                  className={formStyles.textarea.base}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Email para contato</Label>
                <Input 
                  id="support-email" 
                  placeholder="seu-email@exemplo.com"
                  type="email"
                  className={formStyles.input.base}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="support-urgent" />
                <Label htmlFor="support-urgent">É urgente</Label>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button 
              className={buttonStyles.variant.gradient}
              disabled={isSending}
              onClick={() => {
                setIsSending(true);
                // Simular envio
                setTimeout(() => {
                  setIsSending(false);
                  setIsOpen(false);
                  toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
                }, 1500);
              }}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <title>Carregando</title>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enviando...
                </>
              ) : "Enviar mensagem"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// ****** SIDEBAR COMPONENT ******
interface SidebarNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: {
    firstName?: string;
    imageUrl?: string;
    emailAddresses?: Array<{ emailAddress: string }>;
  } | null;
  unreadNotifications: number;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ activeSection, onSectionChange, user, unreadNotifications }) => {
  // Navigation links with icons
  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: HomeIcon, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'reservas', label: 'Minhas Reservas', icon: BookCheckIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'recomendacoes', label: 'Recomendações', icon: Sparkles, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'favoritos', label: 'Favoritos', icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { id: 'personalizacao', label: 'Preferências', icon: User, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { id: 'ajuda', label: 'Ajuda e Suporte', icon: HelpCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  ];
  
  return (
    <div className="w-full lg:w-64 flex flex-col h-full">
      {/* Avatar and Edit Profile section removed */}
      
      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 pt-4">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start mb-1 ${
                isActive 
                  ? `bg-${item.color.split('-')[1]}-100 text-${item.color.split('-')[1]}-700 hover:bg-${item.color.split('-')[1]}-200 hover:text-${item.color.split('-')[1]}-800 border-l-4 border-${item.color.split('-')[1]}-600` 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className={`mr-2 h-4 w-4 ${isActive ? item.color : 'text-gray-500'}`} />
              {item.label}
              {item.id === 'overview' && unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>
      
      <Separator className="mt-4 mb-4" />
      
      {/* Logout Button */}
      <div className="px-3 pb-4">
        <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

// ****** END SIDEBAR COMPONENT ******

export default function Dashboard() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const { saveUserPreferences, isLoading, error, preferences } = useConvexPreferences();

  // Handlers for ReservationsSection actions
  const handleNewReservation = () => {
    toast.info("Abrindo opções para nova reserva...");
  };

  const handleViewReservationDetails = (reservationId: string) => {
    toast.info(`Carregando detalhes da reserva #${reservationId.substring(0,5)}...`);
  };

  const handleCancelReservation = (reservationId: string) => {
    toast(`Cancelar reserva #${reservationId.substring(0,5)}?`, {
      action: {
        label: "Confirmar Cancelamento",
        onClick: () => {
          console.log(`Reservation ${reservationId} cancellation confirmed.`);
          toast.success(`Reserva #${reservationId.substring(0,5)} cancelada.`);
        },
      },
      cancel: {
        label: "Manter Reserva",
        onClick: () => console.log("Cancellation aborted"),
      },
      duration: 10000,
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
    toast.success("Notificação marcada como lida");
  };

  const renderPageContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection 
            reservations={mockReservations} 
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onSectionChange={setActiveSection}
          />
        );
      case 'reservas':
        return <BookingManagementDashboard />;
      case 'recomendacoes':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recomendações Personalizadas</h2>
              <Button variant="outline" size="sm" className="text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                Filtrar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mockRecommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.id} item={recommendation} />
              ))}
            </div>
            
            {mockRecommendations.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">Nenhuma recomendação</h3>
                <p className="text-gray-500 mb-6">Preencha suas preferências para receber recomendações personalizadas</p>
                <Button onClick={() => setActiveSection("personalizacao")}>Definir Preferências</Button>
              </div>
            )}
          </div>
        );
      case 'personalizacao':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <PreferencesSection />
          </div>
        );
      case 'favoritos':
        return (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Bookmark className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum favorito salvo</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Adicione lugares, restaurantes e atividades aos favoritos para encontrá-los facilmente depois.
            </p>
            <Button onClick={() => setActiveSection("recomendacoes")}>
              Explorar Recomendações
            </Button>
          </div>
        );
      case 'ajuda':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Central de Ajuda</h2>
            <div className="space-y-6 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-primary" />
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
                
                {/* Additional help topics can be added here */}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-3">Contato direto</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat de Suporte
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Conteúdo não disponível</div>;
    }
  };

  // Add a new interface for the overview section props
  interface OverviewSectionProps {
    reservations: typeof mockReservations;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onSectionChange: (section: string) => void;
  }

  // Update the overview section component to use the interface
  const OverviewSection: React.FC<OverviewSectionProps> = ({ 
    reservations, 
    notifications, 
    onMarkAsRead, 
    onSectionChange 
  }) => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <BookCheckIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-700">{reservations.filter(r => r.status === 'confirmed').length}</div>
              </div>
              <h3 className="text-sm font-medium mt-2 text-blue-800">Reservas Ativas</h3>
              <p className="text-xs text-blue-600 mt-1">Suas próximas reservas</p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs w-full p-0 h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                onClick={() => onSectionChange('reservas')}
              >
                Ver Reservas
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-indigo-700">2.350</div>
              </div>
              <h3 className="text-sm font-medium mt-2 text-indigo-800">Pontos Acumulados</h3>
              <p className="text-xs text-indigo-600 mt-1">Programa de fidelidade</p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button variant="ghost" size="sm" className="text-xs w-full p-0 h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100">
                Ver Benefícios
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-amber-700">4,8</div>
              </div>
              <h3 className="text-sm font-medium mt-2 text-amber-800">Avaliações</h3>
              <p className="text-xs text-amber-600 mt-1">Média de 12 avaliações</p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button variant="ghost" size="sm" className="text-xs w-full p-0 h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-100">
                Ver Detalhes
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-700">R$ 523</div>
              </div>
              <h3 className="text-sm font-medium mt-2 text-green-800">Economias</h3>
              <p className="text-xs text-green-600 mt-1">Em descontos exclusivos</p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button variant="ghost" size="sm" className="text-xs w-full p-0 h-7 text-green-600 hover:text-green-700 hover:bg-green-100">
                Ver Histórico
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Quick Links */}
        <Card className="bg-white shadow-sm border-t-4 border-blue-500">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => onSectionChange('reservas')} 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 text-center border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800"
              >
                <CalendarDays className="h-6 w-6 text-blue-500" />
                <span className="text-sm font-medium">Nova Reserva</span>
              </Button>
              
              <Button 
                onClick={() => onSectionChange('recomendacoes')} 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 text-center border-purple-200 bg-purple-50 hover:bg-purple-100 hover:text-purple-800"
              >
                <Sparkles className="h-6 w-6 text-purple-500" />
                <span className="text-sm font-medium">Recomendações</span>
              </Button>
              
              <Button 
                onClick={() => onSectionChange('personalizacao')} 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 text-center border-cyan-200 bg-cyan-50 hover:bg-cyan-100 hover:text-cyan-800"
              >
                <User className="h-6 w-6 text-cyan-500" />
                <span className="text-sm font-medium">Preferências</span>
              </Button>
              
              <Button 
                onClick={() => onSectionChange('ajuda')} 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 text-center border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
              >
                <HelpCircle className="h-6 w-6 text-emerald-500" />
                <span className="text-sm font-medium">Ajuda</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Latest Reservations Preview */}
        <Card className="bg-white shadow-sm border-l-4 border-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-indigo-700">Próximas Reservas</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              onClick={() => onSectionChange('reservas')}
            >
              Ver Todas
            </Button>
          </CardHeader>
          <CardContent className="pb-2">
            {reservations.length > 0 ? (
              <div className="space-y-3">
                {reservations.slice(0, 2).map((reservation) => (
                  <div key={reservation.id} className="flex items-start p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <div className={`p-2 rounded-md ${getReservationColor(reservation.type)} mr-3`}>
                      {getReservationIcon(reservation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className="font-medium truncate">{reservation.name}</h4>
                        <Badge variant={getStatusVariant(reservation.status)} className="ml-2">
                          {getStatusLabel(reservation.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap text-sm text-gray-500 mt-1">
                        <span className="flex items-center mr-4">
                          <CalendarDays className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          {reservation.type === 'accommodation' && reservation.checkIn && reservation.checkOut
                            ? `${format(reservation.checkIn, "dd MMM", { locale: ptBR })} - ${format(reservation.checkOut, "dd MMM", { locale: ptBR })}`
                            : reservation.date
                              ? format(reservation.date, "dd MMM, yyyy", { locale: ptBR })
                              : "Data não definida"}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          {reservation.guests} {reservation.guests === 1 ? 'pessoa' : 'pessoas'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Você não possui reservas futuras</p>
                <Button 
                  variant="link" 
                  className="mt-2 text-primary"
                  onClick={() => onSectionChange('reservas')}
                >
                  Explorar opções
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Notifications */}
        <Card className="bg-white shadow-sm border-r-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <CardTitle className="text-lg text-blue-700">Notificações</CardTitle>
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge className="ml-2 bg-red-500">{notifications.filter(n => !n.read).length}</Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => {}}
            >
              Ver Todas
            </Button>
          </CardHeader>
          <CardContent className="pb-2">
            {notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.slice(0, 3).map((notification) => (
                  <button 
                    key={notification.id} 
                    type="button"
                    className={`p-3 w-full text-left ${!notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'} rounded-md transition-colors cursor-pointer`}
                    onClick={() => onMarkAsRead(notification.id)}
                    aria-label={`Notificação: ${notification.title}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.description}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(notification.date, "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhuma notificação</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-screen-2xl">
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Meu Painel</h1>
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SidebarNav 
              activeSection={activeSection}
              onSectionChange={(section) => {
                setActiveSection(section);
                setIsMobileSidebarOpen(false);
              }}
              user={{
                firstName: user?.firstName || undefined,
                imageUrl: user?.imageUrl || undefined,
                emailAddresses: user?.emailAddresses || undefined
              }}
              unreadNotifications={unreadNotifications}
            />
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        <div className="hidden lg:block lg:w-64 bg-white rounded-lg shadow-sm h-[calc(100vh-7rem)] sticky top-24 overflow-y-auto">
          <SidebarNav 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            user={{
              firstName: user?.firstName || undefined,
              imageUrl: user?.imageUrl || undefined,
              emailAddresses: user?.emailAddresses || undefined
            }}
            unreadNotifications={unreadNotifications}
          />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1">
          <div className={`
            bg-gradient-to-r 
            ${activeSection === 'overview' ? 'from-blue-500 to-blue-600' : 
              activeSection === 'reservas' ? 'from-indigo-500 to-indigo-600' : 
              activeSection === 'recomendacoes' ? 'from-purple-500 to-purple-600' : 
              activeSection === 'favoritos' ? 'from-pink-500 to-pink-600' : 
              activeSection === 'personalizacao' ? 'from-cyan-500 to-cyan-600' : 
              activeSection === 'ajuda' ? 'from-emerald-500 to-emerald-600' : 
              'from-gray-700 to-gray-800'
            }
            rounded-lg shadow-md p-4 mb-6 text-white
          `}>
            <h1 className="text-2xl font-bold">
              {activeSection === 'overview' ? 'Meu Painel' : 
              activeSection === 'reservas' ? 'Minhas Reservas' : 
              activeSection === 'recomendacoes' ? 'Recomendações' :
              activeSection === 'personalizacao' ? 'Preferências' :
              activeSection === 'favoritos' ? 'Meus Favoritos' :
              activeSection === 'ajuda' ? 'Ajuda e Suporte' : 'Meu Painel'}
            </h1>
          </div>
          
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderPageContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for missing icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const Mail = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <title>Email Icon</title>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const Menu = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <title>Menu Icon</title>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);
