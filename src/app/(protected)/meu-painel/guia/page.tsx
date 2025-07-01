"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  Fish, Key, ArrowUp
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
import { motion, AnimatePresence } from "framer-motion";
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

const guideSections = [
  {
    id: "getting-started",
    title: "Como Chegar",
    icon: Plane,
    color: "blue",
    description: "Informações completas sobre voos, taxas obrigatórias e documentação necessária para sua viagem",
    quickInfo: "3 voos diários • R$ 600 taxas"
  },
  {
    id: "accommodation", 
    title: "Hospedagem",
    icon: Home,
    color: "purple",
    description: "Conheça as melhores regiões da ilha e escolha a hospedagem ideal para sua estadia",
    quickInfo: "90+ opções • Todas as faixas"
  },
  {
    id: "transportation",
    title: "Transporte",
    icon: Car,
    color: "green",
    description: "Compare todas as opções de transporte disponíveis na ilha e escolha a melhor para você",
    quickInfo: "Buggy, taxi, ônibus"
  },
  {
    id: "beaches",
    title: "Praias",
    icon: Waves,
    color: "cyan",
    description: "Descubra as praias mais incríveis do arquipélago com dicas práticas e informações de acesso",
    quickInfo: "21 praias • Snorkel grátis"
  },
  {
    id: "dining", 
    title: "Gastronomia",
    icon: UtensilsCrossed,
    color: "orange",
    description: "Saboreie os melhores restaurantes e especialidades locais da ilha paradisíaca",
    quickInfo: "30+ restaurantes • R$ 60-200"
  },
  {
    id: "monthly-guide",
    title: "Quando Ir",
    icon: Sun,
    color: "yellow",
    description: "Planeje sua viagem conhecendo o clima e as melhores atividades para cada época do ano",
    quickInfo: "Melhor: Set-Fev • Surf: Jan-Mar"
  }
];

// Interface para preferências do usuário
interface UserPreferences {
  travelDate: Date | undefined;
  duration: number;
  budget: [number, number];
  interests: string[];
  difficultyLevel: string;
}

// Interface para dados dinâmicos
interface TravelData {
  weather: {
    temperature: number;
    humidity: number;
    rainChance: number;
    season: string;
  };
  prices: {
    accommodation: number;
    transport: number;
    activities: number;
  };
  crowds: 'low' | 'medium' | 'high';
  bestActivities: string[];
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
    "getting-started": (
      <div className="space-y-8">
        {/* Introdução com card destacado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardStyles.base, "p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50")}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plane className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Bem-vindo ao Paraíso!</h2>
              <p className="text-gray-600 leading-relaxed">
                Fernando de Noronha é um arquipélago brasileiro localizado a 545 km da costa de Pernambuco. 
                Para visitar este santuário ecológico, você precisa seguir alguns passos importantes.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards de informações principais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Plane,
              title: "Voos Diretos",
              description: "Saindo de Recife (1h30) ou Natal (1h)",
              details: "3 voos diários • R$ 800-2000",
              color: "blue"
            },
            {
              icon: DollarSign,
              title: "Taxa de Preservação",
              description: "R$ 92,89 por dia de permanência",
              details: "Pague online ou na chegada",
              color: "green"
            },
            {
              icon: Shield,
              title: "Documentação",
              description: "RG ou Passaporte + Comprovante de vacinação",
              details: "Cartão de vacina COVID-19",
              color: "purple"
            }
          ].map((item, index) => {
            const itemColor = colorMap[item.color as keyof typeof colorMap];
            
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className={cn(cardStyles.base, cardStyles.hover.lift, "p-5")}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  `bg-gradient-to-br ${itemColor.gradient} shadow-md`
                )}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <p className={cn("text-xs font-medium", itemColor.text)}>{item.details}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Timeline de preparação */}
        <div className={cn(cardStyles.base, "p-6")}>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Cronograma de Preparação
          </h3>
          <div className="space-y-4">
            {[
              { time: "60 dias antes", task: "Reserve voos e hospedagem", icon: Calendar },
              { time: "30 dias antes", task: "Compre ingressos para atrações", icon: Star },
              { time: "15 dias antes", task: "Pague a taxa de preservação online", icon: DollarSign },
              { time: "7 dias antes", task: "Confirme reservas e check-in online", icon: CheckCircle }
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

        {/* Dicas importantes */}
        <div className={cn(cardStyles.base, "p-6 bg-yellow-50 border-2 border-yellow-200")}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Dicas Importantes</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>A ilha tem limite diário de visitantes. Reserve com antecedência!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Leve dinheiro em espécie. Nem todos os lugares aceitam cartão.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Protetor solar reef-safe é obrigatório para preservar os corais.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),

    "accommodation": (
      <div className="space-y-8">
        {/* Mapa interativo das regiões */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(cardStyles.base, "p-6 overflow-hidden")}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Escolha sua Região Ideal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "Vila dos Remédios",
                description: "Centro histórico com comércio e restaurantes",
                pros: ["Mais infraestrutura", "Próximo ao centro", "Vida noturna"],
                distance: "0-2km do centro",
                price: "$$",
                color: "purple"
              },
              {
                name: "Floresta Nova",
                description: "Área residencial tranquila e familiar",
                pros: ["Mais econômico", "Tranquilo", "Mercados próximos"],
                distance: "2-4km do centro",
                price: "$",
                color: "green"
              },
              {
                name: "Praia do Sueste",
                description: "Próximo às melhores praias para banho",
                pros: ["Acesso às praias", "Vista para o mar", "Área nobre"],
                distance: "4-6km do centro",
                price: "$$$",
                color: "blue"
              },
              {
                name: "Porto de Santo Antônio",
                description: "Área portuária com vista privilegiada",
                pros: ["Vista do pôr do sol", "Restaurantes", "Ponto de mergulho"],
                distance: "3-5km do centro",
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
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{region.distance}</span>
                  </div>
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

        {/* Tipos de hospedagem */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              type: "Pousadas Familiares",
              icon: Home,
              price: "R$ 250-500/dia",
              features: ["Café da manhã incluso", "Ambiente acolhedor", "Dicas locais"],
              recommended: preferences.budget[0] < 5000,
              color: "green"
            },
            {
              type: "Hotéis & Resorts",
              icon: Building,
              price: "R$ 800-2000/dia",
              features: ["All inclusive", "Piscina", "Spa e restaurante"],
              recommended: preferences.budget[1] > 8000,
              color: "purple"
            },
            {
              type: "Casas & Apartamentos",
              icon: Key,
              price: "R$ 400-1200/dia",
              features: ["Cozinha completa", "Mais privacidade", "Ideal para grupos"],
              recommended: preferences.duration > 7,
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

        {/* Dica personalizada baseada nas preferências */}
        {preferences.travelDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(cardStyles.base, "p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200")}
          >
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Recomendação Personalizada
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Para sua viagem de <strong>{preferences.duration} dias</strong> em{" "}
              <strong>{format(preferences.travelDate, "MMMM", { locale: ptBR })}</strong>, 
              com orçamento de <strong>R$ {preferences.budget[0].toLocaleString()} a R$ {preferences.budget[1].toLocaleString()}</strong>, 
              recomendamos hospedagem em <strong>{preferences.budget[1] > 8000 ? "Praia do Sueste" : "Vila dos Remédios"}</strong>. 
              {travelData.weather.season === "Chuvosa" 
                ? " Durante a temporada chuvosa, prefira locais com área coberta e atividades indoor."
                : " Na temporada seca, aproveite pousadas com piscina e próximas às praias."
              }
            </p>
          </motion.div>
        )}
      </div>
    ),

    "transportation": (
      <div className="space-y-8">
        {/* Comparativo de transportes */}
        <div className={cn(cardStyles.base, "p-6")}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Compare as Opções de Transporte</h2>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Preço/dia</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Capacidade</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Flexibilidade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ideal para</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    type: "Buggy",
                    icon: Car,
                    price: "R$ 250-350",
                    capacity: "2-4 pessoas",
                    flexibility: 5,
                    idealFor: "Explorar toda a ilha",
                    color: "green"
                  },
                  {
                    type: "Taxi",
                    icon: Car,
                    price: "R$ 30-50/trajeto",
                    capacity: "4 pessoas",
                    flexibility: 3,
                    idealFor: "Trajetos específicos",
                    color: "blue"
                  },
                  {
                    type: "Ônibus",
                    icon: Navigation,
                    price: "R$ 5/trajeto",
                    capacity: "Ilimitado",
                    flexibility: 2,
                    idealFor: "Economia máxima",
                    color: "orange"
                  },
                  {
                    type: "Transfer",
                    icon: Users,
                    price: "R$ 150-200/dia",
                    capacity: "8-15 pessoas",
                    flexibility: 1,
                    idealFor: "Grupos e tours",
                    color: "purple"
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
                      <td className="py-4 px-4 text-center text-sm text-gray-600">{transport.capacity}</td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                i < transport.flexibility
                                  ? transportColor.darkBg
                                  : "bg-gray-200"
                              )}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{transport.idealFor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculadora de transporte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardStyles.base, "p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200")}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Calculadora de Transporte
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
                    Ônibus + Taxi ocasional
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    ~R$ {(preferences.duration * 30).toLocaleString()} total
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Opção Conforto</p>
                  <p className="text-lg font-bold text-green-700">
                    Buggy alugado
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    ~R$ {(preferences.duration * 300).toLocaleString()} total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dicas de deslocamento */}
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
                <span>Almoço: 12h às 15h (menos concorrido)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Jantar: Reserve com antecedência no verão</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Festival Gastronômico: Setembro (imperdível!)</span>
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
              Economize nas Refeições
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Almoce nos PFs: R$ 40-60 completo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Compre água no mercado: 3x mais barato</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Happy hour: Descontos após 17h</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    ),

    "beaches": (
      <div className="space-y-8">
        {/* Top praias com cards visuais */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Praias Imperdíveis</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Baía do Sancho",
                rating: 5,
                difficulty: "Difícil",
                features: ["Melhor praia do mundo", "Águas cristalinas", "Vida marinha abundante"],
                access: "Escada íngreme entre rochas",
                bestTime: "Manhã cedo",
                image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
                color: "cyan"
              },
              {
                name: "Praia do Leão",
                rating: 5,
                difficulty: "Fácil",
                features: ["Desova de tartarugas", "Pôr do sol", "Águas calmas"],
                access: "Trilha pavimentada",
                bestTime: "Final da tarde",
                image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop",
                color: "green"
              },
              {
                name: "Baía dos Porcos",
                rating: 4,
                difficulty: "Moderado",
                features: ["Piscinas naturais", "Dois Irmãos", "Snorkeling"],
                access: "Trilha curta por pedras",
                bestTime: "Maré baixa",
                image: "https://images.unsplash.com/photo-1527004760000-e4c3bf54b1b3?w=400&h=300&fit=crop",
                color: "blue"
              },
              {
                name: "Cacimba do Padre",
                rating: 4,
                difficulty: "Fácil",
                features: ["Surf", "Faixa de areia extensa", "Morro Dois Irmãos"],
                access: "Acesso por estrada",
                bestTime: "O dia todo",
                image: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&h=300&fit=crop",
                color: "orange"
              },
              {
                name: "Praia do Sueste",
                rating: 4,
                difficulty: "Fácil",
                features: ["Tartarugas marinhas", "Tubarões", "Arraias"],
                access: "Estacionamento próximo",
                bestTime: "Manhã",
                image: "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=400&h=300&fit=crop",
                color: "purple"
              },
              {
                name: "Atalaia",
                rating: 5,
                difficulty: "Moderado",
                features: ["Aquário natural", "Limite de visitantes", "Vida marinha"],
                access: "Trilha controlada pelo ICMBio",
                bestTime: "Maré baixa",
                image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop",
                color: "yellow"
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

        {/* Mapa de localização */}
        <div className={cn(cardStyles.base, "p-6")}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-600" />
            Organize seu Roteiro
          </h3>
          <div className="bg-cyan-50 rounded-xl p-6 border-2 border-cyan-200">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Mar de Dentro (Norte)</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Praia do Cachorro - Centro
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Praia do Meio - 5 min caminhada
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Conceição - 10 min buggy
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Boldró - 15 min buggy
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Mar de Fora (Sul)</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Sueste - 20 min buggy
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Leão - 25 min buggy
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Sancho - 30 min + trilha
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    Atalaia - Agendamento ICMBio
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Equipamentos recomendados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardStyles.base, "p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200")}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            O que Levar para as Praias
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { item: "Snorkel e máscara", essential: true },
              { item: "Protetor solar reef-safe", essential: true },
              { item: "Água e lanches", essential: true },
              { item: "Câmera aquática", essential: false },
              { item: "Sapato aquático", essential: false },
              { item: "Guarda-sol portátil", essential: false }
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
        {/* Categorias gastronômicas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              category: "Frutos do Mar",
              icon: Fish,
              avgPrice: "R$ 80-150",
              mustTry: "Peixe na folha de bananeira",
              color: "blue"
            },
            {
              category: "Regional",
              icon: Utensils,
              avgPrice: "R$ 60-100",
              mustTry: "Tubalhau (tubarão)",
              color: "orange"
            },
            {
              category: "Internacional",
              icon: Globe,
              avgPrice: "R$ 70-120",
              mustTry: "Massas e risotos",
              color: "purple"
            },
            {
              category: "Petiscos",
              icon: Heart,
              avgPrice: "R$ 40-80",
              mustTry: "Bolinho de tubalhau",
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

        {/* Top restaurantes */}
        <div className={cn(cardStyles.base, "p-6")}>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Restaurantes Premiados
          </h3>
          <div className="space-y-4">
            {[
              {
                name: "Varanda",
                cuisine: "Contemporânea",
                location: "Pousada Maravilha",
                price: "$$$",
                highlight: "Vista panorâmica e menu degustação",
                rating: 5,
                color: "purple"
              },
              {
                name: "Xica da Silva",
                cuisine: "Regional",
                location: "Vila dos Remédios",
                price: "$$",
                highlight: "Melhor peixe na folha da ilha",
                rating: 5,
                color: "green"
              },
              {
                name: "Mergulhão",
                cuisine: "Frutos do Mar",
                location: "Porto Santo Antônio",
                price: "$$",
                highlight: "Pôr do sol e lagosta grelhada",
                rating: 4,
                color: "blue"
              },
              {
                name: "Cacimba Bistrô",
                cuisine: "Internacional",
                location: "Praia da Cacimba",
                price: "$$$",
                highlight: "Ambiente romântico e carta de vinhos",
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
                        <p className="text-sm text-gray-600">{restaurant.cuisine} • {restaurant.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-700">{restaurant.price}</p>
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

        {/* Dicas gastronômicas */}
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
                <span>Almoço: 12h às 15h (menos concorrido)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Jantar: Reserve com antecedência no verão</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Festival Gastronômico: Setembro (imperdível!)</span>
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
              Economize nas Refeições
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Almoce nos PFs: R$ 40-60 completo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Compre água no mercado: 3x mais barato</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Happy hour: Descontos após 17h</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    ),

    "monthly-guide": (
      <div className="space-y-8">
        {/* Calendário climático */}
        <div className={cn(cardStyles.base, "p-6")}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Melhor Época para Cada Atividade</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Temporada Seca */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Sun className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Temporada Seca</h3>
                  <p className="text-sm text-gray-600">Agosto a Fevereiro</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { activity: "Mergulho", quality: "Excelente", icon: Activity },
                  { activity: "Trilhas", quality: "Perfeito", icon: Navigation },
                  { activity: "Fotografia", quality: "Ideal", icon: Camera },
                  { activity: "Praias", quality: "Ótimo", icon: Waves }
                ].map((item) => (
                  <div key={item.activity} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <item.icon className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-900">{item.activity}</span>
                    <span className="text-sm text-yellow-700 ml-auto">{item.quality}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Temporada Chuvosa */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CloudRain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Temporada Chuvosa</h3>
                  <p className="text-sm text-gray-600">Março a Julho</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { activity: "Surf", quality: "Excelente", icon: Waves },
                  { activity: "Observação fauna", quality: "Melhor época", icon: Star },
                  { activity: "Preços baixos", quality: "30-50% menos", icon: TrendingDown },
                  { activity: "Menos turistas", quality: "Tranquilo", icon: Users }
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

        {/* Calendário mês a mês */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              month: "Janeiro",
              weather: "Sol com pancadas",
              temp: "28°C",
              highlight: "Surf perfeito",
              crowd: "high",
              color: "blue"
            },
            {
              month: "Fevereiro",
              weather: "Sol predominante",
              temp: "28°C",
              highlight: "Carnaval tranquilo",
              crowd: "high",
              color: "purple"
            },
            {
              month: "Março",
              weather: "Início das chuvas",
              temp: "28°C",
              highlight: "Desova tartarugas",
              crowd: "medium",
              color: "green"
            },
            {
              month: "Abril",
              weather: "Chuvas frequentes",
              temp: "27°C",
              highlight: "Ilha verde exuberante",
              crowd: "low",
              color: "cyan"
            },
            {
              month: "Maio",
              weather: "Chuvas intensas",
              temp: "26°C",
              highlight: "Melhor mês p/ economia",
              crowd: "low",
              color: "indigo"
            },
            {
              month: "Junho",
              weather: "Chuvas diminuindo",
              temp: "25°C",
              highlight: "São João local",
              crowd: "low",
              color: "orange"
            },
            {
              month: "Julho",
              weather: "Fim das chuvas",
              temp: "25°C",
              highlight: "Baleias jubarte",
              crowd: "medium",
              color: "yellow"
            },
            {
              month: "Agosto",
              weather: "Seco e ventoso",
              temp: "25°C",
              highlight: "Início alta temporada",
              crowd: "medium",
              color: "red"
            },
            {
              month: "Setembro",
              weather: "Sol constante",
              temp: "26°C",
              highlight: "Festival gastronômico",
              crowd: "high",
              color: "pink"
            },
            {
              month: "Outubro",
              weather: "Sol pleno",
              temp: "27°C",
              highlight: "Visibilidade 50m",
              crowd: "high",
              color: "purple"
            },
            {
              month: "Novembro",
              weather: "Sol forte",
              temp: "28°C",
              highlight: "Melhor mergulho",
              crowd: "medium",
              color: "blue"
            },
            {
              month: "Dezembro",
              weather: "Sol com chuvas",
              temp: "28°C",
              highlight: "Festas fim de ano",
              crowd: "high",
              color: "green"
            }
          ].map((month, index) => {
            const monthColor = colorMap[month.color as keyof typeof colorMap] || colorMap.blue;
            
            return (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className={cn(
                  cardStyles.base,
                  "p-5 cursor-pointer transition-all",
                  preferences.travelDate && format(preferences.travelDate, "MMMM", { locale: ptBR }) === month.month.toLowerCase()
                    ? `ring-2 ring-offset-2 ${monthColor.border} ${monthColor.bg}`
                    : ""
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className={cn("font-semibold", monthColor.text)}>{month.month}</h3>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    month.crowd === "high" ? "bg-red-100 text-red-700" :
                    month.crowd === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  )}>
                    {month.crowd === "high" ? "Cheio" : month.crowd === "medium" ? "Médio" : "Vazio"}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{month.temp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{month.weather}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className={cn("w-4 h-4", monthColor.icon)} />
                    <span className={cn("font-medium", monthColor.text)}>{month.highlight}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Eventos especiais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardStyles.base, "p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200")}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Eventos Anuais Imperdíveis
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { event: "Festa de São Pedro", date: "29 de Junho", description: "Procissão marítima tradicional" },
              { event: "Festival Gastronômico", date: "Setembro", description: "Chefs renomados e pratos exclusivos" },
              { event: "Regata Refeno", date: "Outubro", description: "Competição de vela internacional" },
              { event: "Réveillon", date: "31 de Dezembro", description: "Queima de fogos limitada e ecológica" }
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

export default function GuiaPage() {
  const [activeSection, setActiveSection] = useState<string>("getting-started");
  const [preferences, setPreferences] = useState<UserPreferences>({
    travelDate: undefined,
    duration: 7,
    budget: [3000, 8000],
    interests: [],
    difficultyLevel: 'moderate'
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [bookmarkedSections, setBookmarkedSections] = useState<string[]>([]);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Dados dinâmicos baseados na data de viagem
  const travelData = useMemo((): TravelData => {
    if (!preferences.travelDate) {
      return {
        weather: { temperature: 27, humidity: 75, rainChance: 30, season: 'Seca' },
        prices: { accommodation: 450, transport: 200, activities: 150 },
        crowds: 'medium',
        bestActivities: ['Mergulho', 'Trilhas', 'Praias']
      };
    }

    const month = preferences.travelDate.getMonth();
    
    // Estação chuvosa (Dec-Jun) vs Seca (Jul-Nov)
    if (month >= 11 || month <= 5) {
      return {
        weather: { temperature: 28, humidity: 85, rainChance: 70, season: 'Chuvosa' },
        prices: { accommodation: 650, transport: 300, activities: 200 },
        crowds: 'high',
        bestActivities: ['Mergulho', 'Gastronomia', 'Observação de fauna']
      };
    } else {
      return {
        weather: { temperature: 25, humidity: 65, rainChance: 15, season: 'Seca' },
        prices: { accommodation: 400, transport: 180, activities: 120 },
        crowds: 'low',
        bestActivities: ['Todas as praias', 'Trilhas', 'Fotografia', 'Mergulho livre']
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
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar - Always visible on mobile */}
      <div className="fixed top-0 left-0 right-0 z-[60] lg:z-50">
        <Progress value={readProgress} className="h-1 rounded-none" />
      </div>

      {/* Mobile Header - Completamente redesenhado */}
      <header className="lg:hidden fixed top-1 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16 pt-3">
          {/* Menu Button com indicador visual */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-300",
                currentColor.lightBg,
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
              <Button 
                variant="outline"
                size="sm" 
                className="w-full justify-start"
                onClick={() => toast.info("Download do guia em PDF disponível em breve!")}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Guia PDF
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Desktop Sidebar - Mantido mas melhorado */}
      <aside className="w-80 bg-white border-r border-gray-200 fixed h-full overflow-y-auto hidden lg:block shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Guia de Noronha</h1>
          <p className="text-sm text-gray-600">Seu guia completo e personalizado</p>
        </div>

        {/* Desktop Navigation */}
        <nav className="p-4 space-y-2">
          {guideSections.map((section) => {
            const sectionColor = colorMap[section.color as keyof typeof colorMap];
            const isActive = activeSection === section.id;
            
            return (
              <motion.button
                key={section.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                  isActive
                    ? `${sectionColor.bg} ${sectionColor.border} border-2 shadow-sm`
                    : "hover:bg-gray-50"
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
        <div className="p-4 border-t border-gray-200 space-y-2">
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
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => toast.info("Download do guia em PDF disponível em breve!")}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Guia PDF
          </Button>
        </div>
      </aside>

      {/* Main Content - Melhorado para mobile */}
      <main className="flex-1 lg:ml-80 bg-gray-50" ref={contentRef}>
        {/* Hero Section - Redesenhada para mobile */}
        <section className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden mt-[128px] lg:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div
                className="h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('${getHeroImage(activeSection)}')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
            </motion.div>
          </AnimatePresence>

          {/* Hero Content - Otimizado para mobile */}
          <div className="absolute inset-0 flex items-end p-6 sm:p-8 lg:p-12">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-4xl w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4",
                  "backdrop-blur-md bg-white/20 text-white border border-white/30"
                )}
              >
                {currentSectionData?.icon && (
                  <currentSectionData.icon className="w-4 h-4" />
                )}
                <span>Guia Completo</span>
              </motion.div>
              
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 lg:mb-4"
              >
                {currentSectionData?.title}
              </motion.h1>
              
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl leading-relaxed"
              >
                {currentSectionData?.description}
              </motion.p>
              
              {/* Hero Stats - Responsivo */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-3 sm:gap-4 mt-4 lg:mt-6"
              >
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Eye className="w-3 h-3 text-white/80" />
                  <span className="text-xs sm:text-sm text-white/80">15 min leitura</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Globe className="w-3 h-3 text-white/80" />
                  <span className="text-xs sm:text-sm text-white/80">Atualizado hoje</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Users className="w-3 h-3 text-white/80" />
                  <span className="text-xs sm:text-sm text-white/80">2.5k views</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Content Area - Melhorado para mobile */}
        <div className="relative bg-white -mt-6 sm:-mt-8 lg:-mt-12 rounded-t-3xl shadow-xl">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />
          
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-12 pt-8 sm:pt-10 lg:pt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SectionContent 
                  sectionId={activeSection} 
                  preferences={preferences}
                  travelData={travelData}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Action Buttons - Mobile Redesenhado */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="lg:hidden fixed bottom-24 right-4 sm:right-6"
            >
              <Button
                size="icon"
                onClick={scrollToTop}
                className="h-12 w-12 rounded-full shadow-lg bg-white border border-gray-200"
              >
                <ArrowUp className="h-5 w-5 text-gray-700" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

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
      </main>
    </div>
  );
} 