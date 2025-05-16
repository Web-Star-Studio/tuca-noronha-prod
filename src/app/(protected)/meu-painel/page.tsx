'use client'

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { CalendarDays, Clock, MapPin, Users, User, ListChecks, BedDouble, Utensils, Activity, Bell, Star, CreditCard, Award, Sparkles, BookCheckIcon, Gift, HomeIcon, CheckCircle2, Heart, Search, X, SlidersHorizontal, MessageCircle, HelpCircle, Plus, Circle, Eye, Info } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { useConvexPreferences } from "@/lib/hooks/useConvexPreferences"

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
import { toast } from "sonner"
import { Label } from '@/components/ui/label'
import { Switch } from "@/components/ui/switch"
import { cardStyles, badgeStyles, buttonStyles, transitionEffects, imageEffects, formStyles } from "@/lib/ui-config"
import { Textarea } from "@/components/ui/textarea"
import NoronhaTravelChatbot from "@/components/NoronhaTravelChatbot"

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

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('reservas');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notificationCount, setNotificationCount] = useState(mockNotifications.length);
  const [viewAllNotifications, setViewAllNotifications] = useState(false);
  const { saveUserPreferences, isLoading, error, preferences } = useConvexPreferences();

  const renderReservas = () => {
    return (
      <div className={`${cardStyles.content.default} space-y-4`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Suas Reservas</h2>
          <Button className={buttonStyles.variant.default}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Reserva
          </Button>
        </div>
        
        <div className="grid gap-4">
          {mockReservations.length > 0 ? (
            mockReservations.map((reservation) => (
              <Card key={reservation.id} className={`${cardStyles.base} ${cardStyles.hover.lift}`}>
                <CardContent className={`${cardStyles.content.default} !pt-4`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${getReservationColor(reservation.type)}`}>
                      {getReservationIcon(reservation.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{reservation.name}</h3>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
                          {reservation.type === 'accommodation' ? (
                            <span>
                              {format(reservation.checkIn, "dd MMM", { locale: ptBR })} - {format(reservation.checkOut, "dd MMM", { locale: ptBR })}
                            </span>
                          ) : (
                            <span>{format(reservation.date, "dd MMM, yyyy", { locale: ptBR })}</span>
                          )}
                        </div>
                        
                        {reservation.type === 'restaurant' && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{format(reservation.date, "HH:mm", { locale: ptBR })}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{reservation.guests} {reservation.guests === 1 ? 'pessoa' : 'pessoas'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{reservation.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant={getStatusVariant(reservation.status)}>
                      {getStatusLabel(reservation.status)}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className={cardStyles.footer.default}>
                  <div className="flex justify-end w-full gap-2">
                    <Button variant="outline" size="sm">Detalhes</Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Cancelar</Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">Sem reservas ativas</h3>
              <p className="text-gray-500 mb-6">Você não possui nenhuma reserva no momento</p>
              <Button>Fazer uma reserva</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRecomendacoes = () => {
    return (
      <div className={`${cardStyles.content.default} space-y-4`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Recomendações Personalizadas</h2>
          <Button variant="outline" className={buttonStyles.variant.soft}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRecommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.id} item={recommendation} />
          ))}
        </div>
        
        {mockRecommendations.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">Nenhuma recomendação</h3>
            <p className="text-gray-500 mb-6">Preencha o formulário de personalização para receber recomendações</p>
            <Button onClick={() => setActiveTab("personalizacao")}>Personalizar Preferências</Button>
          </div>
        )}
      </div>
    );
  };

  const renderPersonalizacao = () => {
    return (
      <div className="flex justify-center w-full py-6">
        <div className="w-full max-w-4xl">
          <NoronhaTravelChatbot 
            userName={user?.firstName || "Visitante"}
            onComplete={(data) => {
              toast.success("Preferências salvas com sucesso!");
              console.log("Dados do chatbot:", data);
              
              // Aqui poderia chamar uma mutação Convex para salvar dados
              // e gerar recomendações
              
              setTimeout(() => {
                // Simular tempo para processar as recomendações
                setActiveTab("recomendacoes");
                toast.success("Suas recomendações estão prontas!", {
                  description: "Criamos sugestões personalizadas com base nas suas preferências."
                });
              }, 1500);
            }}
          />
        </div>
      </div>
    );
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl">
      <motion.header
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Painel de Controle</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Bem-vindo de volta, <span className="font-medium text-blue-600">{user?.firstName || 'Visitante'}</span>!
        </p>
      </motion.header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={BookCheckIcon}
          title="Reservas Ativas"
          value={mockReservations.filter(r => r.status === 'confirmed').length}
          color="bg-blue-600"
          bgColor="bg-white"
        >
          <p className="text-xs text-gray-500">Suas próximas reservas confirmadas.</p>
        </StatCard>
        <StatCard
          icon={Award}
          title="Pontos"
          value="2.350"
          color="bg-purple-500"
          bgColor="bg-purple-50"
        >
          <span className="text-sm text-gray-500">Programa de fidelidade</span>
        </StatCard>
        <StatCard
          icon={Star}
          title="Avaliações"
          value="4,8"
          color="bg-amber-500"
          bgColor="bg-amber-50"
        >
          <span className="text-sm text-gray-500">Média de 12 avaliações</span>
        </StatCard>
        <StatCard
          icon={CreditCard}
          title="Economia"
          value="R$ 523"
          color="bg-green-500"
          bgColor="bg-green-50"
        >
          <span className="text-sm text-gray-500">Economizados em descontos</span>
        </StatCard>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-24">
        <motion.div
          className="flex-1 rounded-xl overflow-hidden shadow-lg bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs
            defaultValue="reservas"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex items-center justify-between"
          >
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger
                value="reservas"
                className={`${transitionEffects.appear.fadeIn}`}
                onClick={() => setActiveTab("reservas")}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Reservas
              </TabsTrigger>
              <TabsTrigger
                value="recomendacoes"
                className={`${transitionEffects.appear.fadeIn}`}
                onClick={() => setActiveTab("recomendacoes")}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Recomendações
              </TabsTrigger>
              <TabsTrigger
                value="personalizacao"
                className={`${transitionEffects.appear.fadeIn}`}
                onClick={() => setActiveTab("personalizacao")}
              >
                <User className="h-4 w-4 mr-2" />
                Personalização
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === "reservas" && (
                <motion.div
                  key="reservas"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={transitionEffects.appear.fadeInUp}
                >
                  {renderReservas()}
                </motion.div>
              )}
              {activeTab === "recomendacoes" && (
                <motion.div
                  key="recomendacoes"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={transitionEffects.appear.fadeInUp}
                >
                  {renderRecomendacoes()}
                </motion.div>
              )}
              {activeTab === "personalizacao" && (
                <motion.div
                  key="personalizacao"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={transitionEffects.appear.fadeInUp}
                >
                  {renderPersonalizacao()}
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>

        <motion.div
          className="lg:w-96 rounded-xl overflow-hidden shadow-lg bg-white"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="p-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold flex items-center text-base">
                <Bell className="h-5 w-5 mr-2" />
                Notificações
              </h3>
              {notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {notificationCount} nova{notificationCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                Nenhuma notificação no momento.
              </div>
            ) : (
              <>
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => toast.info(`Notificação: ${notification.title}`)}
                  />
                ))}
                {mockNotifications.length > 3 && (
                    <div className="p-3 flex justify-center bg-gray-50 rounded-b-xl border-t border-gray-100">
                    <Button
                        variant="link"
                        className="text-sm text-blue-600 font-medium hover:text-blue-800"
                        onClick={() => setViewAllNotifications(!viewAllNotifications)}
                    >
                        {viewAllNotifications ? 'Ver menos notificações' : `Ver todas (${mockNotifications.length})`}
                    </Button>
                    </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Função auxiliar para obter o ícone com base no tipo de reserva
const getReservationIcon = (type: string) => {
  switch (type) {
    case 'restaurant':
      return <Utensils className="h-5 w-5 text-white" />;
    case 'accommodation':
      return <BedDouble className="h-5 w-5 text-white" />;
    case 'activity':
      return <Activity className="h-5 w-5 text-white" />;
    default:
      return <CalendarDays className="h-5 w-5 text-white" />;
  }
};

// Função auxiliar para obter a cor com base no tipo de reserva
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

// Função auxiliar para obter a variante do badge com base no status
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
};

// Função auxiliar para obter o label com base no status
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmado';
    case 'pending':
      return 'Pendente';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};
