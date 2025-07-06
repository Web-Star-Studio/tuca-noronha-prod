"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { format, isSameMonth, isAfter, isBefore, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { 
  ChevronRight, MapPin, Calendar, Utensils, Waves, Building, Info, Star, 
  Plane, Home, Car, UtensilsCrossed, Sun, Clock, Filter, Heart, DollarSign, 
  Thermometer, Droplets, Zap, X, Camera, Map, Menu, ArrowRight, ChevronDown,
  Navigation, Cloud, CloudRain, Sparkles, Trophy, TrendingUp, Users, 
  Shield, Phone, Mail, MessageCircle, Share2, Bookmark, Download, 
  ChevronLeft, CheckCircle, AlertCircle, Eye, Globe, Compass, ArrowLeft,
  Settings, BarChart3, TrendingDown, Wind, Sunrise, Sunset, Activity,
  Fish, Key, ArrowUp, Command, Search, Mic, Hash, BookOpen, Layers, Shirt, Wallet, Play
} from "lucide-react";
import { cardStyles, decorativeBackgrounds, buttonStyles, ui } from "@/lib/ui-config";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ImageGallery } from "@/components/ui/image-gallery";
import { BeachLocation } from "@/components/ui/beach-location";
import { RealTimeConditions } from "@/components/ui/real-time-conditions";
import { WeatherAlerts } from "@/components/ui/weather-alerts";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { useGesture } from "@use-gesture/react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";

// Glassmorphism styles (keeping for gradual migration)
const glassStyles = {
  base: "backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl",
  dark: "backdrop-blur-xl bg-gray-900/80 border border-white/10 shadow-2xl",
  colored: (color: string) => `backdrop-blur-xl bg-${color}-500/10 border border-${color}-500/20 shadow-xl`,
  hover: "hover:bg-white/90 hover:shadow-2xl hover:border-white/30 transition-all duration-300",
  card: "backdrop-blur-md bg-white/60 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300",
  button: "backdrop-blur-md bg-white/20 border border-white/30 hover:bg-white/30 transition-all duration-200"
};

// Minimalist design system
const minimalStyles = {
  // Base styles with subtle effects
  base: "bg-white border border-gray-100 shadow-sm",
  elevated: "bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300",
  
  // Typography hierarchy
  text: {
    hero: "text-4xl md:text-5xl lg:text-6xl font-light tracking-tight",
    title: "text-2xl md:text-3xl font-light tracking-tight",
    subtitle: "text-lg md:text-xl font-normal text-gray-600",
    body: "text-base font-normal text-gray-700 leading-relaxed",
    caption: "text-sm text-gray-500"
  },
  
  // Spacing system
  spacing: {
    section: "py-16 md:py-24",
    container: "max-w-7xl mx-auto px-4 md:px-6 lg:px-8",
    stack: "space-y-6 md:space-y-8"
  },
  
  // Interactive elements
  button: {
    primary: "bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:border-gray-300 transition-colors duration-200",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
  },
  
  // Cards with minimal styling
  card: "bg-white rounded-lg p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300"
};

const guideSections = [
  {
    id: "boas-vindas",
    title: "Boas-vindas",
    icon: Plane,
    color: "blue",
    description: "Preparativos para uma experiência inesquecível em Fernando de Noronha.",
    quickInfo: "Taxas, Voos e Dicas",
    gradient: "from-blue-400 to-indigo-600",
    accentGradient: "from-blue-500/20 to-indigo-600/20"
  },
  {
    id: "accommodation", 
    title: "Hospedagem",
    icon: Home,
    color: "purple",
    description: "Conheça as melhores regiões da ilha e escolha a hospedagem ideal para sua estadia",
    quickInfo: "90+ opções • Todas as faixas",
    gradient: "from-purple-400 to-pink-600",
    accentGradient: "from-purple-500/20 to-pink-600/20"
  },
  {
    id: "transportation",
    title: "Transporte",
    icon: Car,
    color: "green",
    description: "Compare todas as opções de transporte disponíveis na ilha e escolha a melhor para você",
    quickInfo: "Buggy, taxi, ônibus",
    gradient: "from-green-400 to-emerald-600",
    accentGradient: "from-green-500/20 to-emerald-600/20"
  },
  {
    id: "beaches",
    title: "Praias",
    icon: Waves,
    color: "cyan",
    description: "Descubra as praias mais incríveis do arquipélago com dicas práticas e informações de acesso",
    quickInfo: "21 praias • Snorkel grátis",
    gradient: "from-cyan-400 to-blue-600",
    accentGradient: "from-cyan-500/20 to-blue-600/20"
  },
  {
    id: "dining", 
    title: "Gastronomia",
    icon: UtensilsCrossed,
    color: "orange",
    description: "Saboreie os melhores restaurantes e especialidades locais da ilha paradisíaca",
    quickInfo: "30+ restaurantes • R$ 60-200",
    gradient: "from-orange-400 to-red-600",
    accentGradient: "from-orange-500/20 to-red-600/20"
  },
  {
    id: "monthly-guide",
    title: "Quando Ir",
    icon: Sun,
    color: "yellow",
    description: "Planeje sua viagem conhecendo o clima e as melhores atividades para cada época do ano",
    quickInfo: "Melhor: Set-Fev • Surf: Jan-Mar",
    gradient: "from-yellow-400 to-orange-600",
    accentGradient: "from-yellow-500/20 to-orange-600/20"
  }
];

// Interface para preferências do usuário
interface UserPreferences {
  travelDate: Date | undefined;
  duration: number;
  budget: [number, number];
  interests: string[];
  difficultyLevel: string;
  travelStyle: 'adventure' | 'relaxation' | 'cultural' | 'romantic' | 'family';
  groupSize: number;
  dietaryRestrictions: string[];
  accessibility: boolean;
}

// Interface para dados dinâmicos
interface TravelData {
  weather: {
    temperature: number;
    humidity: number;
    rainChance: number;
    season: string;
    seaCondition: 'calm' | 'moderate' | 'rough';
    visibility: number;
  };
  prices: {
    accommodation: number;
    transport: number;
    activities: number;
    meals: number;
  };
  crowds: 'low' | 'medium' | 'high';
  bestActivities: string[];
  events: Array<{
    name: string;
    date: string;
    type: string;
  }>;
}

// Interface para filtros avançados
interface AdvancedFilters {
  priceRange: 'budget' | 'mid' | 'luxury' | 'all';
  activityType: string[];
  beachType: string[];
  restaurantCuisine: string[];
  accommodationType: string[];
  accessibility: boolean;
  familyFriendly: boolean;
  petFriendly: boolean;
}

// Dados de busca indexados
interface SearchableContent {
  id: string;
  type: 'beach' | 'restaurant' | 'activity' | 'accommodation' | 'tip';
  title: string;
  description: string;
  tags: string[];
  section: string;
  keywords: string[];
}

// Mapa de cores para badges e cards
const colorMap = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "text-blue-600",
    darkBg: "bg-blue-600",
    lightBg: "bg-blue-100",
    gradient: "from-blue-600 to-blue-700",
    shadowColor: "shadow-blue-200"
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "text-purple-600",
    darkBg: "bg-purple-600",
    lightBg: "bg-purple-100",
    gradient: "from-purple-600 to-purple-700",
    shadowColor: "shadow-purple-200"
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: "text-green-600",
    darkBg: "bg-green-600",
    lightBg: "bg-green-100",
    gradient: "from-green-600 to-green-700",
    shadowColor: "shadow-green-200"
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    icon: "text-cyan-600",
    darkBg: "bg-cyan-600",
    lightBg: "bg-cyan-100",
    gradient: "from-cyan-600 to-cyan-700",
    shadowColor: "shadow-cyan-200"
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: "text-orange-600",
    darkBg: "bg-orange-600",
    lightBg: "bg-orange-100",
    gradient: "from-orange-600 to-orange-700",
    shadowColor: "shadow-orange-200"
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    icon: "text-yellow-600",
    darkBg: "bg-yellow-600",
    lightBg: "bg-yellow-100",
    gradient: "from-yellow-600 to-yellow-700",
    shadowColor: "shadow-yellow-200"
  }
};

// Animated counter for numbers
function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const updateValue = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + (endValue - startValue) * easeOutQuart);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, duration]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
}

// Magnetic button component
function MagneticButton({ 
  children, 
  className,
  ...props 
}: React.ComponentProps<typeof Button>) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setPosition({ x: x * 0.1, y: y * 0.1 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <Button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.2s ease-out'
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

// Componente de conteúdo das seções
function SectionContent({ 
  sectionId, 
  preferences, 
  travelData, 
  favorites, 
  onToggleFavorite 
}: {
  sectionId: string;
  preferences: UserPreferences;
  travelData: TravelData;
  favorites: string[];
  onToggleFavorite: (item: string) => void;
}) {
  const content = {
    "boas-vindas": (
      <div className="space-y-8">
        <div className="relative aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Assista ao Vídeo da Seção
          </h3>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">[Vídeo em breve]</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(glassStyles.card, "p-6 border-2 border-blue-200/50")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl" />
          <div className="relative flex items-start gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            >
              <Plane className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <motion.h2 
                className="text-xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Boas-vindas ao Paraíso: Preparativos para uma Experiência Inesquecível
              </motion.h2>
              <motion.p 
                className="text-gray-600 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Fernando de Noronha não é apenas um destino de viagem; é um privilégio. Antes de mergulhar em suas águas azul-turquesa, é fundamental compreender a essência deste lugar. O arquipélago ostenta uma rara tríade de títulos de proteção ambiental que ditam o ritmo e a experiência de quem o visita: é um <strong>Parque Nacional Marinho</strong> desde 1988, um <strong>Patrimônio Natural Mundial da Humanidade pela UNESCO</strong> desde 2001 (juntamente com o Atol das Rocas) e um <strong>Sítio RAMSAR</strong>, designação que reconhece suas zonas húmidas como de importância internacional.
              </motion.p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: DollarSign,
              title: "Taxa de Preservação (TPA)",
              description: "Obrigatória para todos os visitantes, com valor diário progressivo. Crianças menores de 5 anos são isentas.",
              details: "A partir de R$ 101,33 por dia",
              color: "green"
            },
            {
              icon: Shield,
              title: "Ingresso PARNAMAR",
              description: "Acesso às principais praias e trilhas do Parque Nacional. Válido por 10 dias.",
              details: "R$ 186,50 (Brasileiros) / R$ 373 (Estrangeiros)",
              color: "purple"
            },
            {
              icon: Plane,
              title: "Voos e Chegada",
              description: "Voos partem principalmente de Recife e Natal. Contratar um transfer privativo pode otimizar seu tempo.",
              details: "Evite transfers compartilhados",
              color: "blue"
            }
          ].map((item, index) => {
            const itemColor = colorMap[item.color as keyof typeof colorMap];
            
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(glassStyles.card, "p-5 cursor-pointer group")}
              >
                <motion.div 
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    `bg-gradient-to-br ${itemColor.gradient} shadow-lg`
                  )}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <p className={cn("text-xs font-medium", itemColor.text)}>{item.details}</p>
                
                <motion.div
                  className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            );
          })}
        </div>

        <div className={cn(cardStyles.base, "p-6")}>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Checklist Essencial do Viajante
          </h3>
          <div className="space-y-4">
            {[
              { time: "Vestuário", task: "Tecidos leves, respiráveis, e peças com proteção UV. Saltos altos são impraticáveis.", icon: Shirt },
              { time: "Equipamentos", task: "Kit de snorkel, garrafa de água reutilizável, e câmera subaquática.", icon: Camera },
              { time: "Saúde e Bem-estar", task: "Kit de primeiros socorros, medicamentos de uso contínuo, protetor solar e repelente.", icon: Heart },
              { time: "Documentos e Dinheiro", task: "Comprovantes de pagamento das taxas, documentos pessoais e dinheiro em espécie.", icon: Wallet }
            ].map((step, index) => (
              <motion.div
                key={step.time}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.task}</p>
                  <p className="text-xs text-gray-500">{step.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(glassStyles.card, "p-6")}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Informações Práticas
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Internet</p>
                  <p className="text-lg font-bold text-green-700">
                    Instável
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Aproveite para um detox digital
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Serviços Bancários</p>
                  <p className="text-lg font-bold text-green-700">
                    Limitados
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Leve dinheiro em espécie
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Voltagem e Fuso Horário</p>
                  <p className="text-lg font-bold text-green-700">
                    220V e GMT-2
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Uma hora a mais que Brasília
                  </p>
                </div>
          </div>
        </motion.div>

        <div className={cn(glassStyles.card, "p-6 bg-yellow-50/50 border-2 border-yellow-200/50")}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">O Viajante Consciente: Etiqueta para Preservar o Paraíso</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Respeito à Vida Selvagem: É estritamente proibido tocar, alimentar ou perseguir qualquer animal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Redução de Resíduos: A ilha baniu a importação e o uso de plásticos descartáveis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Economia de Recursos: Água e energia são bens preciosos em Noronha.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),

    "accommodation": (
      <div className="space-y-8">
        <div className={cn(cardStyles.base, "p-6 relative overflow-hidden")}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-600" />
            Assista ao Vídeo da Seção
          </h3>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">[Vídeo em breve]</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(cardStyles.base, "p-6 overflow-hidden")}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">O Epicentro do Luxo: As Pousadas-Destino</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "Pousada Maravilha",
                description: "O epítome da exclusividade, frequentada por celebridades que buscam privacidade absoluta.",
                pros: ["Exclusividade Absoluta", "Piscina de borda infinita", "Restaurante renomado"],
                price: "$$$",
                color: "purple"
              },
              {
                name: "NANNAI Noronha",
                description: "Um conceito de luxo sofisticado e romântico, com bangalôs estrategicamente posicionados.",
                pros: ["Romance Sofisticado", "Vistas deslumbrantes", "Ideal para casais"],
                price: "$$$",
                color: "green"
              },
              {
                name: "Pousada Zé Maria",
                description: "Uma verdadeira instituição na ilha, a Zé Maria combina luxo com uma atmosfera vibrante e sociável.",
                pros: ["Luxo Sociável", "Festival Gastronômico", "Piscina com vista para o Morro do Pico"],
                price: "$$",
                color: "blue"
              },
              {
                name: "Teju-Açu Ecopousada",
                description: "Perfeita para o viajante de luxo com consciência ecológica, com bangalôs suspensos entre as árvores.",
                pros: ["Eco-Chic & Alta Gastronomia", "Horta orgânica própria", "Técnicas de vanguarda"],
                price: "$$",
                color: "orange"
              }
            ].map((region, index) => {
              const regionColor = colorMap[region.color as keyof typeof colorMap];
              
              return (
                <motion.div
                  key={region.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "p-5 rounded-xl border-2 transition-all cursor-pointer",
                    regionColor.bg,
                    regionColor.border,
                    "hover:shadow-md"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={cn("font-semibold", regionColor.text)}>{region.name}</h3>
                    <span className="text-lg font-bold text-gray-500">{region.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{region.description}</p>
                  <div className="space-y-1">
                    {region.pros.map((pro) => (
                      <div key={pro} className="flex items-center gap-2 text-xs">
                        <CheckCircle className={cn("w-3 h-3", regionColor.icon)} />
                        <span className="text-gray-700">{pro}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              type: "Refúgios para Casais",
              icon: Home,
              price: "$$",
              features: ["Ecocharme Pousada do Marcílio", "Pousada Morena", "Pousada Corveta"],
              recommended: preferences.travelStyle === 'romantic',
              color: "green"
            },
            {
              type: "Aventura em Família",
              icon: Building,
              price: "$ - $$",
              features: ["Pousada da Villa", "Pousada Filó", "Pousada Vila Nakau"],
              recommended: preferences.travelStyle === 'family',
              color: "purple"
            },
            {
              type: "Análise Geográfica Estratégica",
              icon: Key,
              price: "",
              features: ["Vila dos Remédios", "Floresta Nova / Vila do Trinta", "Boldró"],
              recommended: true,
              color: "blue"
            }
          ].map((type, index) => {
            const typeColor = colorMap[type.color as keyof typeof colorMap];
            
            return (
              <motion.div
                key={type.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(cardStyles.base, "p-5 relative overflow-hidden")}
              >
                {type.recommended && (
                  <div className="absolute -top-1 -right-8 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-8 py-1 rotate-45 shadow-md">
                    Recomendado
                  </div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  typeColor.lightBg
                )}>
                  <type.icon className={cn("w-6 h-6", typeColor.icon)} />
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{type.type}</h3>
                <p className={cn("text-sm font-medium mb-3", typeColor.text)}>{type.price}</p>
                
                <ul className="space-y-2">
                  {type.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {preferences.travelDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(minimalStyles.card, "bg-gradient-to-br from-indigo-50/50 to-purple-50/50")}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Recomendação Personalizada
            </h3>
            <p className={minimalStyles.text.body}>
              Para sua viagem de <strong>{preferences.duration} dias</strong> em{" "}
              <strong>{format(preferences.travelDate, "MMMM", { locale: ptBR })}</strong>, 
              com orçamento de <strong>R$ {preferences.budget[0].toLocaleString()} a R$ {preferences.budget[1].toLocaleString()}</strong>, 
              recomendamos hospedagem em <strong>{preferences.budget[1] > 8000 ? "Praia do Sueste" : "Vila dos Remédios"}</strong>. 
              {travelData.weather.season === "Chuvosa" 
                ? " Durante a temporada chuvosa, prefira locais com área coberta e atividades indoor."
                : " Na temporada seca, aproveite pousadas com piscina e próximas às praias."
              }
            </p>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Condições do Mar</h4>
                <div className="flex items-center gap-2">
                  <Waves className={cn(
                    "w-4 h-4",
                    travelData.weather.seaCondition === 'calm' ? "text-green-600" :
                    travelData.weather.seaCondition === 'moderate' ? "text-yellow-600" :
                    "text-red-600"
                  )} />
                  <span className="text-sm capitalize">{travelData.weather.seaCondition}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Visibilidade</h4>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{travelData.weather.visibility}m</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    ),

    "transportation": (
      <div className="space-y-8">
        <div className={cn(cardStyles.base, "p-6 relative overflow-hidden")}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            Assista ao Vídeo da Seção
          </h3>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">[Vídeo em breve]</p>
          </div>
        </div>
        <div className={cn(cardStyles.base, "p-6")}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Navegando pela Ilha: Opções de Transporte</h2>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Preço</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Ideal para</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Destaques</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    type: "Transfer Privativo",
                    icon: Car,
                    price: "R$ 150-250",
                    idealFor: "Chegada e partida",
                    highlight: "Conforto, agilidade e evita paradas indesejadas.",
                    color: "purple"
                  },
                  {
                    type: "Ilha Tour Privativo",
                    icon: Car,
                    price: "R$ 800-1500/dia",
                    idealFor: "Exploração completa",
                    highlight: "Roteiro personalizado, flexibilidade de horários e guia local.",
                    color: "blue"
                  },
                  {
                    type: "Buggy",
                    icon: Car,
                    price: "R$ 200-600/dia",
                    idealFor: "Aventura independente",
                    highlight: "Liberdade para explorar cantos remotos da ilha.",
                    color: "green"
                  },
                  {
                    type: "Táxi",
                    icon: Car,
                    price: "R$ 30-80/trajeto",
                    idealFor: "Trajetos específicos",
                    highlight: "Serviço eficiente e organizado pela cooperativa Nortax.",
                    color: "orange"
                  },
                  {
                    type: "Ônibus",
                    icon: Navigation,
                    price: "R$ 5/trajeto",
                    idealFor: "Economia e autenticidade",
                    highlight: "Linha única que percorre a BR-363 de ponta a ponta.",
                    color: "yellow"
                  }
                ].map((transport) => {
                  const transportColor = colorMap[transport.color as keyof typeof colorMap];
                  
                  return (
                    <tr key={transport.type} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            transportColor.lightBg
                          )}>
                            <transport.icon className={cn("w-5 h-5", transportColor.icon)} />
                          </div>
                          <span className="font-medium text-gray-900">{transport.type}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={cn("font-medium", transportColor.text)}>{transport.price}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-gray-600">{transport.idealFor}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{transport.highlight}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardStyles.base, "p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200")}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Dicas de Transporte
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Para {preferences.duration} dias com {preferences.interests.length > 3 ? "muitas" : "algumas"} atividades:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Opção Econômica</p>
                  <p className="text-lg font-bold text-green-700">
                    Ônibus + Táxi ocasional
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    ~R$ {(preferences.duration * 40).toLocaleString()} total
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Opção Conforto</p>
                  <p className="text-lg font-bold text-green-700">
                    Buggy alugado
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    ~R$ {(preferences.duration * 400).toLocaleString()} total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(cardStyles.base, "p-5 bg-orange-50 border-2 border-orange-200")}
          >
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Horários e Reservas
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Reserve buggy e passeios com antecedência, especialmente na alta temporada.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>O serviço de táxi funciona 24h, mas é recomendável agendar corridas noturnas.</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(cardStyles.base, "p-5 bg-green-50 border-2 border-green-200")}
          >
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Dicas de Ouro
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>A ausência de apps de transporte como Uber incentiva a interação com serviços locais.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Considere um Ilha Tour Privativo no primeiro dia para uma visão geral da ilha.</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    ),

    "beaches": (
      <div className="space-y-8">
        <div className={cn(cardStyles.base, "p-6 relative overflow-hidden")}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-cyan-600" />
            Assista ao Vídeo da Seção
          </h3>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">[Vídeo em breve]</p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">As Joias do Atlântico: Um Roteiro Pelas Praias</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Baía do Sancho",
                rating: 5,
                difficulty: "Difícil",
                features: ["Repetidamente eleita uma das praias mais bonitas do mundo", "Acesso por escada em fenda rochosa", "Ideal para visitar cedo"],
                access: "Escada íngreme entre rochas",
                bestTime: "Manhã cedo",
                image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
                color: "cyan"
              },
              {
                name: "Baía dos Porcos",
                rating: 5,
                difficulty: "Moderado",
                features: ["Famosa pelas piscinas naturais de águas esverdeadas", "Vista clássica do Morro Dois Irmãos", "Paraíso para snorkeling"],
                access: "Trilha curta e rochosa",
                bestTime: "Maré baixa",
                image: "https://images.unsplash.com/photo-1527004760000-e4c3bf54b1b3?w=400&h=300&fit=crop",
                color: "blue"
              },
              {
                name: "Praia do Leão",
                rating: 4,
                difficulty: "Fácil",
                features: ["Principal santuário para a desova de tartarugas marinhas", "Acesso controlado e fecha mais cedo", "Mar forte, exige cautela"],
                access: "Acesso controlado",
                bestTime: "Final da tarde",
                image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop",
                color: "green"
              }
            ].map((beach, index) => {
              const beachColor = colorMap[beach.color as keyof typeof colorMap];
              
              return (
                <motion.div
                  key={beach.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={cn(cardStyles.base, "overflow-hidden group cursor-pointer")}
                  onClick={() => onToggleFavorite(beach.name)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={beach.image}
                      alt={beach.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <button className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
                        <Heart className={cn(
                          "w-5 h-5",
                          favorites.includes(beach.name)
                            ? "text-red-500 fill-red-500"
                            : "text-white"
                        )} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-lg font-bold text-white mb-1">{beach.name}</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < beach.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-400"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        beach.difficulty === "Fácil" ? "bg-green-100 text-green-700" :
                        beach.difficulty === "Moderado" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        Acesso: {beach.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">
                        Melhor: {beach.bestTime}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {beach.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500 italic">
                      Acesso: {beach.access}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className={cn(cardStyles.base, "p-6")}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-600" />
            A Dualidade das Águas: Mar de Dentro vs. Mar de Fora
          </h3>
          <div className="bg-cyan-50 rounded-xl p-6 border-2 border-cyan-200">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Mar de Dentro</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Costa virada para o Brasil, ideal para natação e snorkeling de abril a setembro.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Mar de Fora</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Costa virada para a África, com mar mais calmo de dezembro a março.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardStyles.base, "p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200")}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Os Aquários Naturais: Atalaia e Sueste
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { item: "Agendamento obrigatório no ICMBio", essential: true },
              { item: "Uso de protetor solar proibido na Praia da Atalaia", essential: true },
              { item: "Uso de colete salva-vidas obrigatório na Praia do Sueste", essential: true },
              { item: "Flutuação limitada a 30 minutos na Praia da Atalaia", essential: false },
              { item: "Nadar com tartarugas e raias no Sueste", essential: false },
              { item: "Contratar um guia para a trilha da Atalaia", essential: false }
            ].map((gear) => (
              <div
                key={gear.item}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  gear.essential ? "bg-blue-100" : "bg-white"
                )}
              >
                <CheckCircle className={cn(
                  "w-5 h-5",
                  gear.essential ? "text-blue-600" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-sm",
                  gear.essential ? "font-medium text-gray-900" : "text-gray-600"
                )}>
                  {gear.item}
                </span>
                {gear.essential && (
                  <span className="text-xs text-blue-600 font-medium ml-auto">
                    Essencial
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    ),

    "dining": (
      <div className="space-y-8">
        <div className={cn(cardStyles.base, "p-6 relative overflow-hidden")}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-orange-600" />
            Assista ao Vídeo da Seção
          </h3>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">[Vídeo em breve]</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              category: "Jantares Memoráveis",
              icon: Fish,
              avgPrice: "$$ - $$",
              mustTry: "Cacimba Bistrô & Xica da Silva",
              color: "blue"
            },
            {
              category: "Restaurantes de Pousadas",
              icon: Utensils,
              avgPrice: "$$ - $$$",
              mustTry: "Maravilha, NANNAI, Teju-Açu",
              color: "orange"
            },
            {
              category: "O Ritual do Pôr do Sol",
              icon: Globe,
              avgPrice: "$ - $$",
              mustTry: "Mergulhão, Bar do Meio, Forte do Boldró",
              color: "purple"
            },
            {
              category: "Eventos Gastronômicos",
              icon: Heart,
              avgPrice: "$$ - $$",
              mustTry: "Festival Gastronômico do Zé Maria, Peixada do Solón",
              color: "green"
            }
          ].map((cat, index) => {
            const catColor = colorMap[cat.color as keyof typeof colorMap];
            
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={cn(cardStyles.base, "p-5 text-center")}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                  `bg-gradient-to-br ${catColor.gradient} shadow-lg`
                )}>
                  <cat.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{cat.category}</h3>
                <p className={cn("text-sm font-medium mb-2", catColor.text)}>{cat.avgPrice}</p>
                <p className="text-xs text-gray-600">
                  Imperdível: <span className="font-medium">{cat.mustTry}</span>
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className={cn(cardStyles.base, "p-6")}>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            A Tradição Local: Onde Comer o Peixe na Folha de Bananeira
          </h3>
          <div className="space-y-4">
            {[
              {
                name: "Jantar Romântico",
                cuisine: "NANNAI / Teju-Açu",
                highlight: "Reserve com antecedência e peça uma mesa na varanda para uma experiência mais íntima.",
                rating: 5,
                color: "purple"
              },
              {
                name: "Pôr do Sol Espetacular",
                cuisine: "Mergulhão / Bar do Meio",
                highlight: "Chegue pelo menos uma hora antes do pôr do sol para garantir uma boa mesa e aproveitar a mudança de cores no céu.",
                rating: 5,
                color: "green"
              },
              {
                name: "Experiência-Evento",
                cuisine: "Festival Gastronômico do Zé Maria",
                highlight: "Reserve online com, no mínimo, dois meses de antecedência. É uma das experiências mais concorridas da ilha.",
                rating: 4,
                color: "blue"
              },
              {
                name: "Almoço com Vista",
                cuisine: "Cacimba Bistrô / O Pico",
                highlight: "Peça a sugestão do chef ou o peixe fresco do dia. A vista durante o dia é tão espetacular quanto à noite.",
                rating: 4,
                color: "orange"
              }
            ].map((restaurant) => {
              const restColor = colorMap[restaurant.color as keyof typeof colorMap];
              
              return (
                <motion.div
                  key={restaurant.name}
                  whileHover={{ x: 4 }}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl transition-all",
                    "hover:bg-gray-50 cursor-pointer"
                  )}
                  onClick={() => onToggleFavorite(restaurant.name)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    restColor.lightBg
                  )}>
                    <UtensilsCrossed className={cn("w-6 h-6", restColor.icon)} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                        <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3 h-3",
                                i < restaurant.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{restaurant.highlight}</p>
                  </div>
                  
                  <Heart className={cn(
                    "w-5 h-5 flex-shrink-0",
                    favorites.includes(restaurant.name)
                      ? "text-red-500 fill-red-500"
                      : "text-gray-400"
                  )} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    ),

    "monthly-guide": (
      <div className="space-y-8">
        <div className={cn(cardStyles.base, "p-6 relative overflow-hidden")}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-yellow-600" />
            Assista ao Vídeo da Seção
          </h3>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">[Vídeo em breve]</p>
          </div>
        </div>
        <div className={cn(cardStyles.base, "p-6")}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">O Calendário de Noronha: A Melhor Época para a Sua Viagem Perfeita</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Sun className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Estação Seca (Agosto a Fevereiro)</h3>
                  <p className="text-sm text-gray-600">Dias mais ensolarados e menor probabilidade de chuva.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { activity: "Mergulhadores", quality: "Setembro e Outubro", icon: Activity },
                  { activity: "Amantes de Praia e Famílias", quality: "Agosto e Setembro", icon: Users },
                  { activity: "Surfistas", quality: "Janeiro e Fevereiro", icon: Waves }
                ].map((item) => (
                  <div key={item.activity} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <item.icon className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-900">{item.activity}</span>
                    <span className="text-sm text-yellow-700 ml-auto">{item.quality}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CloudRain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Estação Chuvosa (Março a Julho)</h3>
                  <p className="text-sm text-gray-600">Preços mais baixos e ilha mais vazia.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { activity: "Economizar e Fugir das Multidões", quality: "Abril a Junho", icon: TrendingDown },
                  { activity: "Temporada de Swell", quality: "Dezembro a Março", icon: Waves },
                  { activity: "Temporada Flat", quality: "Abril a Setembro", icon: Wind }
                ].map((item) => (
                  <div key={item.activity} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <item.icon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">{item.activity}</span>
                    <span className="text-sm text-blue-700 ml-auto">{item.quality}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardStyles.base, "p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200")}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            O Calendário da Vida Selvagem e Eventos Culturais
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { event: "Desova das Tartarugas Marinhas", date: "Dezembro a Julho", description: "Pico entre Fevereiro e Abril, principalmente na Praia do Leão." },
              { event: "Festivais Anuais", date: "Agosto", description: "O Love Noronha, um festival de música e cultura LGBTQ+, acontece geralmente em Agosto." }
            ].map((event) => (
              <div key={event.event} className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-medium text-gray-900">{event.event}</h4>
                <p className="text-sm text-purple-600 font-medium">{event.date}</p>
                <p className="text-xs text-gray-600 mt-1">{event.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  };

  return (
    <div>
      {content[sectionId as keyof typeof content] || (
        <div className="text-center py-12">
          <p className="text-gray-500">Conteúdo em desenvolvimento...</p>
        </div>
      )}
    </div>
  );
}

function getHeroImage(sectionId: string): string {
  const unsplashImages: Record<string, string> = {
    "boas-vindas": "/images/welcome-hero.png", // Fernando de Noronha aerial view
    "accommodation": "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Hotel room with a view
    "transportation": "/images/transfer-hero-guide.png", // Car on a scenic road
    "beaches": "/images/praias-hero.png", // Tropical beach
    "dining": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Restaurant with ocean view
    "monthly-guide": "/images/when-to-go.png", // Calendar or seasonal image
    "default": "https://images.unsplash.com/photo-1501612780327-45045538742d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Default image
  };
  return unsplashImages[sectionId] || unsplashImages["default"];
}

function GuiaPageContent() {
  const [activeSection, setActiveSection] = useState<string>("boas-vindas");
  const [preferences, setPreferences] = useState<UserPreferences>({
    travelDate: undefined,
    duration: 7,
    budget: [3000, 8000],
    interests: [],
    difficultyLevel: 'moderate',
    travelStyle: 'adventure',
    groupSize: 2,
    dietaryRestrictions: [],
    accessibility: false
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [bookmarkedSections, setBookmarkedSections] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});
  const [searchResults, setSearchResults] = useState<SearchableContent[]>([]);
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [filters, setFilters] = useState<AdvancedFilters>({
    priceRange: 'all',
    activityType: [],
    beachType: [],
    restaurantCuisine: [],
    accommodationType: [],
    accessibility: false,
    familyFriendly: false,
    petFriendly: false
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const bind = useGesture({
    onDrag: ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      if (isMobile && (Math.abs(mx) > 100 || Math.abs(vx) > 1)) {
        const currentIndex = guideSections.findIndex(s => s.id === activeSection);
        if (dx > 0 && currentIndex > 0) {
          setActiveSection(guideSections[currentIndex - 1].id);
          cancel();
        } else if (dx < 0 && currentIndex < guideSections.length - 1) {
          setActiveSection(guideSections[currentIndex + 1].id);
          cancel();
        }
      }
    }
  }, { drag: { axis: 'x', filterTaps: true, threshold: 20 } });

  const travelData = useMemo((): TravelData => {
    if (!preferences.travelDate) {
      return {
        weather: { temperature: 27, humidity: 75, rainChance: 30, season: 'Seca', seaCondition: 'moderate', visibility: 30 },
        prices: { accommodation: 450, transport: 200, activities: 150, meals: 100 },
        crowds: 'medium',
        bestActivities: ['Mergulho', 'Trilhas', 'Praias'],
        events: []
      };
    }
    const month = preferences.travelDate.getMonth();
    if (month >= 11 || month <= 5) { // Wet season
      return {
        weather: { temperature: 28, humidity: 85, rainChance: 70, season: 'Chuvosa', seaCondition: month >= 0 && month <= 2 ? 'rough' : 'moderate', visibility: 20 },
        prices: { accommodation: 650, transport: 300, activities: 200, meals: 120 },
        crowds: 'high',
        bestActivities: ['Mergulho', 'Gastronomia', 'Observação de fauna'],
        events: month === 1 ? [{name: 'Carnaval', date: 'Fevereiro', type: 'cultural'}] : month === 5 ? [{name: 'São João', date: '29 de Junho', type: 'tradicional'}] : []
      };
    } else { // Dry season
      return {
        weather: { temperature: 25, humidity: 65, rainChance: 15, season: 'Seca', seaCondition: 'calm', visibility: 50 },
        prices: { accommodation: 400, transport: 180, activities: 120, meals: 90 },
        crowds: 'low',
        bestActivities: ['Todas as praias', 'Trilhas', 'Fotografia', 'Mergulho livre'],
        events: month === 8 ? [{name: 'Festival Gastronômico', date: 'Setembro', type: 'gastronomia'}] : month === 9 ? [{name: 'Regata Refeno', date: 'Outubro', type: 'esportivo'}] : []
      };
    }
  }, [preferences.travelDate]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadProgress(progress);
      setShowScrollTop(scrollTop > 300);
    };

    const mainEl = contentRef.current;
    mainEl?.addEventListener('scroll', handleScroll);
    return () => mainEl?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIndex = guideSections.findIndex(s => s.id === activeSection);
        if (e.key === 'ArrowLeft' && currentIndex > 0) setActiveSection(guideSections[currentIndex - 1].id);
        else if (e.key === 'ArrowRight' && currentIndex < guideSections.length - 1) setActiveSection(guideSections[currentIndex + 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleFavorite = (item: string) => {
    setFavorites(prev => 
      prev.includes(item) 
        ? prev.filter(f => f !== item)
        : [...prev, item]
    );
  };

  const currentSectionData = guideSections.find(s => s.id === activeSection);
  const currentColor = colorMap[currentSectionData?.color as keyof typeof colorMap] || colorMap.blue;

  const searchableContent: SearchableContent[] = [
    { id: 'sancho', type: 'beach', title: 'Baía do Sancho', description: 'Melhor praia do mundo com águas cristalinas', tags: ['praia', 'mergulho', 'snorkel'], section: 'beaches', keywords: ['sancho', 'melhor praia', 'escada'] },
    { id: 'leao', type: 'beach', title: 'Praia do Leão', description: 'Desova de tartarugas e pôr do sol', tags: ['praia', 'tartarugas', 'por do sol'], section: 'beaches', keywords: ['leao', 'tartaruga', 'desova'] },
    { id: 'porcos', type: 'beach', title: 'Baía dos Porcos', description: 'Piscinas naturais e vista dos Dois Irmãos', tags: ['praia', 'piscina natural'], section: 'beaches', keywords: ['porcos', 'piscina', 'dois irmaos'] },
    { id: 'cacimba', type: 'beach', title: 'Cacimba do Padre', description: 'Praia de surf com faixa extensa de areia', tags: ['praia', 'surf'], section: 'beaches', keywords: ['cacimba', 'surf', 'areia'] },
    { id: 'sueste', type: 'beach', title: 'Praia do Sueste', description: 'Tartarugas marinhas e tubarões', tags: ['praia', 'fauna'], section: 'beaches', keywords: ['sueste', 'tubarao', 'tartaruga'] },
    { id: 'atalaia', type: 'beach', title: 'Atalaia', description: 'Aquário natural com limite de visitantes', tags: ['praia', 'aquario'], section: 'beaches', keywords: ['atalaia', 'aquario natural', 'piscina'] },
  ];

  const searchContent = (query: string): SearchableContent[] => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];
    const queryTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
    return searchableContent
      .map(content => {
        const searchTargets = [content.title, content.description, ...content.tags, ...content.keywords].join(' ').toLowerCase();
        let score = 0;
        queryTerms.forEach(term => {
          if (content.title.toLowerCase().includes(term)) score += 3;
          if (content.description.toLowerCase().includes(term)) score += 2;
          if (searchTargets.includes(term)) score += 1;
        });
        return { ...content, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...content }) => content);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-70" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-tl from-cyan-100 via-indigo-100 to-purple-100 opacity-40"
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        style={{
          y: heroParallax,
          opacity: heroOpacity,
          scale: heroScale,
          backgroundImage: `url(${getHeroImage(activeSection)})`,
        }}
        className={cn(
          "relative h-[40vh] md:h-[50vh] lg:h-[60vh] bg-cover bg-center flex items-center justify-center text-white shadow-lg",
          "before:absolute before:inset-0 before:bg-black/40 before:z-10"
        )}
      >
        <div className="relative z-20 text-center p-4">
          <motion.h1
            className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {currentSectionData?.title}
          </motion.h1>
          <motion.p
            className="mt-2 text-lg md:text-xl opacity-90 max-w-2xl mx-auto drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {currentSectionData?.description}
          </motion.p>
        </div>
      </motion.div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput
          placeholder="Buscar em todo o guia..."
          onValueChange={(value) => setSearchResults(searchContent(value))}
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {searchResults.length > 0 && (
            <CommandGroup heading="Resultados">
              {searchResults.map((result) => (
                <CommandItem key={result.id} onSelect={() => {
                  scrollToSection(result.section);
                  setCommandOpen(false);
                }}>
                  <span>{result.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      <div className="flex h-screen overflow-hidden">
        {!isMobile && (
          <aside className="w-80 h-full sticky top-0 overflow-y-auto p-6 space-y-6 bg-white/60 backdrop-blur-lg border-r border-gray-200/80">
            <h2 className="text-2xl font-bold text-gray-800">Navegue pelo Guia</h2>
            <ul className="space-y-2">
              {guideSections.map(section => {
                const color = colorMap[section.color as keyof typeof colorMap];
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id}>
                    <motion.button
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-lg text-left transition-all duration-200",
                        isActive ? `shadow-lg ${color.bg}` : "hover:bg-gray-100/80"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", isActive ? color.lightBg : 'bg-gray-100', color.icon)}>
                        <section.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-semibold", isActive ? color.text : 'text-gray-800')}>{section.title}</p>
                      </div>
                      {isActive && <motion.div layoutId="active-indicator" className="w-1.5 h-6 bg-blue-600 rounded-full" />}
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}

        <main {...bind()} className="flex-1 overflow-y-auto" ref={contentRef} id="main-content">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div id={activeSection} className="pt-4">
                  <SectionContent
                    sectionId={activeSection}
                    preferences={preferences}
                    travelData={travelData}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {isMobile && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-2xl p-2 flex items-center justify-around">
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={() => window.history.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-14 h-14 bg-blue-600 text-white hover:bg-blue-700">
                  <Menu className="h-6 w-6" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Navegar pelo Guia</DrawerTitle>
                  <DrawerDescription>Selecione uma seção para explorar.</DrawerDescription>
                </DrawerHeader>
                <div className="p-4">
                  <ul className="space-y-2">
                    {guideSections.map(section => {
                      const color = colorMap[section.color as keyof typeof colorMap];
                      return (
                        <li key={section.id}>
                          <button
                            onClick={() => {
                              scrollToSection(section.id);
                              setMobileMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-lg text-left transition-colors",
                              activeSection === section.id ? `${color.bg} ${color.text}` : "hover:bg-gray-100"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color.lightBg, color.icon)}>
                              <section.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{section.title}</p>
                              <p className="text-sm opacity-70">{section.quickInfo}</p>
                            </div>
                            {activeSection === section.id && <CheckCircle className="w-5 h-5" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </DrawerContent>
            </Drawer>
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={() => setCommandOpen(true)}>
              <Search className="h-6 w-6" />
            </Button>
          </div>
        </motion.div>
      )}

      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-28 right-4 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg"
        >
          <ArrowUp className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}

export default GuiaPageContent;
  