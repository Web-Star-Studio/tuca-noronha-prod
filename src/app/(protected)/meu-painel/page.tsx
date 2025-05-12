'use client'

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { CalendarDays, Clock, Mail, MapPin, Users, User, ListChecks, BedDouble, Utensils, Activity, Bell, Star, CreditCard, Award, Sparkles, BookCheckIcon, Gift, HomeIcon, CheckCircle2, Heart, Search, X, SlidersHorizontal, MessageCircle, HelpCircle, Plus, Circle, Eye } from "lucide-react"
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
import PersonalizationForm from "@/components/profile/PersonalizationForm" // Assumindo que este componente existe
import { Label } from '@/components/ui/label'
import { Switch } from "@/components/ui/switch"

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

  const handleReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRead(!isRead);
    // Aqui seria feita a chamada à API para atualizar o status
    toast.success(`Notificação marcada como ${!isRead ? 'lida' : 'não lida'}`);
  };

  return (
    <motion.div
      className={`p-4 border-b border-gray-100 ${!isRead ? 'bg-blue-50/70' : ''} hover:bg-gray-50 transition-colors duration-200 cursor-pointer`}
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
                className={`h-6 w-6 rounded-full ${!isRead ? 'text-blue-500' : 'text-gray-400'}`}
                onClick={handleReadToggle}
                aria-label={isRead ? "Marcar como não lida" : "Marcar como lida"}
              >
                <Circle className={`h-3 w-3 ${!isRead ? 'fill-blue-500 stroke-blue-500' : 'stroke-gray-400'}`} />
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
  const { type, name, description, rating, tags, imageUrl } = item; // Adicionado imageUrl

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
        className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full cursor-pointer"
        whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleCardClick}
      >
        <div className="h-40 bg-gray-200 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl || `https://placehold.co/600x400/E2E8F0/A0AEC0?text=${encodeURIComponent(name)}`} 
            alt={`Imagem de ${name}`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Previne loop de erro
              target.src = "https://placehold.co/600x400/E2E8F0/A0AEC0?text=Imagem+Indisponível";
            }}
          />
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
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full text-xs px-2 py-1 h-auto ${isActive ? 'bg-green-100 border-green-200 text-green-700 hover:bg-green-200' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}
              onClick={handleActiveToggle}
            >
              {isActive ? 'Ativo' : 'Inativo'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full text-xs px-2 py-1 h-auto ${isFeatured ? 'bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}
              onClick={handleFeaturedToggle}
            >
              {isFeatured ? 'Destaque' : 'Normal'}
            </Button>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-3 flex-1">{description}</p>
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag, idx) => (
              <div key={`${name}-${tag}-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
idx}`} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 border-t border-gray-100 flex justify-between items-center">
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
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

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
                onClick={() => window.open('https://wa.me/5581999999999', '_blank')} // Número de exemplo
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => window.open('mailto:suporte@example.com')} // Email de exemplo
              >
                <Mail className="mr-2 h-5 w-5" />
                E-mail
              </Button>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast.info("Mensagem enviada (simulação)"); setOpen(false); }}>
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
                onClick={() => window.open('https://wa.me/5581999999999', '_blank')} // Número de exemplo
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contato via WhatsApp
              </Button>
              <Button
                className="justify-start"
                onClick={() => window.open('mailto:suporte@example.com')} // Email de exemplo
              >
                <Mail className="mr-2 h-5 w-5" />
                Contato via E-mail
              </Button>
              <Separator />
              <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); toast.info("Mensagem enviada (simulação)"); setOpen(false); }}>
                <h3 className="text-sm font-medium">Ou envie uma mensagem:</h3>
                <textarea
                  className="w-full min-h-24 rounded-md border border-gray-200 p-3 text-sm"
                  placeholder="Descreva seu problema..."
                />
                <Button type="submit">
                  Enviar Mensagem
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useUser();
  const [profileTab, setProfileTab] = useState('reservas');
  const [viewAllNotifications, setViewAllNotifications] = useState(false);
  const [reservationFilters, setReservationFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  interface PreferencesType {
    cuisines: string[];
    accommodations: string[];
    activities: string[];
    travelStyles: string[];
    budget: string;
    specialRequests: string;
    [key: string]: string | string[]; // Para permitir indexação por string
  }

  const [preferences, setPreferences] = useState<PreferencesType>({
    cuisines: [],
    accommodations: [],
    activities: [],
    travelStyles: [],
    budget: 'medio',
    specialRequests: '',
  });

  // Efeito para animação inicial
  useEffect(() => {
    // Animação configurada via framer-motion
  }, []);

  const handleSavePreferences = (updatedPreferences: PreferencesType) => {
    setPreferences(updatedPreferences);
    toast.success("Preferências salvas com sucesso!", {
      description: "Suas recomendações serão personalizadas de acordo com suas preferências."
    });
  };

  // Filtrando as reservas baseado nos filtros selecionados
  const filteredReservations = mockReservations.filter(reservation => {
    if (reservationFilters.type !== 'all' && reservation.type !== reservationFilters.type) {
      return false;
    }
    if (reservationFilters.status !== 'all' && reservation.status !== reservationFilters.status) {
      return false;
    }
    if (reservationFilters.search) {
      const searchLower = reservationFilters.search.toLowerCase();
      return (
        reservation.name.toLowerCase().includes(searchLower) ||
        reservation.location.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Data indisponível";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return "Data/Hora indisponível";
    return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const unreadNotificationsCount = mockNotifications.filter(n => !n.read).length;
  const notificationsToDisplay = viewAllNotifications
    ? mockNotifications
    : mockNotifications.slice(0, 3);

  const [editingReservations, setEditingReservations] = useState<Record<string, boolean>>({});
  const toggleEditingReservation = (id: string, isEditing: boolean) => {
    setEditingReservations(prev => ({
      ...prev,
      [id]: isEditing
    }));
  };

  const renderReservas = () => {
    if (profileTab !== 'reservas') return null;

    return (
      <motion.div
        key="reservas"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-4 md:p-6 bg-gradient-to-b from-white to-gray-50 min-h-[400px]"
      >
        <div className="grid gap-6">
          <motion.div
            className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
            variants={itemVariants}
          >
            <div className="flex justify-between items-center w-full md:w-auto">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <ListChecks className="mr-2 h-5 w-5 text-blue-600" />
                Suas Reservas
              </h2>
              <Badge variant="outline" className="md:hidden px-3 py-1 bg-blue-50 border-blue-100 text-blue-700 font-semibold shadow-sm">
                {filteredReservations.length}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar reservas..."
                  className="pl-9 h-10 bg-white border-gray-200 shadow-sm w-full"
                  value={reservationFilters.search}
                  onChange={(e) => setReservationFilters(prev => ({
                    ...prev,
                    search: e.target.value
                  }))}
                />
                {reservationFilters.search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                    onClick={() => setReservationFilters(prev => ({ ...prev, search: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                        <Label className="text-sm font-medium">Tipo</Label>
                        <Select
                          value={reservationFilters.type}
                          onValueChange={(value) => setReservationFilters(prev => ({ ...prev, type: value }))}
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
                        <Label className="text-sm font-medium">Status</Label>
                        <Select
                          value={reservationFilters.status}
                          onValueChange={(value) => setReservationFilters(prev => ({ ...prev, status: value }))}
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
                        onClick={() => {
                          setReservationFilters({ type: 'all', status: 'all', search: reservationFilters.search });
                          setIsFilterOpen(false);
                        }}
                      >
                        Limpar Filtros
                      </Button>
                      <DrawerClose asChild>
                        <Button onClick={() => setIsFilterOpen(false)}>Aplicar</Button>
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
                    value={reservationFilters.status}
                    onValueChange={(value) => setReservationFilters(prev => ({ ...prev, status: value }))}
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

                  {(reservationFilters.type !== 'all' || reservationFilters.status !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white border-gray-200 shadow-sm hover:bg-gray-50 h-10"
                      onClick={() => setReservationFilters(prev => ({ ...prev, type: 'all', status: 'all' }))}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              )}
            </div>
             <Badge variant="outline" className="hidden md:inline-flex px-3 py-1 bg-blue-50 border-blue-100 text-blue-700 font-semibold shadow-sm">
                {filteredReservations.length} Reservas
              </Badge>
          </motion.div>

          {filteredReservations.length === 0 ? (
            <Card className="bg-white shadow-md">
              <CardContent className="py-10 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Nenhuma reserva encontrada</p>
                <p className="text-gray-400 text-sm mb-4">Tente ajustar seus filtros ou faça uma nova reserva.</p>
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
              {filteredReservations.map((reservation) => {
                const isEditing = editingReservations[reservation.id] || false;
                const isRestaurant = reservation.type === 'restaurant';
                const isAccommodation = reservation.type === 'accommodation';
                const isActivity = reservation.type === 'activity';

                return (
                  <motion.div key={reservation.id} variants={itemVariants} layout>
                    <Card className="overflow-hidden border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 lg:w-1/4 h-48 md:h-auto bg-gray-100 relative overflow-hidden">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={reservation.imageUrl || `https://placehold.co/400x300/E2E8F0/A0AEC0?text=${encodeURIComponent(reservation.name)}`} 
                            alt={`Imagem de ${reservation.name}`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; 
                              target.src = "https://placehold.co/400x300/E2E8F0/A0AEC0?text=Erro";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                          <div className="absolute top-2 left-2 z-20">
                            <Badge className={`px-2 py-1 text-xs font-medium ${
                              isRestaurant ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              isAccommodation ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-green-100 text-green-700 border-green-200'
                            }`}>
                              {isRestaurant && <Utensils className="mr-1 h-3 w-3 inline" />}
                              {isAccommodation && <BedDouble className="mr-1 h-3 w-3 inline" />}
                              {isActivity && <Activity className="mr-1 h-3 w-3 inline" />}
                              {isRestaurant ? 'Restaurante' : isAccommodation ? 'Hospedagem' : 'Atividade'}
                            </Badge>
                          </div>
                          <div className="absolute bottom-2 right-2 z-20">
                            <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'} className={`
                              text-xs px-2 py-1 
                              ${reservation.status === 'confirmed'
                                ? 'bg-green-500 text-white border-green-600'
                                : 'bg-yellow-400 text-yellow-900 border-yellow-500'}
                            `}>
                              {reservation.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-5 md:p-6 md:w-2/3 lg:w-3/4 space-y-3">
                          <div>
                            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => toggleEditingReservation(reservation.id, true)}>{reservation.name}</h3>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                              <span className="line-clamp-1">{reservation.location}</span>
                            </div>
                          </div>

                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 text-sm">
                            {isRestaurant && (
                              <>
                                <div className="flex items-start">
                                  <CalendarDays className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-gray-500">Data</p>
                                    <p className="font-medium text-gray-800">{formatDate(reservation.date)}</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <Clock className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-gray-500">Horário</p>
                                    <p className="font-medium text-gray-800">{reservation.date ? format(reservation.date, 'HH:mm') : 'N/A'}</p>
                                  </div>
                                </div>
                              </>
                            )}
                            {isAccommodation && (
                              <>
                                <div className="flex items-start">
                                  <CalendarDays className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-gray-500">Check-in</p>
                                    <p className="font-medium text-gray-800">{formatDate(reservation.checkIn)}</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <CalendarDays className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-gray-500">Check-out</p>
                                    <p className="font-medium text-gray-800">{formatDate(reservation.checkOut)}</p>
                                  </div>
                                </div>
                              </>
                            )}
                            {isActivity && (
                              <div className="flex items-start">
                                <CalendarDays className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-gray-500">Data e Hora</p>
                                  <p className="font-medium text-gray-800">{formatDateTime(reservation.date)}</p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-start">
                              <Users className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-gray-500">Pessoas</p>
                                <p className="font-medium text-gray-800">{reservation.guests}</p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex flex-wrap justify-end items-center gap-2">
                            <Button variant="outline" size="sm" className="border-gray-300 text-blue-600 hover:bg-blue-50" onClick={() => toggleEditingReservation(reservation.id, true)}>
                              <Eye className="h-4 w-4 mr-1.5" />
                              Detalhes
                            </Button>
                            {reservation.status === 'confirmed' && (
                              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700">
                                <X className="h-4 w-4 mr-1.5" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Dialog open={isEditing} onOpenChange={(open) => toggleEditingReservation(reservation.id, open)}>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Reserva</DialogTitle>
                          <DialogDescription>
                            {reservation.name} - {reservation.location}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                           <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Status</Label>
                            <Select defaultValue={reservation.status} onValueChange={(newStatus) => {
                                // Lógica para atualizar o status da reserva (mock)
                                // const updatedReservations = mockReservations.map(r => 
                                //     r.id === reservation.id ? { ...r, status: newStatus } : r
                                // );
                                // Idealmente, você atualizaria o estado que alimenta `filteredReservations`
                                console.log("Status atualizado para:", newStatus, " (simulação)");
                                toast.info(`Status da reserva ${reservation.name} alterado para ${newStatus}.`);
                            }}>
                                <SelectTrigger className="col-span-3">
                                <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                          <Separator />
                          {isRestaurant && (
                            <>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Data</Label>
                                <div className="col-span-3">
                                  <p className="font-medium">{formatDate(reservation.date)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Horário</Label>
                                <div className="col-span-3">
                                  <p className="font-medium">{reservation.date ? format(reservation.date, 'HH:mm') : 'N/A'}</p>
                                </div>
                              </div>
                            </>
                          )}
                          {isAccommodation && (
                            <>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Check-in</Label>
                                <div className="col-span-3">
                                  <p className="font-medium">{formatDate(reservation.checkIn)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Check-out</Label>
                                <div className="col-span-3">
                                  <p className="font-medium">{formatDate(reservation.checkOut)}</p>
                                </div>
                              </div>
                            </>
                          )}
                           {isActivity && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Data e Hora</Label>
                                <div className="col-span-3">
                                  <p className="font-medium">{formatDateTime(reservation.date)}</p>
                                </div>
                              </div>
                          )}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Hóspedes</Label>
                            <div className="col-span-3">
                              <p className="font-medium">{reservation.guests} pessoas</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Ações</Label>
                            <div className="col-span-3 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`send-reminder-${reservation.id}`} className="flex-1 text-sm">
                                  Enviar lembrete por e-mail
                                </Label>
                                <Switch id={`send-reminder-${reservation.id}`} />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`add-to-cal-${reservation.id}`} className="flex-1 text-sm">
                                  Adicionar ao calendário (ICS)
                                </Label>
                                <Switch id={`add-to-cal-${reservation.id}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => toggleEditingReservation(reservation.id, false)}>
                            Fechar
                          </Button>
                          <Button type="submit" onClick={() => {
                            toggleEditingReservation(reservation.id, false);
                            toast.success("Informações da reserva salvas!");
                          }}>
                            Salvar alterações
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ); // Fecha o return do map
              })} 
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderPerfil = () => {
    if (profileTab !== 'perfil') return null;

    return (
      <motion.div
        key="perfil"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={tabVariants}
        className="p-4 md:p-6 bg-gradient-to-b from-white to-gray-50 min-h-[400px]"
      >
        <PersonalizationForm
          initialPreferences={preferences}
          onSave={handleSavePreferences}
        />
      </motion.div>
    );
  };

  const renderRecomendacoes = () => {
    if (profileTab !== 'recomendacoes') return null;

    return (
      <motion.div
        key="recomendacoes"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={tabVariants}
        className="p-4 md:p-6 bg-gradient-to-b from-white to-gray-50 min-h-[400px]"
      >
        <div className="grid gap-6">
          <motion.div
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
              Recomendações para você
            </h2>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Recomendação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Recomendação</DialogTitle>
                  <DialogDescription>
                    Preencha as informações para criar uma nova recomendação.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-type" className="text-right">
                      Tipo
                    </Label>
                    <Select defaultValue="restaurant">
                      <SelectTrigger id="new-type" className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurante</SelectItem>
                        <SelectItem value="accommodation">Hospedagem</SelectItem>
                        <SelectItem value="activity">Atividade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-name" className="text-right">
                      Nome
                    </Label>
                    <Input id="new-name" placeholder="Nome da recomendação" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-description" className="text-right">
                      Descrição
                    </Label>
                    <Input id="new-description" placeholder="Descrição da recomendação" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-rating" className="text-right">
                      Avaliação
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                      <Input
                        id="new-rating"
                        defaultValue="4.5"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-20"
                      />
                      <div className="flex text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={`new-rating-star-${star}`}
                            className="h-5 w-5 stroke-current" // Estilo inicial para estrelas vazias
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Tags</Label>
                    <div className="col-span-3">
                      <div className="flex gap-2">
                        <Input placeholder="Adicionar tag..." className="flex-1" />
                        <Button>Adicionar</Button>
                      </div>
                       {/* Adicionar exibição de tags adicionadas aqui, se necessário */}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Status</Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="new-active" className="flex-1">Ativo</Label>
                        <Switch id="new-active" defaultChecked />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="new-featured" className="flex-1">Destaque</Label>
                        <Switch id="new-featured" />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { /* Lógica para fechar dialog */ }}>
                    Cancelar
                  </Button>
                  <Button type="submit" onClick={() => toast.success("Recomendação criada com sucesso!")}>
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>

          <div className="flex items-center mb-4">
            <p className="text-sm text-gray-500 mr-3">Filtrar por:</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100">
                Todos
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-orange-50 hover:text-orange-700 border-gray-200">
                Restaurantes
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-700 border-gray-200">
                Hospedagens
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-700 border-gray-200">
                Atividades
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    );
  };
  
  const renderDashboardContent = () => {
    // Este conteúdo pode ser adicionado se a aba "Dashboard" tiver um layout específico
    // Por enquanto, vamos deixar um placeholder
    if (profileTab !== 'dashboard') return null;
    return (
        <motion.div 
            key="dashboard-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={tabVariants}
            className="p-4 md:p-6 bg-gradient-to-b from-white to-gray-50 min-h-[400px]"
        >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Visão Geral do Dashboard</h2>
            <p className="text-gray-600">Bem-vindo à sua área principal. Aqui você encontrará um resumo das suas atividades e informações importantes.</p>
            {/* Adicionar mais componentes e informações relevantes para o dashboard aqui */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Próximos Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Nenhum evento agendado por enquanto.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Nenhuma atividade recente para mostrar.</p>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
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
          title="Pontos Acumulados"
          value="1.500" // Exemplo
          color="bg-purple-600"
          bgColor="bg-white"
        >
          <p className="text-xs text-gray-500">No programa de fidelidade.</p>
        </StatCard>
        <StatCard
          icon={CreditCard}
          title="Valor Economizado"
          value="R$ 350,00" // Exemplo
          color="bg-green-600"
          bgColor="bg-white"
        >
          <p className="text-xs text-gray-500">Com descontos e promoções.</p>
        </StatCard>
        <StatCard
          icon={Sparkles}
          title="Status Fidelidade"
          value="Silver" // Exemplo
          color="bg-amber-500"
          bgColor="bg-white"
        >
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '65%' }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">500 pts para Gold</p>
        </StatCard>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-24">
        <motion.div
          className="flex-1 rounded-xl overflow-hidden shadow-lg bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs defaultValue="reservas" onValueChange={setProfileTab} className="h-full flex flex-col">
            <TabsList className="text-white bg-gradient-to-r from-blue-600 to-blue-500 p-1.5 w-full overflow-x-auto flex-nowrap md:flex-wrap scrollbar-hide rounded-t-xl">
              {[
                { value: "dashboard", label: "Dashboard", icon: HomeIcon },
                { value: "reservas", label: "Minhas Reservas", icon: ListChecks },
                { value: "perfil", label: "Personalização", icon: User },
                { value: "recomendacoes", label: "Recomendações", icon: Sparkles },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 rounded-md px-3 py-2 text-sm font-medium flex-shrink-0 text-blue-50 hover:bg-blue-500/50"
                >
                  <tab.icon className="mr-1.5 h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <AnimatePresence mode="wait">
              {profileTab === 'dashboard' && renderDashboardContent()}
              {profileTab === 'reservas' && renderReservas()}
              {profileTab === 'perfil' && renderPerfil()}
              {profileTab === 'recomendacoes' && renderRecomendacoes()}
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
              {unreadNotificationsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadNotificationsCount} nova{unreadNotificationsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
            {notificationsToDisplay.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                Nenhuma notificação no momento.
              </div>
            ) : (
              <>
                {notificationsToDisplay.map(notification => (
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
      <FloatingSupportButton />
    </div>
  );
}
