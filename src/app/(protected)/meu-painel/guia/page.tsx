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
  Fish, Key, ArrowUp, Command, Search, Mic, Hash, BookOpen, Layers, Shirt, Wallet
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
            Checklist Essencial do Viajante Premium
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
            <h3 className={cn(minimalStyles.text.title, "mb-4 flex items-center gap-2")}>
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
                          <CheckCircle className={cn("w-4 h-4", beachColor.icon)} />
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
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});
  const [searchResults, setSearchResults] = useState<SearchableContent[]>([]);
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [showFilters, setShowFilters] = useState(false);
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
  
  // Parallax scroll values
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);
  
  // Mouse position for interactive effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Gesture handling for mobile swipes
  const bind = useGesture({
    onDrag: ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      if (Math.abs(mx) > 200 || Math.abs(vx) > 2) {
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
  });

  // Dados dinâmicos baseados na data de viagem
  const travelData = useMemo((): TravelData => {
    if (!preferences.travelDate) {
      return {
        weather: { 
          temperature: 27, 
          humidity: 75, 
          rainChance: 30, 
          season: 'Seca',
          seaCondition: 'moderate',
          visibility: 30
        },
        prices: { 
          accommodation: 450, 
          transport: 200, 
          activities: 150,
          meals: 100
        },
        crowds: 'medium',
        bestActivities: ['Mergulho', 'Trilhas', 'Praias'],
        events: []
      };
    }

    const month = preferences.travelDate.getMonth();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Estação chuvosa (Dec-Jun) vs Seca (Jul-Nov)
    if (month >= 11 || month <= 5) {
      return {
        weather: { 
          temperature: 28, 
          humidity: 85, 
          rainChance: 70, 
          season: 'Chuvosa',
          seaCondition: month >= 0 && month <= 2 ? 'rough' : 'moderate',
          visibility: 20
        },
        prices: { 
          accommodation: 650, 
          transport: 300, 
          activities: 200,
          meals: 120
        },
        crowds: 'high',
        bestActivities: ['Mergulho', 'Gastronomia', 'Observação de fauna'],
        events: month === 1 ? [{name: 'Carnaval', date: 'Fevereiro', type: 'cultural'}] : 
                month === 5 ? [{name: 'São João', date: '29 de Junho', type: 'tradicional'}] : []
      };
    } else {
      return {
        weather: { 
          temperature: 25, 
          humidity: 65, 
          rainChance: 15, 
          season: 'Seca',
          seaCondition: 'calm',
          visibility: 50
        },
        prices: { 
          accommodation: 400, 
          transport: 180, 
          activities: 120,
          meals: 90
        },
        crowds: 'low',
        bestActivities: ['Todas as praias', 'Trilhas', 'Fotografia', 'Mergulho livre'],
        events: month === 8 ? [{name: 'Festival Gastronômico', date: 'Setembro', type: 'gastronomia'}] :
                month === 9 ? [{name: 'Regata Refeno', date: 'Outubro', type: 'esportivo'}] : []
      };
    }
  }, [preferences.travelDate]);

  // Tracking de progresso de leitura e scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = contentRef.current.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const progress = Math.min((scrollTop / documentHeight) * 100, 100);
      
      setReadProgress(progress);
      setShowScrollTop(scrollTop > 300);
      
      // Track section progress
      const sections = contentRef.current.querySelectorAll('[data-section]');
      const newProgress: Record<string, number> = {};
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionId = section.getAttribute('data-section') || '';
        const sectionTop = rect.top + scrollTop;
        const sectionHeight = rect.height;
        const viewportBottom = scrollTop + windowHeight;
        
        if (viewportBottom > sectionTop) {
          const visibleHeight = Math.min(viewportBottom - sectionTop, sectionHeight);
          newProgress[sectionId] = Math.min((visibleHeight / sectionHeight) * 100, 100);
        } else {
          newProgress[sectionId] = 0;
        }
      });
      
      setSectionProgress(newProgress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIndex = guideSections.findIndex(s => s.id === activeSection);
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          setActiveSection(guideSections[currentIndex - 1].id);
        } else if (e.key === 'ArrowRight' && currentIndex < guideSections.length - 1) {
          setActiveSection(guideSections[currentIndex + 1].id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection]);
  
  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Funções auxiliares
  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleFavorite = (item: string) => {
    setFavorites(prev => 
      prev.includes(item) 
        ? prev.filter(f => f !== item)
        : [...prev, item]
    );
  };

  const toggleBookmark = (sectionId: string) => {
    setBookmarkedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
    toast.success(
      bookmarkedSections.includes(sectionId) 
        ? "Seção removida dos favoritos" 
        : "Seção adicionada aos favoritos"
    );
  };

  const shareSection = async () => {
    const section = guideSections.find(s => s.id === activeSection);
    if (navigator.share && section) {
      try {
        await navigator.share({
          title: `Guia Fernando de Noronha - ${section.title}`,
          text: section.description,
          url: window.location.href
        });
      } catch (err) {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado!");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Função para obter a imagem do hero baseada na seção ativa
  const getHeroImage = (sectionId: string) => {
    const heroImages: Record<string, string> = {
      "getting-started": "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=1200&h=600&fit=crop&q=80",
      "accommodation": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop&q=80", 
      "transportation": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=600&fit=crop&q=80",
      "beaches": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=600&fit=crop&q=80",
      "dining": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=600&fit=crop&q=80",
      "monthly-guide": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&q=80"
    };
    return heroImages[sectionId] || heroImages["getting-started"];
  };

  const currentSectionData = guideSections.find(s => s.id === activeSection);
  const currentColor = colorMap[currentSectionData?.color as keyof typeof colorMap] || colorMap.blue;
  
  // Searchable content database
  const searchableContent: SearchableContent[] = [
    // Beaches
    { id: 'sancho', type: 'beach', title: 'Baía do Sancho', description: 'Melhor praia do mundo com águas cristalinas', tags: ['praia', 'mergulho', 'snorkel'], section: 'beaches', keywords: ['sancho', 'melhor praia', 'escada'] },
    { id: 'leao', type: 'beach', title: 'Praia do Leão', description: 'Desova de tartarugas e pôr do sol', tags: ['praia', 'tartarugas', 'por do sol'], section: 'beaches', keywords: ['leao', 'tartaruga', 'desova'] },
    { id: 'porcos', type: 'beach', title: 'Baía dos Porcos', description: 'Piscinas naturais e vista dos Dois Irmãos', tags: ['praia', 'piscina natural'], section: 'beaches', keywords: ['porcos', 'piscina', 'dois irmaos'] },
    { id: 'cacimba', type: 'beach', title: 'Cacimba do Padre', description: 'Praia de surf com faixa extensa de areia', tags: ['praia', 'surf'], section: 'beaches', keywords: ['cacimba', 'surf', 'areia'] },
    { id: 'sueste', type: 'beach', title: 'Praia do Sueste', description: 'Tartarugas marinhas e tubarões', tags: ['praia', 'fauna'], section: 'beaches', keywords: ['sueste', 'tubarao', 'tartaruga'] },
    { id: 'atalaia', type: 'beach', title: 'Atalaia', description: 'Aquário natural com limite de visitantes', tags: ['praia', 'aquario'], section: 'beaches', keywords: ['atalaia', 'aquario natural', 'piscina'] },
    
    // Restaurants
    { id: 'varanda', type: 'restaurant', title: 'Varanda', description: 'Gastronomia contemporânea com vista panorâmica', tags: ['restaurante', 'fino'], section: 'dining', keywords: ['varanda', 'vista', 'gourmet'] },
    { id: 'xica', type: 'restaurant', title: 'Xica da Silva', description: 'Melhor peixe na folha de bananeira', tags: ['restaurante', 'regional'], section: 'dining', keywords: ['xica', 'peixe', 'folha'] },
    { id: 'mergulhao', type: 'restaurant', title: 'Mergulhão', description: 'Frutos do mar e pôr do sol', tags: ['restaurante', 'frutos do mar'], section: 'dining', keywords: ['mergulhao', 'lagosta', 'por do sol'] },
    
    // Activities
    { id: 'mergulho', type: 'activity', title: 'Mergulho', description: 'Mergulho com cilindro em pontos famosos', tags: ['atividade', 'mar'], section: 'beaches', keywords: ['mergulho', 'cilindro', 'submarino'] },
    { id: 'trilha-atalaia', type: 'activity', title: 'Trilha do Atalaia', description: 'Trilha curta até piscinas naturais', tags: ['atividade', 'trilha'], section: 'beaches', keywords: ['trilha', 'atalaia', 'caminhada'] },
    { id: 'planasub', type: 'activity', title: 'Planasub', description: 'Snorkel puxado por barco', tags: ['atividade', 'mar'], section: 'beaches', keywords: ['planasub', 'snorkel', 'barco'] },
    
    // Tips
    { id: 'taxa', type: 'tip', title: 'Taxa de Preservação', description: 'R$ 92,89 por dia de permanência', tags: ['dica', 'taxa'], section: 'getting-started', keywords: ['taxa', 'preservacao', 'tpa'] },
    { id: 'protetor', type: 'tip', title: 'Protetor Solar', description: 'Use apenas protetor reef-safe', tags: ['dica', 'protetor'], section: 'beaches', keywords: ['protetor', 'reef safe', 'coral'] },
    
    // Getting Started - Como Chegar
    { id: 'voos', type: 'tip', title: 'Voos para Noronha', description: 'Voos diários saindo de Recife, Natal e São Paulo', tags: ['transporte', 'aviao', 'como chegar'], section: 'getting-started', keywords: ['voo', 'aeroporto', 'gol', 'azul', 'latam'] },
    { id: 'documentos', type: 'tip', title: 'Documentação Necessária', description: 'RG ou CNH, cartão de vacina e comprovante TPA', tags: ['documentos', 'obrigatorio'], section: 'getting-started', keywords: ['documento', 'identidade', 'vacina'] },
    { id: 'tcfa', type: 'tip', title: 'Cartão de Controle Migratório', description: 'Formulário preenchido online ou no aeroporto', tags: ['documento', 'migracao'], section: 'getting-started', keywords: ['tcfa', 'formulario', 'migratorio'] },
    
    // Accommodation - Hospedagem
    { id: 'vila-remedios', type: 'accommodation', title: 'Vila dos Remédios', description: 'Centro comercial, mais opções de pousadas econômicas', tags: ['hospedagem', 'centro'], section: 'accommodation', keywords: ['vila', 'remedios', 'centro', 'barato'] },
    { id: 'floresta-nova', type: 'accommodation', title: 'Floresta Nova', description: 'Área residencial tranquila, perto do aeroporto', tags: ['hospedagem', 'tranquilo'], section: 'accommodation', keywords: ['floresta', 'nova', 'aeroporto'] },
    { id: 'praia-sueste', type: 'accommodation', title: 'Praia do Sueste', description: 'Pousadas de luxo com vista para o mar', tags: ['hospedagem', 'luxo'], section: 'accommodation', keywords: ['sueste', 'luxo', 'vista mar'] },
    
    // Transportation - Transporte
    { id: 'buggy', type: 'activity', title: 'Aluguel de Buggy', description: 'R$ 300-500/dia, melhor opção de autonomia', tags: ['transporte', 'buggy'], section: 'transportation', keywords: ['buggy', 'aluguel', 'carro'] },
    { id: 'taxi', type: 'activity', title: 'Táxi', description: 'R$ 30-50 por corrida, disponível 24h', tags: ['transporte', 'taxi'], section: 'transportation', keywords: ['taxi', 'corrida'] },
    { id: 'onibus', type: 'activity', title: 'Ônibus Coletivo', description: 'R$ 5 por trecho, passa de hora em hora', tags: ['transporte', 'onibus'], section: 'transportation', keywords: ['onibus', 'coletivo', 'economico'] },
    
    // More beaches
    { id: 'americano', type: 'beach', title: 'Praia do Americano', description: 'Pequena e protegida, ótima para crianças', tags: ['praia', 'familia'], section: 'beaches', keywords: ['americano', 'crianca', 'protegida'] },
    { id: 'boldro', type: 'beach', title: 'Praia do Boldro', description: 'Melhor pôr do sol da ilha', tags: ['praia', 'por do sol'], section: 'beaches', keywords: ['boldro', 'sunset', 'entardecer'] },
    { id: 'conceicao', type: 'beach', title: 'Praia da Conceição', description: 'Popular entre locais, boa para surf', tags: ['praia', 'surf'], section: 'beaches', keywords: ['conceicao', 'surf', 'local'] },
    
    // Restaurants
    { id: 'paludo', type: 'restaurant', title: 'Restaurante do Paludo', description: 'Comida caseira e preços justos', tags: ['restaurante', 'economico'], section: 'dining', keywords: ['paludo', 'caseiro', 'barato'] },
    { id: 'zeze', type: 'restaurant', title: 'Restaurante do Zé Maria', description: 'Festival gastronômico às quartas e sábados', tags: ['restaurante', 'festival'], section: 'dining', keywords: ['ze maria', 'festival', 'gastronomico'] },
    { id: 'teju', type: 'restaurant', title: 'Teju-Açu', description: 'Cozinha contemporânea com ingredientes locais', tags: ['restaurante', 'contemporaneo'], section: 'dining', keywords: ['teju', 'acu', 'moderno'] },
    
    // Monthly Guide
    { id: 'janeiro', type: 'tip', title: 'Janeiro - Alta temporada', description: 'Praias lotadas, preços altos, mar agitado', tags: ['quando ir', 'mes'], section: 'monthly-guide', keywords: ['janeiro', 'verao', 'alta temporada'] },
    { id: 'setembro', type: 'tip', title: 'Setembro - Melhor época', description: 'Mar calmo, pouca chuva, preços médios', tags: ['quando ir', 'mes'], section: 'monthly-guide', keywords: ['setembro', 'melhor epoca', 'ideal'] },
    { id: 'marco', type: 'tip', title: 'Março - Época das chuvas', description: 'Chuvas frequentes mas curtas, preços baixos', tags: ['quando ir', 'mes'], section: 'monthly-guide', keywords: ['marco', 'chuva', 'baixa temporada'] },
  ];
  
  // Enhanced search function with fuzzy matching
  const searchContent = (query: string): SearchableContent[] => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];
    
    // Split query into terms for better matching
    const queryTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
    
    return searchableContent
      .map(content => {
        const searchTargets = [
          content.title,
          content.description,
          ...content.tags,
          ...content.keywords
        ].join(' ').toLowerCase();
        
        // Calculate relevance score
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
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-70" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-tl from-cyan-100 via-indigo-100 to-purple-100 opacity-40"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      {/* Global styles for search highlight animation */}
      <style jsx global>{`
        @keyframes highlight {
          0% {
            background-color: rgba(99, 102, 241, 0.2);
            transform: scale(1);
          }
          50% {
            background-color: rgba(99, 102, 241, 0.1);
            transform: scale(1.02);
          }
          100% {
            background-color: transparent;
            transform: scale(1);
          }
        }
        
        .highlight-animation {
          animation: highlight 2s ease-out;
          border-radius: 0.5rem;
          padding: 0.5rem;
          margin: -0.5rem;
        }
      `}</style>
      
      {/* Command Palette with Search */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput 
          placeholder="Buscar em todo o guia: praias, restaurantes, hospedagem, dicas..." 
          onValueChange={(value) => {
            const results = searchContent(value);
            setSearchResults(results);
          }}
        />
        <CommandList>
          <CommandEmpty>
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhum resultado encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Tente buscar por praias, restaurantes ou atividades</p>
            </div>
          </CommandEmpty>
          
          {/* Dynamic search results */}
          {searchResults.length > 0 && (
            <>
              <CommandGroup heading={`Resultados (${searchResults.length})`}>
                {searchResults.map((result) => {
                  const Icon = result.type === 'beach' ? Waves :
                              result.type === 'restaurant' ? Utensils :
                              result.type === 'activity' ? Activity :
                              result.type === 'accommodation' ? Home : Info;
                  
                  const typeLabel = {
                    beach: 'Praia',
                    restaurant: 'Restaurante',
                    activity: 'Atividade',
                    accommodation: 'Hospedagem',
                    tip: 'Dica'
                  }[result.type] || result.type;
                  
                  const sectionInfo = guideSections.find(s => s.id === result.section);
                  
                  return (
                    <CommandItem
                      key={result.id}
                      onSelect={() => {
                        scrollToSection(result.section);
                        // Small delay to allow section scroll before focusing on specific content
                        setTimeout(() => {
                          const element = document.getElementById(result.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.classList.add('highlight-animation');
                            setTimeout(() => element.classList.remove('highlight-animation'), 2000);
                          }
                        }, 500);
                        setCommandOpen(false);
                        toast.success(`Navegando para ${result.title}`);
                      }}
                    >
                      <Icon className="mr-3 h-4 w-4 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{result.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {sectionInfo?.title} • {typeLabel}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          
          <CommandGroup heading="Navegação Rápida">
            {guideSections.map((section) => (
              <CommandItem
                key={section.id}
                onSelect={() => {
                  scrollToSection(section.id);
                  setCommandOpen(false);
                }}
              >
                <section.icon className="mr-3 h-4 w-4" />
                <div className="flex-1">
                  <p className="font-medium">{section.title}</p>
                  <p className="text-sm text-gray-500">{section.quickInfo}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Ações Rápidas">
            <CommandItem
              onSelect={() => {
                setShowPreferences(true);
                setCommandOpen(false);
              }}
            >
              <Settings className="mr-3 h-4 w-4" />
              <span>Personalizar Viagem</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                shareSection();
                setCommandOpen(false);
              }}
            >
              <Share2 className="mr-3 h-4 w-4" />
              <span>Compartilhar Seção</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>

          </CommandGroup>
          
          <CommandSeparator />
          
          {/* Travel Style Shortcuts */}
          <CommandGroup heading="Estilos de Viagem">
            {(['adventure', 'relaxation', 'cultural', 'romantic', 'family'] as const).map((style) => {
              const styleIcons = {
                adventure: Activity,
                relaxation: Sun,
                cultural: Globe,
                romantic: Heart,
                family: Users
              };
              const StyleIcon = styleIcons[style];
              
              return (
                <CommandItem
                  key={style}
                  onSelect={() => {
                    setPreferences(prev => ({ ...prev, travelStyle: style }));
                    toast.success(`Estilo de viagem alterado para ${style}`);
                    setCommandOpen(false);
                  }}
                >
                  <StyleIcon className="mr-3 h-4 w-4" />
                  <span className="capitalize">{style}</span>
                  {preferences.travelStyle === style && (
                    <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>


      {/* Progress Bar - Always visible on mobile */}
      <div className="fixed top-0 left-0 right-0 z-[60] lg:z-50">
        <Progress value={readProgress} className="h-1 rounded-none bg-gradient-to-r from-blue-500 to-purple-600" />
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className={cn(
              "fixed left-0 top-0 bottom-0 w-80 z-50",
              minimalStyles.elevated,
              "border-r"
            )}
          >
            <div className={minimalStyles.spacing.container}>
              <div className="flex items-center justify-between py-6 border-b border-gray-100">
                <h2 className={minimalStyles.text.title}>Filtros Avançados</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100vh-88px)]">
                <div className={minimalStyles.spacing.stack}>
                  {/* Price Range Filter */}
                  <div className="py-6">
                    <h3 className="font-medium mb-4">Faixa de Preço</h3>
                    <div className="space-y-2">
                      {['budget', 'mid', 'luxury', 'all'].map((range) => (
                        <label key={range} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="priceRange"
                            value={range}
                            checked={filters.priceRange === range}
                            onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value as any }))}
                            className="text-gray-900"
                          />
                          <span className="text-sm capitalize">
                            {range === 'budget' ? 'Econômico' : 
                             range === 'mid' ? 'Intermediário' : 
                             range === 'luxury' ? 'Luxo' : 'Todos'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Activity Type Filter */}
                  <div className="py-6 border-t border-gray-100">
                    <h3 className="font-medium mb-4">Tipo de Atividade</h3>
                    <div className="space-y-2">
                      {['mergulho', 'trilha', 'praia', 'gastronomia', 'cultura'].map((activity) => (
                        <label key={activity} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.activityType.includes(activity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({ ...prev, activityType: [...prev.activityType, activity] }));
                              } else {
                                setFilters(prev => ({ ...prev, activityType: prev.activityType.filter(a => a !== activity) }));
                              }
                            }}
                            className="text-gray-900"
                          />
                          <span className="text-sm capitalize">{activity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Beach Type Filter */}
                  <div className="py-6 border-t border-gray-100">
                    <h3 className="font-medium mb-4">Tipo de Praia</h3>
                    <div className="space-y-2">
                      {['piscinas naturais', 'surf', 'snorkel', 'familiar', 'isolada'].map((beach) => (
                        <label key={beach} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.beachType.includes(beach)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({ ...prev, beachType: [...prev.beachType, beach] }));
                              } else {
                                setFilters(prev => ({ ...prev, beachType: prev.beachType.filter(b => b !== beach) }));
                              }
                            }}
                            className="text-gray-900"
                          />
                          <span className="text-sm capitalize">{beach}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Accessibility Options */}
                  <div className="py-6 border-t border-gray-100">
                    <h3 className="font-medium mb-4">Acessibilidade</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.accessibility}
                          onChange={(e) => setFilters(prev => ({ ...prev, accessibility: e.target.checked }))}
                          className="text-gray-900"
                        />
                        <span className="text-sm">Acessível para PCD</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.familyFriendly}
                          onChange={(e) => setFilters(prev => ({ ...prev, familyFriendly: e.target.checked }))}
                          className="text-gray-900"
                        />
                        <span className="text-sm">Amigável para Famílias</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.petFriendly}
                          onChange={(e) => setFilters(prev => ({ ...prev, petFriendly: e.target.checked }))}
                          className="text-gray-900"
                        />
                        <span className="text-sm">Pet Friendly</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Apply Filters Button */}
                  <div className="py-6 border-t border-gray-100">
                    <Button 
                      className={cn(minimalStyles.button.primary, "w-full")}
                      onClick={() => {
                        toast.success("Filtros aplicados!");
                        setShowFilters(false);
                      }}
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header - Minimalist Design */}
      <header className={cn("lg:hidden fixed top-1 left-0 right-0 z-40", minimalStyles.elevated)}>
        <div className="flex items-center justify-between px-4 h-16 pt-3">
          {/* Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-300",
                minimalStyles.button.ghost,
                "hover:scale-105 active:scale-95"
              )}
            >
              <Menu className={cn("h-5 w-5", currentColor.icon)} />
              {bookmarkedSections.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {bookmarkedSections.length}
                </span>
              )}
            </button>
            
            {/* Title with better typography */}
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {currentSectionData?.title}
              </h1>
              <p className="text-xs text-gray-500">Guia Completo</p>
            </div>
          </div>
          
          {/* Action buttons with better spacing */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleBookmark(activeSection)}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                bookmarkedSections.includes(activeSection) 
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              <Bookmark className={cn(
                "h-5 w-5",
                bookmarkedSections.includes(activeSection) && "fill-current"
              )} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shareSection}
              className="p-2.5 rounded-xl bg-gray-100 text-gray-600"
            >
              <Share2 className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Section Navigation - Horizontal scroll with better design */}
        <div className="px-4 pb-3">
          <ScrollArea className="w-full" type="scroll">
            <div className="flex gap-2 pb-1">
              {guideSections.map((section) => {
                const sectionColor = colorMap[section.color as keyof typeof colorMap];
                const isActive = activeSection === section.id;
                
                return (
                  <motion.button
                    key={section.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                      "flex items-center gap-2 whitespace-nowrap",
                      isActive
                        ? `bg-gradient-to-r ${sectionColor.gradient} text-white shadow-lg ${sectionColor.shadowColor}`
                        : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <section.icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-white" : sectionColor.icon
                    )} />
                    <span>{section.title}</span>
                    {bookmarkedSections.includes(section.id) && (
                      <Bookmark className="w-3 h-3 fill-current ml-1" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </header>

      {/* Mobile Drawer Menu - Completamente redesenhado */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader className="border-b bg-gray-50">
            <DrawerTitle className="text-xl">Guia de Fernando de Noronha</DrawerTitle>
            <DrawerDescription>
              Explore todas as seções do seu guia personalizado
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto">
            {/* Navigation Items */}
            <div className="p-4 space-y-2">
              {guideSections.map((section, index) => {
                const sectionColor = colorMap[section.color as keyof typeof colorMap];
                const isActive = activeSection === section.id;
                
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => {
                        setActiveSection(section.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-300",
                        isActive
                          ? `${sectionColor.bg} ${sectionColor.border} border-2 shadow-sm`
                          : "hover:bg-gray-50 active:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        "transition-all duration-300",
                        isActive
                          ? `bg-gradient-to-br ${sectionColor.gradient} text-white shadow-md`
                          : sectionColor.lightBg
                      )}>
                        <section.icon className={cn(
                          "w-6 h-6",
                          isActive ? "text-white" : sectionColor.icon
                        )} />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-semibold",
                            isActive ? sectionColor.text : "text-gray-900"
                          )}>
                            {section.title}
                          </h3>
                          {bookmarkedSections.includes(section.id) && (
                            <Bookmark className={cn(
                              "w-4 h-4 fill-current",
                              isActive ? sectionColor.icon : "text-yellow-500"
                            )} />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {section.quickInfo}
                        </p>
                        {isActive && (
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                            {section.description}
                          </p>
                        )}
                      </div>
                      
                      {isActive && (
                        <ChevronRight className={cn("w-5 h-5 mt-3", sectionColor.icon)} />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Travel Preferences Section */}
            <div className="border-t bg-gray-50 p-4">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">Personalizar Viagem</span>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-gray-400 transition-transform duration-300",
                  showPreferences && "rotate-180"
                )} />
              </button>
              
              <AnimatePresence>
                {showPreferences && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-4 overflow-hidden"
                  >
                    {/* Data de Viagem */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Quando você vai viajar?
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {preferences.travelDate 
                              ? format(preferences.travelDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              : "Selecionar data"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={preferences.travelDate}
                            onSelect={(date) => setPreferences(prev => ({ ...prev, travelDate: date }))}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Duração com visual melhorado */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Duração da viagem
                        </label>
                        <span className="text-sm font-bold text-indigo-600">
                          {preferences.duration} dias
                        </span>
                      </div>
                      <Slider
                        value={[preferences.duration]}
                        onValueChange={([value]) => setPreferences(prev => ({ ...prev, duration: value }))}
                        max={15}
                        min={3}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>3 dias</span>
                        <span>15 dias</span>
                      </div>
                    </div>

                    {/* Orçamento com visual melhorado */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Orçamento total
                        </label>
                        <span className="text-sm font-bold text-green-600">
                          R$ {preferences.budget[0].toLocaleString()} - R$ {preferences.budget[1].toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={preferences.budget}
                        onValueChange={(value) => setPreferences(prev => ({ ...prev, budget: value as [number, number] }))}
                        max={15000}
                        min={1000}
                        step={500}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>R$ 1.000</span>
                        <span>R$ 15.000</span>
                      </div>
                    </div>

                    {/* Interesses com visual melhorado */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Escolha os seus interesses
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Praias', 'Mergulho', 'Trilhas', 'Gastronomia', 'Fotografia', 'Relaxar'].map((interest) => (
                          <motion.button
                            key={interest}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleInterest(interest)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                              preferences.interests.includes(interest)
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {interest}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dynamic Travel Info */}
            {preferences.travelDate && (
              <div className="border-t p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  Informações da sua viagem
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Thermometer className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">Clima</span>
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                      {travelData.weather.temperature}°C
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {travelData.weather.season}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-4 rounded-xl border border-green-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">Preços</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      R$ {travelData.prices.accommodation}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Por diária
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm mt-3"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Recomendações</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {travelData.bestActivities.map((activity) => (
                      <Badge key={activity} variant="secondary" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          <DrawerFooter className="border-t bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const bookmarks = bookmarkedSections.map(id => 
                    guideSections.find(s => s.id === id)?.title
                  ).join(', ');
                  toast.info(`Favoritos: ${bookmarks || 'Nenhum'}`);
                }}
                className="flex items-center gap-2"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Favoritos ({bookmarkedSections.length})
              </Button>

            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Desktop Sidebar - Mantido mas melhorado com glassmorphism */}
      <aside className={cn("w-80 mt-16 fixed h-full overflow-y-auto hidden lg:block", glassStyles.base, "border-r border-white/20")}>
        <div className="p-6 border-b border-white/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Guia de Noronha
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-600"
          >
            Seu guia completo e personalizado
          </motion.p>
          
          {/* Quick search button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setCommandOpen(true)}
            className={cn(
              glassStyles.button,
              "mt-4 w-full p-2 rounded-lg flex items-center gap-2 text-sm text-gray-600"
            )}
          >
            <Search className="w-4 h-4" />
            <span>Buscar...</span>
            <kbd className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded">⌘K</kbd>
          </motion.button>
        </div>

        {/* Desktop Navigation */}
        <nav className="p-4 space-y-2">
          {guideSections.map((section) => {
            const sectionColor = colorMap[section.color as keyof typeof colorMap];
            const isActive = activeSection === section.id;
            
            return (
              <motion.button
                key={section.id}
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                  "backdrop-blur-md border",
                  isActive
                    ? `bg-gradient-to-r ${section.accentGradient} ${sectionColor.border} shadow-lg`
                    : "hover:bg-white/50 border-transparent hover:border-gray-200/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  "transition-all duration-300",
                  isActive
                    ? `bg-gradient-to-br ${sectionColor.gradient} text-white shadow-md`
                    : sectionColor.lightBg
                )}>
                  <section.icon className={cn(
                    "w-6 h-6",
                    isActive ? "text-white" : sectionColor.icon
                  )} />
                </div>
                <div className="flex-1 text-left">
                  <div className={cn(
                    "font-semibold",
                    isActive ? sectionColor.text : "text-gray-900"
                  )}>
                    {section.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {section.quickInfo}
                  </div>
                  {isActive && (
                    <div className="mt-2 text-xs text-gray-600">
                      {section.description}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2">
                  {isActive && (
                    <ChevronRight className={cn("w-4 h-4", sectionColor.icon)} />
                  )}
                  {bookmarkedSections.includes(section.id) && (
                    <Bookmark className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </nav>
        
        {/* Configurações de Viagem Desktop */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Personalizar Guia</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
              className="h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <AnimatePresence>
            {showPreferences && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Data de Viagem */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Quando você vai viajar?
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-xs h-9"
                      >
                        <Calendar className="mr-2 h-3 w-3" />
                        {preferences.travelDate 
                          ? format(preferences.travelDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={preferences.travelDate}
                        onSelect={(date) => setPreferences(prev => ({ ...prev, travelDate: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Duração */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Duração: {preferences.duration} dias
                  </label>
                  <Slider
                    value={[preferences.duration]}
                    onValueChange={([value]) => setPreferences(prev => ({ ...prev, duration: value }))}
                    max={15}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Orçamento */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Orçamento: R$ {preferences.budget[0].toLocaleString()} - R$ {preferences.budget[1].toLocaleString()}
                  </label>
                  <Slider
                    value={preferences.budget}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, budget: value as [number, number] }))}
                    max={15000}
                    min={1000}
                    step={500}
                    className="w-full"
                  />
                </div>

                {/* Interesses */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Seus interesses
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Praias', 'Mergulho', 'Trilhas', 'Gastronomia', 'Fotografia', 'Relaxar'].map((interest) => (
                      <Badge
                        key={interest}
                        variant={preferences.interests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Informações Dinâmicas Desktop */}
        {preferences.travelDate && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Sua Viagem - {format(preferences.travelDate, "MMMM/yyyy", { locale: ptBR })}
            </h3>
            <div className="space-y-3">
              <div className={cn("p-3 rounded-lg", currentColor.bg, currentColor.border, "border")}>
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className={cn("w-4 h-4", currentColor.icon)} />
                  <span className="text-sm font-medium">Clima Previsto</span>
                </div>
                <div className={cn("text-sm font-semibold", currentColor.text)}>
                  {travelData.weather.temperature}°C • {travelData.weather.season}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {travelData.weather.rainChance}% chance de chuva
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Estimativa de Custos</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Hospedagem</span>
                    <span className="font-semibold text-green-700">R$ {travelData.prices.accommodation}/dia</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Transporte</span>
                    <span className="font-semibold text-green-700">R$ {travelData.prices.transport}/dia</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Atividades</span>
                    <span className="font-semibold text-green-700">R$ {travelData.prices.activities}/dia</span>
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-3 rounded-lg border",
                travelData.crowds === 'low' 
                  ? "bg-blue-50 border-blue-200" 
                  : travelData.crowds === 'medium' 
                  ? "bg-yellow-50 border-yellow-200" 
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-2">
                  <Users className={cn(
                    "w-4 h-4",
                    travelData.crowds === 'low' 
                      ? "text-blue-600" 
                      : travelData.crowds === 'medium' 
                      ? "text-yellow-600" 
                      : "text-red-600"
                  )} />
                  <span className="text-sm font-medium">
                    Movimento: {travelData.crowds === 'low' ? 'Baixo' : travelData.crowds === 'medium' ? 'Médio' : 'Alto'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Desktop */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Estatísticas Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Praias", value: "21", icon: Waves, color: "blue" },
              { label: "Restaurantes", value: "30+", icon: Utensils, color: "orange" },
              { label: "Atividades", value: "50+", icon: Star, color: "yellow" },
              { label: "Hospedagens", value: "90+", icon: Home, color: "purple" }
            ].map((stat) => {
              const statColor = colorMap[stat.color as keyof typeof colorMap];
              return (
                <div key={stat.label} className={cn(
                  "p-3 rounded-lg border",
                  statColor.bg,
                  statColor.border
                )}>
                  <stat.icon className={cn("w-4 h-4 mb-1", statColor.icon)} />
                  <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions Desktop */}
        <div className="p-4 border-t border-gray-200 space-y-2 mb-20">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => {
              const bookmarks = bookmarkedSections.map(id => 
                guideSections.find(s => s.id === id)?.title
              ).join(', ');
              toast.info(`Seções favoritas: ${bookmarks || 'Nenhuma'}`);
            }}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Ver Favoritos ({bookmarkedSections.length})
          </Button>

        </div>
      </aside>

      {/* Main Content - Melhorado para mobile */}
      <main className="flex-1 lg:ml-80 bg-gray-50" ref={contentRef} {...bind()}>
        {/* Hero Section - Minimalist Design */}
        <motion.section 
          ref={heroRef}
          className="relative h-[60vh] lg:h-[70vh] overflow-hidden z-0"
          style={{ y: heroParallax }}
        >
          {/* Background Image with Parallax */}
          <motion.div 
            className="absolute inset-0"
            style={{ scale: heroScale }}
          >
            <Image
              src={getHeroImage(activeSection)}
              alt={currentSectionData?.title || 'Fernando de Noronha'}
              fill
              className="object-cover"
              priority
              quality={90}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
              style={{ opacity: heroOpacity }}
            />
          </motion.div>

          {/* Hero Content - Clean Typography */}
          <div className={cn(minimalStyles.spacing.container, "relative h-full flex items-end pb-12 lg:pb-16")}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <motion.p 
                className="text-white/80 text-sm uppercase tracking-wider mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentSectionData?.quickInfo}
              </motion.p>
              <h1 className={cn(minimalStyles.text.hero, "text-white mb-6")}>
                {currentSectionData?.title}
              </h1>
              <p className={cn(minimalStyles.text.subtitle, "text-white/90 max-w-2xl")}>
                {currentSectionData?.description}
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Button 
                  onClick={() => setShowFilters(true)}
                  className={cn(minimalStyles.button.primary, "gap-2")}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
                <Button 
                  onClick={() => setCommandOpen(true)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
                >
                  <Search className="w-4 h-4" />
                  Buscar (⌘K)
                </Button>
                <Button
                  onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
                >
                  <Layers className="w-4 h-4" />
                  {viewMode === 'detailed' ? 'Compacto' : 'Detalhado'}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-white/60" />
          </motion.div>
        </motion.section>

        {/* Content Container with Minimalist Layout */}
        <div className={cn(minimalStyles.spacing.container, minimalStyles.spacing.section, "relative z-10 bg-gray-50")}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Content Column */}
            <div className="lg:col-span-8">
              {/* Personalized Recommendations Card */}
              {preferences.travelDate && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(minimalStyles.card, "mb-8 bg-gradient-to-br from-indigo-50/30 to-purple-50/30")}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className={cn(minimalStyles.text.title, "flex items-center gap-2")}>
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Seu Guia Personalizado
                      </h3>
                      <p className={cn(minimalStyles.text.caption, "mt-1")}>
                        Baseado nas suas preferências de viagem
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                      {preferences.travelStyle}
                    </Badge>
                  </div>

                  {/* Key Travel Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className={minimalStyles.text.caption}>Período</p>
                      <p className="font-medium">{format(preferences.travelDate, "dd/MM", { locale: ptBR })}</p>
                    </div>
                    <div className="space-y-1">
                      <p className={minimalStyles.text.caption}>Duração</p>
                      <p className="font-medium">{preferences.duration} dias</p>
                    </div>
                    <div className="space-y-1">
                      <p className={minimalStyles.text.caption}>Grupo</p>
                      <p className="font-medium">{preferences.groupSize} pessoas</p>
                    </div>
                    <div className="space-y-1">
                      <p className={minimalStyles.text.caption}>Orçamento</p>
                      <p className="font-medium">R$ {preferences.budget[1].toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Weather and Sea Conditions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/50 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">Temperatura</p>
                        <p className="font-medium">{travelData.weather.temperature}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Chuva</p>
                        <p className="font-medium">{travelData.weather.rainChance}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Waves className={cn(
                        "w-4 h-4",
                        travelData.weather.seaCondition === 'calm' ? "text-green-600" :
                        travelData.weather.seaCondition === 'moderate' ? "text-yellow-600" :
                        "text-red-600"
                      )} />
                      <div>
                        <p className="text-xs text-gray-500">Mar</p>
                        <p className="font-medium capitalize">{
                          travelData.weather.seaCondition === 'calm' ? 'Calmo' :
                          travelData.weather.seaCondition === 'moderate' ? 'Moderado' : 'Agitado'
                        }</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-600" />
                      <div>
                        <p className="text-xs text-gray-500">Visibilidade</p>
                        <p className="font-medium">{travelData.weather.visibility}m</p>
                      </div>
                    </div>
                  </div>

                  {/* Personalized Recommendations */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Melhores Atividades para {format(preferences.travelDate, "MMMM", { locale: ptBR })}</h4>
                      <div className="flex flex-wrap gap-2">
                        {travelData.bestActivities.map((activity) => (
                          <Badge key={activity} variant="outline">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {travelData.events.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Eventos Especiais</h4>
                        <div className="space-y-2">
                          {travelData.events.map((event) => (
                            <div key={event.name} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                              <div>
                                <p className="font-medium">{event.name}</p>
                                <p className="text-sm text-gray-500">{event.date}</p>
                              </div>
                              <Badge variant="secondary">
                                {event.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Estimates */}
                    <div>
                      <h4 className="font-medium mb-2">Estimativa de Custos Diários</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Hospedagem</span>
                          <span className="font-medium">R$ {travelData.prices.accommodation}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Alimentação</span>
                          <span className="font-medium">R$ {travelData.prices.meals}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Transporte</span>
                          <span className="font-medium">R$ {travelData.prices.transport}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Atividades</span>
                          <span className="font-medium">R$ {travelData.prices.activities}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="font-medium">Total Estimado</span>
                          <span className="font-medium">
                            R$ {travelData.prices.accommodation + travelData.prices.meals + travelData.prices.transport + travelData.prices.activities}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Section Content with View Mode */}
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                data-section={activeSection}
                className={viewMode === 'compact' ? 'space-y-4' : 'space-y-8'}
              >
                <SectionContent
                  sectionId={activeSection}
                  preferences={preferences}
                  travelData={travelData}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </motion.div>
            </div>

            {/* Sidebar - Desktop Only */}
            <aside className="hidden lg:block lg:col-span-4 space-y-6">
              {/* Quick Stats Card */}
              <div className={minimalStyles.card}>
                <h3 className="font-medium mb-4">Estatísticas Rápidas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Praias visitáveis</span>
                    <span className="font-medium">21</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temperatura média</span>
                    <span className="font-medium">{travelData.weather.temperature}°C</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ocupação da ilha</span>
                    <Badge variant={travelData.crowds === 'low' ? 'secondary' : travelData.crowds === 'medium' ? 'default' : 'destructive'}>
                      {travelData.crowds === 'low' ? 'Baixa' : travelData.crowds === 'medium' ? 'Média' : 'Alta'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Share Options */}
              <div className={minimalStyles.card}>
                <h3 className="font-medium mb-4">Compartilhar</h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Calendar className="w-4 h-4" />
                    Adicionar ao Calendário
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Share2 className="w-4 h-4" />
                    Compartilhar Roteiro
                  </Button>
                </div>
              </div>

              {/* Related Sections */}
              <div className={minimalStyles.card}>
                <h3 className="font-medium mb-4">Seções Relacionadas</h3>
                <div className="space-y-2">
                  {guideSections
                    .filter(s => s.id !== activeSection)
                    .slice(0, 3)
                    .map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{section.title}</p>
                            <p className="text-xs text-gray-500">{section.quickInfo}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Action Buttons - Mobile Redesenhado */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="lg:hidden fixed bottom-24 right-4 sm:right-6 space-y-3"
          >
            <MagneticButton
              size="icon"
              onClick={scrollToTop}
              className={cn(
                glassStyles.button,
                "h-12 w-12 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0"
              )}
            >
              <ArrowUp className="h-5 w-5" />
            </MagneticButton>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating Command Button - Desktop */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="hidden lg:block fixed bottom-8 right-8 z-50"
      >
        <MagneticButton
          size="lg"
          onClick={() => setCommandOpen(true)}
          className={cn(
            glassStyles.base,
            "rounded-full shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700"
          )}
        >
          <Command className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Buscar</span>
          <kbd className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">⌘K</kbd>
        </MagneticButton>
      </motion.div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-3 items-center h-16">
          <button
            onClick={() => {
              const currentIndex = guideSections.findIndex(s => s.id === activeSection);
              if (currentIndex > 0) {
                setActiveSection(guideSections[currentIndex - 1].id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={guideSections.findIndex(s => s.id === activeSection) === 0}
            className={cn(
              "flex items-center justify-center gap-2 h-full transition-all duration-300",
              guideSections.findIndex(s => s.id === activeSection) === 0
                ? "opacity-30 cursor-not-allowed"
                : "active:bg-gray-50"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center justify-center">
            <span className="text-xs text-gray-500">
              {guideSections.findIndex(s => s.id === activeSection) + 1} / {guideSections.length}
            </span>
          </div>

          <button
            onClick={() => {
              const currentIndex = guideSections.findIndex(s => s.id === activeSection);
              if (currentIndex < guideSections.length - 1) {
                setActiveSection(guideSections[currentIndex + 1].id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={guideSections.findIndex(s => s.id === activeSection) === guideSections.length - 1}
            className={cn(
              "flex items-center justify-center gap-2 h-full transition-all duration-300",
              guideSections.findIndex(s => s.id === activeSection) === guideSections.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "active:bg-gray-50"
            )}
          >
            <span className="text-sm font-medium hidden sm:inline">Próximo</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuiaPage() {
  return (
    <GuiaPageContent />
  );
} 