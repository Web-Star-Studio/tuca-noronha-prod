"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
// date-fns imports removidos (não utilizados)

import { MapPin, Calendar, Utensils, Waves, Building, Star, Plane, Home, Car, UtensilsCrossed, Sun, Clock, Heart, Camera, CheckCircle, AlertCircle, Shirt, Wallet, Play, BarChart3, Lightbulb, Compass, Info, Thermometer, Users, Map, Navigation, Activity, Globe, Trophy, CloudRain, ArrowLeft, Menu, Search, ArrowUp, CreditCard, DollarSign, Droplets, FileText, Fish, Key, Phone, Shield, Trash2, TrendingDown, Wifi, Wind, Zap } from "lucide-react";
import { cardStyles, decorativeBackgrounds, ui } from "@/lib/ui-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// useGesture removido (não utilizado)
// recharts imports removidos (não utilizados)
import { useIsMobile } from "@/hooks/use-mobile";

// glassStyles removido (não utilizado)

// minimalStyles removido (não utilizado)

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
  },
  {
    id: "activities",
    title: "O Que Fazer",
    icon: Activity,
    color: "emerald",
    description: "Descubra as melhores atividades, passeios e experiências únicas em Fernando de Noronha",
    quickInfo: "Mergulho, trilhas, passeios",
    gradient: "from-emerald-400 to-teal-600",
    accentGradient: "from-emerald-500/20 to-teal-600/20"
  },
  {
    id: "culture-history",
    title: "Cultura e História",
    icon: Trophy,
    color: "amber",
    description: "Explore a rica história e cultura de Fernando de Noronha através de seus marcos históricos",
    quickInfo: "Fortes, museus, patrimônio",
    gradient: "from-amber-400 to-orange-600",
    accentGradient: "from-amber-500/20 to-orange-600/20"
  },
  {
    id: "sustainability",
    title: "Sustentabilidade",
    icon: Shield,
    color: "green",
    description: "Aprenda sobre preservação ambiental e como contribuir para manter a ilha sustentável",
    quickInfo: "Lei do Plástico Zero, TPA",
    gradient: "from-green-400 to-emerald-600",
    accentGradient: "from-green-500/20 to-emerald-600/20"
  },
  {
    id: "favorite-spots",
    title: "Cantos Favoritos",
    icon: Heart,
    color: "pink",
    description: "Conheça os lugares especiais e dicas exclusivas do Tuca para sua estadia",
    quickInfo: "Dicas do Tuca exclusivas",
    gradient: "from-pink-400 to-rose-600",
    accentGradient: "from-pink-500/20 to-rose-600/20"
  },
  {
    id: "stories-curiosities",
    title: "Histórias e Curiosidades",
    icon: Lightbulb,
    color: "violet",
    description: "Histórias engraçadas e curiosidades fascinantes sobre a ilha paradisíaca",
    quickInfo: "1101 curiosidades",
    gradient: "from-violet-400 to-purple-600",
    accentGradient: "from-violet-500/20 to-purple-600/20"
  },
  {
    id: "useful-contacts",
    title: "Contatos Úteis",
    icon: Phone,
    color: "slate",
    description: "Informações essenciais de contato para emergências e serviços importantes",
    quickInfo: "Emergências, saúde, segurança",
    gradient: "from-slate-400 to-gray-600",
    accentGradient: "from-slate-500/20 to-gray-600/20"
  }
];

// Interface UserPreferences removida (não utilizada)

// Interface TravelData removida (não utilizada)

// Interface AdvancedFilters removida (não utilizada)

// SearchableContent interface removida (não utilizada)

// Componente para item da checklist (corrige hook rules violation)
function ChecklistItem({ step, index }: { step: any; index: number }) {
  const [checked, setChecked] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ x: 4 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer",
        checked ? "bg-green-50 border-2 border-green-200" : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
      )}
      onClick={() => setChecked(!checked)}
    >
      <motion.div
        animate={{ scale: checked ? [1, 1.2, 1] : 1 }}
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
          checked ? "bg-green-500" : "bg-white shadow-sm"
        )}
      >
        {checked ? (
          <CheckCircle className="w-6 h-6 text-white" />
        ) : (
          <step.icon className={cn("w-6 h-6", `text-${step.color}-600`)} />
        )}
      </motion.div>
      <div className="flex-1">
        <p className={cn(
          "font-medium transition-all duration-300",
          checked ? "text-green-700 line-through" : "text-gray-900"
        )}>{step.category}</p>
        <p className={cn(
          "text-sm transition-all duration-300",
          checked ? "text-green-600" : "text-gray-600"
        )}>{step.task}</p>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 transition-all duration-300",
        checked ? "bg-green-500 border-green-500" : "border-gray-300"
      )}>
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-full h-full flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
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
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    darkBg: "bg-emerald-600",
    lightBg: "bg-emerald-100",
    gradient: "from-emerald-600 to-emerald-700",
    shadowColor: "shadow-emerald-200"
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "text-amber-600",
    darkBg: "bg-amber-600",
    lightBg: "bg-amber-100",
    gradient: "from-amber-600 to-amber-700",
    shadowColor: "shadow-amber-200"
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    icon: "text-pink-600",
    darkBg: "bg-pink-600",
    lightBg: "bg-pink-100",
    gradient: "from-pink-600 to-pink-700",
    shadowColor: "shadow-pink-200"
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    icon: "text-violet-600",
    darkBg: "bg-violet-600",
    lightBg: "bg-violet-100",
    gradient: "from-violet-600 to-violet-700",
    shadowColor: "shadow-violet-200"
  },
  slate: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "text-slate-600",
    darkBg: "bg-slate-600",
    lightBg: "bg-slate-100",
    gradient: "from-slate-600 to-slate-700",
    shadowColor: "shadow-slate-200"
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: "text-red-600",
    darkBg: "bg-red-600",
    lightBg: "bg-red-100",
    gradient: "from-red-600 to-red-700",
    shadowColor: "shadow-red-200"
  }
};

// AnimatedNumber function removida (não utilizada)

// MagneticButton function removida (não utilizada)

// Componente de conteúdo das seções
function SectionContent({ 
  sectionId, 
  favorites, 
  onToggleFavorite 
}: {
  sectionId: string;
  favorites: string[];
  onToggleFavorite: (item: string) => void;
}) {
  const content = {
    "boas-vindas": (
      <div className="space-y-10">
        {/* Video Section with Modern Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(ui.cards.base, "p-0 overflow-hidden group")}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 z-10" />
            <div className="p-8 relative z-20">
              <motion.div 
                className="flex items-center gap-3 mb-6"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  <Play className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Assista ao Vídeo Introdutório</h3>
                  <p className="text-sm text-gray-600">Conheça Fernando de Noronha em 5 minutos</p>
                </div>
              </motion.div>
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]" />
                <motion.div
                  className="relative z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl cursor-pointer">
                    <Play className="w-10 h-10 text-blue-600 ml-1" />
                  </div>
                </motion.div>
                <p className="absolute bottom-4 left-4 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  Em breve
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Welcome Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={cn(ui.cards.base, "p-0 overflow-hidden")}
        >
          <div className="relative">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="https://images.unsplash.com/photo-1614723268053-f32f936f13f9?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Fernando de Noronha - Vista panorâmica do paraíso"
                fill
                className="object-cover"
                priority
              />
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-indigo-900/50 to-purple-900/60" />
            </div>
            
            <div className="relative p-8 z-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />
              
              <div className="relative">
              <motion.div 
                className="inline-flex items-center gap-2 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Plane className="w-8 h-8 text-white" />
                </motion.div>
                <div className="h-16 w-0.5 bg-gradient-to-b from-white/60 to-transparent" />
                <div>
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                    Boas-vindas ao Paraíso
                  </h2>
                  <p className="text-sm text-blue-100 drop-shadow">Preparativos para uma experiência inesquecível</p>
                </div>
              </motion.div>
              
              <motion.p 
                className="text-white/90 leading-relaxed mb-6 text-lg drop-shadow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Fernando de Noronha não é apenas um destino de viagem; é um privilégio. Antes de mergulhar em suas águas azul-turquesa, é fundamental compreender a essência deste lugar único.
              </motion.p>
              
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Parque Nacional Marinho", year: "1988", icon: Shield },
                  { label: "Patrimônio Mundial UNESCO", year: "2001", icon: Globe },
                  { label: "Sítio RAMSAR", year: "Internacional", icon: Droplets }
                ].map((badge, index) => (
                  <motion.div
                    key={badge.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-blue-100"
                  >
                    <badge.icon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-800">{badge.label}</span>
                    <span className="text-xs text-gray-500">{badge.year}</span>
                  </motion.div>
                ))}
              </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Essential Info Cards with Interactive Design */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: DollarSign,
              title: "Taxa de Preservação (TPA)",
              description: "Obrigatória para todos os visitantes, com valor diário progressivo.",
              details: "A partir de R$ 101,33 por dia",
              color: "green",
              gradient: "from-green-600 to-emerald-600",
              tips: ["Crianças < 5 anos: isentas", "Pague online antecipadamente", "Desconto para estadias longas"]
            },
            {
              icon: Shield,
              title: "Ingresso PARNAMAR",
              description: "Acesso às principais praias e trilhas do Parque Nacional.",
              details: "R$ 186,50 (Brasileiros)",
              color: "purple",
              gradient: "from-purple-600 to-pink-600",
              tips: ["Válido por 10 dias", "Compre no ICMBio", "Estrangeiros: R$ 373"]
            },
            {
              icon: Plane,
              title: "Voos e Chegada",
              description: "Voos partem principalmente de Recife e Natal.",
              details: "Transfer privativo recomendado",
              color: "blue",
              gradient: "from-blue-600 to-indigo-600",
              tips: ["Evite transfers compartilhados", "Reserve com antecedência", "Voos diretos limitados"]
            }
          ].map((item, index) => {
            const itemColor = colorMap[item.color as keyof typeof colorMap];
            
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                <div className={cn(
                  ui.cards.base,
                  "p-6 h-full border-2 transition-all duration-300",
                  `hover:border-${item.color}-200 hover:shadow-xl`
                )}>
                  {/* Decorative gradient background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl",
                    item.gradient
                  )} />
                  
                  {/* Icon container with animation */}
                  <motion.div 
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden",
                      `bg-gradient-to-br ${item.gradient}`
                    )}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                    <item.icon className="w-7 h-7 text-white relative z-10" />
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  
                  {/* Price/Details badge */}
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4",
                    itemColor.lightBg,
                    itemColor.text
                  )}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {item.details}
                  </div>
                  
                  {/* Tips section (appears on hover) */}
                  <div className="space-y-2 overflow-hidden">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dicas rápidas:</p>
                    {item.tips.map((tip, tipIndex) => (
                      <motion.div
                        key={tip}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: tipIndex * 0.1 }}
                        className="flex items-center gap-2 text-xs text-gray-600"
                      >
                        <CheckCircle className={cn("w-3 h-3 flex-shrink-0", itemColor.icon)} />
                        <span>{tip}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Interactive corner decoration */}
                  <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-300",
                    `bg-gradient-to-br ${item.gradient}`
                  )} style={{
                    clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                  }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Checklist */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(ui.cards.base, "p-0 overflow-hidden")}
        >
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              Checklist Essencial do Viajante
            </h3>
            <p className="text-sm text-gray-600 mb-6">Marque os itens conforme você se prepara para a viagem</p>
          </div>
          
          <div className="p-6 space-y-3">
            {[
              { category: "Vestuário", task: "Tecidos leves, respiráveis, e peças com proteção UV", icon: Shirt, color: "blue" },
              { category: "Equipamentos", task: "Kit de snorkel, garrafa reutilizável, câmera subaquática", icon: Camera, color: "green" },
              { category: "Saúde", task: "Kit primeiros socorros, medicamentos, protetor solar", icon: Heart, color: "red" },
              { category: "Documentos", task: "Comprovantes, documentos pessoais e dinheiro em espécie", icon: Wallet, color: "purple" }
            ].map((step, index) => (
              <ChecklistItem key={step.category} step={step} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Practical Info with Modern Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Informações Práticas
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                title: "Internet", 
                status: "Instável", 
                tip: "Aproveite para um detox digital",
                icon: Wifi,
                color: "yellow",
                details: "4G limitado, Wi-Fi em pousadas"
              },
              { 
                title: "Serviços Bancários", 
                status: "Limitados", 
                tip: "Leve dinheiro em espécie",
                icon: Building,
                color: "orange",
                details: "Poucos caixas eletrônicos"
              },
              { 
                title: "Energia", 
                status: "220V", 
                tip: "GMT-2 (1h a mais que Brasília)",
                icon: Zap,
                color: "blue",
                details: "Leve adaptadores universais"
              }
            ].map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={cn(ui.cards.base, "p-5 relative overflow-hidden group")}
              >
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300",
                  `bg-${info.color}-500`
                )} style={{ transform: "translate(50%, -50%)" }} />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      `bg-${info.color}-100`
                    )}>
                      <info.icon className={cn("w-5 h-5", `text-${info.color}-600`)} />
                    </div>
                    <Badge variant="secondary" className={cn(`bg-${info.color}-100 text-${info.color}-700 border-${info.color}-200`)}>
                      {info.status}
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{info.details}</p>
                  <p className={cn("text-xs font-medium", `text-${info.color}-600`)}>
                    💡 {info.tip}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Environmental Alert with Interactive Design */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          className={cn(
            ui.cards.base,
            "p-0 overflow-hidden border-2 border-yellow-200 hover:border-yellow-300 transition-all duration-300"
          )}
        >
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6">
            <div className="flex items-start gap-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0"
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <AlertCircle className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">
                  O Viajante Consciente: Etiqueta para Preservar o Paraíso
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      rule: "Respeito à Vida Selvagem",
                      description: "É estritamente proibido tocar, alimentar ou perseguir qualquer animal",
                      icon: Fish
                    },
                    {
                      rule: "Redução de Resíduos",
                      description: "A ilha baniu a importação e o uso de plásticos descartáveis",
                      icon: Trash2
                    },
                    {
                      rule: "Economia de Recursos",
                      description: "Água e energia são bens preciosos em Noronha",
                      icon: Droplets
                    }
                  ].map((rule, index) => (
                    <motion.div
                      key={rule.rule}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors duration-300"
                    >
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <rule.icon className="w-4 h-4 text-yellow-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{rule.rule}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),

    "accommodation": (
      <div className="space-y-12">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >

        </motion.div>

        {/* Accommodation Types Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              type: "Pousadas",
              icon: Home,
              color: "purple",
              description: "Charme e hospitalidade local",
              price: "R$ 150-400",
              features: ["Café da manhã", "Atendimento pessoal", "Localização central", "Dicas locais"],
              pros: ["Experiência autêntica", "Preço acessível", "Proximidade dos pontos turísticos"],
              cons: ["Conforto básico", "Pode ter barulho"]
            },
            {
              type: "Hotéis",
              icon: Building,
              color: "blue",
              description: "Conforto e serviços completos",
              price: "R$ 300-800",
              features: ["Ar condicionado", "Piscina", "Restaurante", "Serviço de quarto"],
              pros: ["Maior conforto", "Serviços inclusos", "Estrutura completa"],
              cons: ["Preço elevado", "Experiência menos local"]
            },
            {
              type: "Apartamentos",
              icon: Key,
              color: "green",
              description: "Independência e privacidade",
              price: "R$ 200-600",
              features: ["Cozinha equipada", "Espaço amplo", "Privacidade", "Flexibilidade"],
              pros: ["Liberdade total", "Economia com comida", "Ideal para grupos"],
              cons: ["Sem serviços", "Pode ser isolado"]
            }
          ].map((accommodation, index) => (
            <motion.div
              key={accommodation.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                ui.cards.base,
                ui.cards.hover.lift,
                "group relative overflow-hidden p-0"
              )}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                {
                  "from-purple-500 to-pink-500": accommodation.color === "purple",
                  "from-blue-500 to-indigo-500": accommodation.color === "blue",
                  "from-green-500 to-emerald-500": accommodation.color === "green",
                }
              )} />
              
              <div className="relative z-10 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn(
                    "p-3 rounded-xl flex items-center justify-center",
                    {
                      "bg-gradient-to-br from-purple-100 to-pink-100": accommodation.color === "purple",
                      "bg-gradient-to-br from-blue-100 to-indigo-100": accommodation.color === "blue",
                      "bg-gradient-to-br from-green-100 to-emerald-100": accommodation.color === "green",
                    }
                  )}>
                    <accommodation.icon className={cn(
                      "w-6 h-6",
                      {
                        "text-purple-600": accommodation.color === "purple",
                        "text-blue-600": accommodation.color === "blue",
                        "text-green-600": accommodation.color === "green",
                      }
                    )} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{accommodation.type}</h4>
                    <p className="text-sm text-gray-600 mb-2">{accommodation.description}</p>
                    <div className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                      {
                        "bg-purple-100 text-purple-700": accommodation.color === "purple",
                        "bg-blue-100 text-blue-700": accommodation.color === "blue",
                        "bg-green-100 text-green-700": accommodation.color === "green",
                      }
                    )}>
                      {accommodation.price}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-4">
                  <h5 className="text-sm font-semibold text-gray-900">Características:</h5>
                  <div className="space-y-2">
                    {accommodation.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          {
                            "bg-purple-500": accommodation.color === "purple",
                            "bg-blue-500": accommodation.color === "blue",
                            "bg-green-500": accommodation.color === "green",
                          }
                        )} />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                                         <h6 className="font-semibold text-green-700 mb-1 flex items-center gap-1">
                       <CheckCircle className="w-3 h-3" />
                       Vantagens
                     </h6>
                    <ul className="space-y-1">
                      {accommodation.pros.map((pro) => (
                        <li key={pro} className="text-gray-600 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">•</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-semibold text-orange-700 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Atenção
                    </h6>
                    <ul className="space-y-1">
                      {accommodation.cons.map((con) => (
                        <li key={con} className="text-gray-600 flex items-start gap-1">
                          <span className="text-orange-500 mt-0.5">•</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Location Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <MapPin className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Melhores Regiões</h3>
              <p className="text-gray-600">Escolha a localização ideal para sua estadia</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "Vila dos Remédios",
                description: "Centro histórico com vida noturna",
                distance: "Centro",
                features: ["Restaurantes", "Vida noturna", "Comércio", "Fácil acesso"],
                best: "Primeira visita"
              },
              {
                name: "Floresta Nova",
                description: "Tranquilo e próximo às praias",
                distance: "5 min das praias",
                features: ["Mais reservado", "Natureza", "Praias próximas", "Silêncio"],
                best: "Descanso"
              },
              {
                name: "Boldró",
                description: "Vista privilegiada do mar",
                distance: "Vista para o mar",
                features: ["Pôr do sol", "Vista oceânica", "Exclusividade", "Privacidade"],
                best: "Lua de mel"
              },
              {
                name: "Sueste",
                description: "Próximo ao Projeto Tamar",
                distance: "10 min do centro",
                features: ["Tartarugas", "Mergulho", "Aventura", "Natureza"],
                best: "Aventureiros"
              }
                            ].map((location) => (
              <motion.div
                key={location.name}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.description}</p>
                  </div>
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    {location.distance}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  {location.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-amber-500 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
                
                <div className="text-xs">
                  <span className="text-gray-500">Ideal para: </span>
                  <span className="font-medium text-gray-900">{location.best}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Booking Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={cn(ui.cards.base, "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-8")}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Dicas para Reservar</h3>
              <p className="text-gray-600">Como garantir a melhor hospedagem</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Calendar,
                title: "Antecedência",
                tip: "Reserve com 3-6 meses de antecedência para melhor preço e disponibilidade"
              },
              {
                icon: DollarSign,
                title: "Negociação",
                tip: "Para estadias longas, negocie desconto diretamente com a hospedagem"
              },
              {
                icon: Star,
                title: "Avaliações",
                tip: "Leia avaliações recentes e verifique fotos atuais dos quartos"
              },
              {
                icon: Phone,
                title: "Contato Direto",
                tip: "Ligue para confirmar detalhes e esclarecer dúvidas antes da viagem"
              }
            ].map((tip) => (
              <motion.div
                key={tip.title}
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-4 p-4 bg-white/50 rounded-xl backdrop-blur-sm"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <tip.icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.tip}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    ),

    "transportation": (
      <div className="space-y-12">

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
        </motion.div>

        {/* Transportation Options */}
        <div className="grid gap-6">
          {[
            {
              type: "Buggy",
              icon: Car,
              color: "green",
              price: "R$ 150-250/dia",
              description: "A opção mais popular e divertida",
              features: [
                "Liberdade total de horários",
                "Acesso a trilhas e praias remotas",
                "Experiência autêntica da ilha",
                "Ideal para casais e famílias"
              ],
              pros: ["Flexibilidade máxima", "Aventura garantida", "Custo-benefício"],
              cons: ["Requer habilitação", "Pode ser quente", "Combustível caro"],
              tips: [
                "Reserve com antecedência na alta temporada",
                "Verifique o estado do veículo antes de sair",
                "Leve protetor solar e água sempre"
              ]
            },
            {
              type: "Táxi",
              icon: Phone,
              color: "blue",
              price: "R$ 30-80/corrida",
              description: "Conforto e praticidade",
              features: [
                "Motoristas conhecem a ilha",
                "Ar condicionado",
                "Dicas dos locais",
                "Disponível 24h"
              ],
              pros: ["Sem preocupações", "Dicas locais", "Confortável"],
              cons: ["Custo elevado", "Dependência de horários", "Pouca autonomia"],
              tips: [
                "Negocie preços para tours",
                "Peça o número do motorista",
                "Combine horários de volta"
              ]
            },
            {
              type: "Ônibus",
              icon: Users,
              color: "purple",
              price: "R$ 3-5/trecho",
              description: "Opção econômica",
              features: [
                "Mais barato",
                "Rotas principais",
                "Sustentável",
                "Conhece outros viajantes"
              ],
              pros: ["Muito barato", "Ecológico", "Social"],
              cons: ["Horários limitados", "Não vai a todas as praias", "Pode lotar"],
              tips: [
                "Verifique os horários",
                "Tenha um plano B",
                "Chegue cedo nos pontos"
              ]
            },
            {
              type: "Bicicleta",
              icon: Activity,
              color: "orange",
              price: "R$ 30-50/dia",
              description: "Sustentável e saudável",
              features: [
                "Zero emissões",
                "Exercício",
                "Ritmo tranquilo",
                "Economia"
              ],
              pros: ["Ecológico", "Saudável", "Barato"],
              cons: ["Limitado por distância", "Depende do clima", "Esforço físico"],
              tips: [
                "Use protetor solar",
                "Leve água sempre",
                "Evite o sol do meio-dia"
              ]
            }
          ].map((transport, index) => (
            <motion.div
              key={transport.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                ui.cards.base,
                ui.cards.hover.lift,
                "group relative overflow-hidden p-0"
              )}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                {
                  "from-green-500 to-emerald-500": transport.color === "green",
                  "from-blue-500 to-indigo-500": transport.color === "blue",
                  "from-purple-500 to-pink-500": transport.color === "purple",
                  "from-orange-500 to-amber-500": transport.color === "orange",
                }
              )} />
              
              <div className="relative z-10 p-8">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Header */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        {
                          "bg-gradient-to-br from-green-100 to-emerald-100": transport.color === "green",
                          "bg-gradient-to-br from-blue-100 to-indigo-100": transport.color === "blue",
                          "bg-gradient-to-br from-purple-100 to-pink-100": transport.color === "purple",
                          "bg-gradient-to-br from-orange-100 to-amber-100": transport.color === "orange",
                        }
                      )}>
                        <transport.icon className={cn(
                          "w-6 h-6",
                          {
                            "text-green-600": transport.color === "green",
                            "text-blue-600": transport.color === "blue",
                            "text-purple-600": transport.color === "purple",
                            "text-orange-600": transport.color === "orange",
                          }
                        )} />
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{transport.type}</h4>
                        <p className="text-sm text-gray-600">{transport.description}</p>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium",
                      {
                        "bg-green-100 text-green-700": transport.color === "green",
                        "bg-blue-100 text-blue-700": transport.color === "blue",
                        "bg-purple-100 text-purple-700": transport.color === "purple",
                        "bg-orange-100 text-orange-700": transport.color === "orange",
                      }
                    )}>
                      {transport.price}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="lg:col-span-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Features */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-gray-900">Características:</h5>
                        <div className="space-y-2">
                          {transport.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                {
                                  "bg-green-500": transport.color === "green",
                                  "bg-blue-500": transport.color === "blue",
                                  "bg-purple-500": transport.color === "purple",
                                  "bg-orange-500": transport.color === "orange",
                                }
                              )} />
                              <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pros and Cons */}
                      <div className="space-y-4">
                        <div>
                                                     <h6 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                             <CheckCircle className="w-3 h-3" />
                             Vantagens
                           </h6>
                          <ul className="space-y-1">
                            {transport.pros.map((pro) => (
                              <li key={pro} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-green-500 mt-0.5">•</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h6 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Atenção
                          </h6>
                          <ul className="space-y-1">
                            {transport.cons.map((con) => (
                              <li key={con} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-orange-500 mt-0.5">•</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                      <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-500" />
                        Dicas Importantes
                      </h6>
                      <ul className="space-y-1">
                        {transport.tips.map((tip) => (
                          <li key={tip} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Combination Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={cn(ui.cards.base, "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 p-8")}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Combinações Inteligentes</h3>
              <p className="text-gray-600">Otimize sua mobilidade na ilha</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Econômico",
                combination: "Ônibus + Bicicleta",
                description: "Para orçamentos apertados",
                daily: "R$ 35-55/dia",
                bestFor: "Mochileiros e jovens"
              },
              {
                title: "Balanceado",
                combination: "Buggy + Táxi",
                description: "Flexibilidade quando precisar",
                daily: "R$ 180-300/dia",
                bestFor: "Casais e pequenos grupos"
              },
              {
                title: "Confort",
                combination: "Táxi + Transfer",
                description: "Máximo conforto",
                daily: "R$ 200-400/dia",
                bestFor: "Famílias e viajantes maduros"
              },
              {
                title: "Aventura",
                combination: "Buggy + Bicicleta",
                description: "Liberdade total",
                daily: "R$ 180-280/dia",
                bestFor: "Aventureiros e esportistas"
              }
            ].map((combo) => (
              <motion.div
                key={combo.title}
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-white/60 rounded-xl backdrop-blur-sm border border-white/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{combo.title}</h4>
                    <p className="text-indigo-600 font-medium">{combo.combination}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{combo.daily}</div>
                    <div className="text-xs text-gray-500">por dia</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{combo.description}</p>
                
                <div className="text-xs">
                  <span className="text-gray-500">Ideal para: </span>
                  <span className="font-medium text-gray-900">{combo.bestFor}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Practical Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <Info className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Informações Práticas</h3>
              <p className="text-gray-600">Tudo que você precisa saber</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Documentos</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  CNH para alugar buggy
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Cartão de crédito para caução
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Comprovante de hospedagem
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Combustível</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Gasolina: R$ 7-8/litro
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Poucos postos na ilha
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Abasteça sempre que possível
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Segurança</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Respeite os limites de velocidade
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Cuidado com animais na pista
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Use cinto de segurança sempre
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Conteúdo do Ebook da Tuca - Capítulo 2: Onde Ficar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Dicas do Tuca sobre Hospedagem</h3>
              <p className="text-gray-600">Conselhos exclusivos para escolher a melhor pousada</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Dicas principais */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                Dicas Essenciais do Tuca
              </h4>
              <div className="space-y-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>💡 Pesquise bem:</strong> Na mesma faixa de preço você pode encontrar opções bem diferentes. 
                    Avalie o que é mais importante para você, seja a localização, o conforto ou os serviços oferecidos.
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>⭐ Avaliações:</strong> Sempre confira as avaliações de outros hóspedes para garantir que a 
                    pousada atenda às suas expectativas. Sites de viagem e redes sociais são ótimas fontes de informações e reviews.
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>🏛️ Legalização:</strong> Procure sempre estabelecimentos legalizados pela administração de 
                    Noronha. Isso garante que você terá uma estadia segura e sem imprevistos.
                  </p>
                </div>
              </div>
            </div>

            {/* Importância da Localização */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Importância da Localização
                </h4>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    A localização da sua pousada pode fazer uma grande diferença na sua experiência em Fernando de Noronha. 
                    Ficar perto das principais praias ou do centro pode facilitar o acesso às atrações e economizar tempo.
                  </p>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>💡 Dica do Tuca:</strong> Se você quer explorar várias praias, ficar em uma área central pode ser mais conveniente. 
                      Estar perto das praias pode proporcionar uma experiência mais intensa da beleza natural de Noronha.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-purple-600" />
                  Variedade de Opções
                </h4>
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    Fernando de Noronha oferece uma variedade de pousadas que atendem a todos os gostos e orçamentos. 
                    Desde as mais simples até as mais luxuosas, você encontrará o lugar perfeito para sua estadia na ilha.
                  </p>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-green-800 text-sm">
                      Vale a pena explorar bem as opções, pois mesmo dentro da mesma faixa de preço, você pode encontrar 
                      diferenças significativas em termos de conforto, serviços e localização.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapa de Fernando de Noronha */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-600" />
                Principais Regiões para Hospedagem
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Vila dos Remédios</h5>
                  <p className="text-sm text-gray-700">Centro histórico, próximo a restaurantes e vida noturna</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Floresta Nova</h5>
                  <p className="text-sm text-gray-700">Área mais tranquila, boa para descanso</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Próximo às Praias</h5>
                  <p className="text-sm text-gray-700">Acesso facilitado às principais praias da ilha</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),

    "beaches": (
      <div className="space-y-12">

        {/* Introduction Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center space-y-6"
        >
          
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              Fernando de Noronha abriga algumas das praias mais espetaculares do planeta, 
              cada uma com sua personalidade única e beleza incomparável. Prepare-se para 
              uma jornada pelos paraísos aquáticos do Atlântico Sul.
            </p>
          </div>
        </motion.div>

        {/* Beach Cards Section */}
        <div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Baía do Sancho",
                rating: 5,
                difficulty: "Difícil",
                features: ["Repetidamente eleita uma das praias mais bonitas do mundo", "Acesso por escada em fenda rochosa", "Ideal para visitar cedo"],
                access: "Escada íngreme entre rochas",
                bestTime: "Manhã cedo",
                image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
                color: "cyan",
                crowdLevel: "Alta",
                waterTemp: "26°C",
                bestMonths: "Abr-Set"
              },
              {
                name: "Baía dos Porcos",
                rating: 5,
                difficulty: "Moderado",
                features: ["Famosa pelas piscinas naturais de águas esverdeadas", "Vista clássica do Morro Dois Irmãos", "Paraíso para snorkeling"],
                access: "Trilha curta e rochosa",
                bestTime: "Maré baixa",
                image: "https://images.unsplash.com/photo-1527004760000-e4c3bf54b1b3?w=400&h=300&fit=crop",
                color: "blue",
                crowdLevel: "Média",
                waterTemp: "27°C",
                bestMonths: "Abr-Set"
              },
              {
                name: "Praia do Leão",
                rating: 4,
                difficulty: "Fácil",
                features: ["Principal santuário para a desova de tartarugas marinhas", "Acesso controlado e fecha mais cedo", "Mar forte, exige cautela"],
                access: "Acesso controlado",
                bestTime: "Final da tarde",
                image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop",
                color: "green",
                crowdLevel: "Baixa",
                waterTemp: "25°C",
                bestMonths: "Dez-Mar"
              }
            ].map((beach, index) => {
              // beachColor removido (não utilizado)
              
              return (
                <motion.div
                  key={beach.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={cn(ui.cards.base, "overflow-hidden group cursor-pointer relative")}
                  onClick={() => onToggleFavorite(beach.name)}
                >
                  {/* Floating Badge */}
                  <div className="absolute top-4 left-4 z-30">
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-3 py-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            i < beach.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-400"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={beach.image}
                      alt={beach.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      width={300}
                      height={256}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Favorite Button */}
                    <motion.button 
                      className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors z-30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart className={cn(
                        "w-5 h-5",
                        favorites.includes(beach.name)
                          ? "text-red-500 fill-red-500"
                          : "text-white"
                      )} />
                    </motion.button>
                    
                    {/* Beach Name and Info */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-2">{beach.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-4 h-4" />
                          <span>{beach.waterTemp}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{beach.crowdLevel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={cn(
                        "text-xs font-medium px-3 py-1 rounded-full",
                        beach.difficulty === "Fácil" ? "bg-green-100 text-green-700" :
                        beach.difficulty === "Moderado" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        Acesso: {beach.difficulty}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Melhor: {beach.bestTime}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {beach.features.slice(0, 2).map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Additional Info */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Melhor época: {beach.bestMonths}</span>
                        <span>Acesso: {beach.access}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mar de Dentro vs Mar de Fora Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={cn(ui.cards.base, "p-0 overflow-hidden")}
        >
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl">
                <Map className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">A Dualidade das Águas</h3>
                <p className="text-gray-600">Mar de Dentro vs. Mar de Fora</p>
              </div>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Mar de Dentro */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-300/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
                      <Compass className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Mar de Dentro</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mt-1">
                        <Navigation className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Orientação</p>
                        <p className="text-sm text-gray-600">Costa virada para o Brasil</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mt-1">
                        <Calendar className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Melhor Época</p>
                        <p className="text-sm text-gray-600">Abril a Setembro</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mt-1">
                        <Activity className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Ideal Para</p>
                        <p className="text-sm text-gray-600">Natação e snorkeling</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Mar de Fora */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-300/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Mar de Fora</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                        <Navigation className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Orientação</p>
                        <p className="text-sm text-gray-600">Costa virada para a África</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Melhor Época</p>
                        <p className="text-sm text-gray-600">Dezembro a Março</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                        <Waves className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Características</p>
                        <p className="text-sm text-gray-600">Mar mais calmo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Pro Tip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Dica de Ouro</p>
                  <p className="text-xs text-gray-600">
                    Planeje sua viagem considerando esses períodos para aproveitar cada lado da ilha no seu melhor momento!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

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
      <div className="space-y-12">

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center space-y-6"
        >
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              A gastronomia de Fernando de Noronha é uma experiência sensorial única, 
              que combina sabores locais com técnicas refinadas, sempre acompanhada 
              pelos cenários mais espetaculares do Brasil.
            </p>
          </div>
        </motion.div>
        {/* Dining Categories Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              category: "Jantares Memoráveis",
              icon: Fish,
              avgPrice: "R$ 150-300",
              mustTry: "Cacimba Bistrô & Xica da Silva",
              color: "blue",
              description: "Experiências gastronômicas únicas"
            },
            {
              category: "Restaurantes de Pousadas",
              icon: Utensils,
              avgPrice: "R$ 200-400",
              mustTry: "Maravilha, NANNAI, Teju-Açu",
              color: "orange",
              description: "Sofisticação e vista privilegiada"
            },
            {
              category: "O Ritual do Pôr do Sol",
              icon: Sun,
              avgPrice: "R$ 80-150",
              mustTry: "Mergulhão, Bar do Meio, Forte do Boldró",
              color: "purple",
              description: "Drinks e petiscos com vista"
            },
            {
              category: "Eventos Gastronômicos",
              icon: Trophy,
              avgPrice: "R$ 250-500",
              mustTry: "Festival Gastronômico do Zé Maria, Peixada do Solón",
              color: "green",
              description: "Experiências exclusivas"
            }
          ].map((cat, index) => {
            // catColor removido (não utilizado)
            
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.4 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={cn(ui.cards.base, "p-6 text-center group cursor-pointer relative overflow-hidden")}
              >
                {/* Background decoration */}
                <div className={cn(
                  "absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300",
                  `bg-${cat.color}-500`
                )} style={{ transform: "translate(50%, -50%)" }} />
                
                <div className="relative">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110",
                    `bg-gradient-to-br from-${cat.color}-400 to-${cat.color}-600 shadow-lg`
                  )}>
                    <cat.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{cat.category}</h3>
                  <p className="text-sm text-gray-600 mb-3">{cat.description}</p>
                  
                  <div className="mb-3">
                    <span className={cn("text-sm font-bold", `text-${cat.color}-600`)}>
                      {cat.avgPrice}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Imperdível:</p>
                    <p className="text-xs font-medium text-gray-700">{cat.mustTry}</p>
                  </div>
                </div>
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
    ),

    "primeiros-passos": (
      <div className="space-y-12">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Primeiros Passos</h3>
              <p className="text-gray-600">Seu guia completo para começar em Fernando de Noronha</p>
            </div>
          </div>

          {/* Interactive Step Cards */}
          <div className="grid gap-6">
            {[
              {
                step: 1,
                title: "Planeje sua Viagem",
                description: "Escolha as melhores datas e defina sua estadia",
                icon: Calendar,
                color: "blue",
                details: [
                  "Melhor época: Maio a Setembro (seca)",
                  "Duração recomendada: 5-7 dias",
                  "Reserve com antecedência (alta demanda)",
                  "Considere feriados e alta temporada"
                ]
              },
              {
                step: 2,
                title: "Documentação",
                description: "Prepare todos os documentos necessários",
                icon: FileText,
                color: "emerald",
                details: [
                  "CPF e RG ou CNH válidos",
                  "Comprovante de hospedagem",
                  "Cartão de vacina atualizado",
                  "Seguro viagem (recomendado)"
                ]
              },
              {
                step: 3,
                title: "Taxa de Preservação",
                description: "Pague a taxa ambiental obrigatória",
                icon: DollarSign,
                color: "amber",
                details: [
                  "Taxa por pessoa por dia",
                  "Pagamento online antecipado",
                  "Desconto para permanência maior",
                  "Válido por 10 dias"
                ]
              },
              {
                step: 4,
                title: "Chegada na Ilha",
                description: "Orientações para sua chegada",
                icon: Plane,
                color: "purple",
                details: [
                  "Voo obrigatório via Recife ou Natal",
                  "Apresentar documentos na chegada",
                  "Retirar material informativo",
                  "Contratar transfers se necessário"
                ]
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  ui.cards.base,
                  ui.cards.hover.lift,
                  "group relative overflow-hidden p-0"
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                  {
                    "from-blue-500 to-blue-600": step.color === "blue",
                    "from-emerald-500 to-emerald-600": step.color === "emerald",
                    "from-amber-500 to-amber-600": step.color === "amber",
                    "from-purple-500 to-purple-600": step.color === "purple",
                  }
                )} />
                
                <div className="relative z-10 p-8">
                  <div className="flex items-start gap-6">
                    <div className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-105 transition-transform duration-300",
                      {
                        "from-blue-500 to-blue-600": step.color === "blue",
                        "from-emerald-500 to-emerald-600": step.color === "emerald",
                        "from-amber-500 to-amber-600": step.color === "amber",
                        "from-purple-500 to-purple-600": step.color === "purple",
                      }
                    )}>
                      <div className="relative">
                        <step.icon className="w-8 h-8 text-white" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800">{step.step}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      
                      <div className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <motion.div
                            key={detail}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: (index * 0.1) + (idx * 0.05) }}
                            className="flex items-center gap-3"
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              {
                                "bg-blue-500": step.color === "blue",
                                "bg-emerald-500": step.color === "emerald",
                                "bg-amber-500": step.color === "amber",
                                "bg-purple-500": step.color === "purple",
                              }
                            )} />
                            <span className="text-sm text-gray-700">{detail}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={cn(ui.cards.base, "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 p-8")}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Dicas Importantes</h3>
              <p className="text-gray-600">Informações essenciais para sua viagem</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Clock,
                title: "Horários",
                tip: "Restaurantes fecham cedo (21h). Planeje suas refeições."
              },
              {
                icon: Phone,
                title: "Conectividade",
                tip: "Sinal limitado em algumas áreas. Download mapas offline."
              },
              {
                icon: CreditCard,
                title: "Pagamentos",
                tip: "Leve dinheiro em espécie. Nem todos aceitam cartão."
              },
              {
                icon: Sun,
                title: "Proteção Solar",
                tip: "Sol intenso o ano todo. Protetor solar é essencial."
              }
            ].map((tip) => (
              <motion.div
                key={tip.title}
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-4 p-4 bg-white/50 rounded-xl backdrop-blur-sm"
              >
                <div className="p-2 bg-orange-100 rounded-lg">
                  <tip.icon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.tip}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    ),

    // Novas seções baseadas no Ebook da Tuca
    "activities": (
      <div className="space-y-12">
        {/* Conteúdo do Capítulo 3: O Que Fazer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">O Que Fazer em Fernando de Noronha</h3>
              <p className="text-gray-600">Atividades imperdíveis na ilha paradisíaca</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Mergulho de Cilindro */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Fish className="w-6 h-6 text-blue-600" />
                Mergulho de Cilindro
              </h4>
              <p className="text-gray-700 mb-4">
                Fernando de Noronha é um paraíso para os amantes do mergulho com cilindro. Com águas claras e uma abundante vida marinha, você terá experiências inesquecíveis.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Batismo</h5>
                  <p className="text-sm text-gray-700 mb-2">Para iniciantes, com um instrutor por pessoa. Inclui aula no barco sobre uso de equipamentos e normas de segurança.</p>
                  <p className="text-xs text-blue-600">📅 Horários: Manhã 7h30 / Tarde 13h45</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Credenciado</h5>
                  <p className="text-sm text-gray-700 mb-2">Para mergulhadores certificados, com dois mergulhos em diferentes pontos da ilha.</p>
                  <p className="text-xs text-blue-600">📅 Horários: Manhã 7h30 / Tarde 13h45</p>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 mt-4">
                <p className="text-emerald-800 text-sm">
                  <strong>💡 Dica do Tuca:</strong> Mesmo se o tempo não estiver perfeito, o mergulho ainda vale muito a pena. 
                  É uma experiência incrível. Não precisa saber nadar, pois você estará sempre acompanhado por um instrutor.
                </p>
              </div>
            </div>

            {/* Atividades Aquáticas */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Waves className="w-5 h-5 text-cyan-600" />
                  Bike Aquática
                </h4>
                <p className="text-gray-700 mb-3">
                  O passeio dura entre 45 minutos e 1 hora, começando na Praia do Porto e passando pelas faixas de areia da Biboca, Cachorro e Meio.
                </p>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-cyan-800 text-sm">
                    <strong>💡 Dica do Tuca:</strong> Pela manhã, a chance de ver golfinhos é maior.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-orange-600" />
                  Canoa Havaiana
                </h4>
                <p className="text-gray-700 mb-3">
                  Expedição que combina aventura e contemplação, com roteiro de 4 km saindo da Praia do Porto. Duração média de duas horas.
                </p>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-orange-800 text-sm">
                    <strong>💡 Dica do Tuca:</strong> Tente ir no horário do nascer do sol. A chance de ver golfinhos de perto é alta e o visual é inesquecível.
                  </p>
                </div>
              </div>
            </div>

            {/* IlhaTour */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-6 h-6 text-purple-600" />
                IlhaTour - Conheça 70% da Ilha
              </h4>
              <p className="text-gray-700 mb-4">
                Passeio guiado em veículo 4x4, passando pelos principais pontos turísticos e praias da ilha. 
                Inclui regiões portuárias, mirantes, praias e termina com o pôr do sol no Mirante do Boldró.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">✅ Incluso</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Traslado ida e volta</li>
                    <li>• Guia experiente</li>
                  </ul>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">❌ Não Incluso</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Equipamento de mergulho</li>
                    <li>• Almoço</li>
                    <li>• Ingresso PARNAMAR</li>
                  </ul>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-purple-800 text-sm">
                      <strong>💡 Dica do Tuca:</strong> Ideal para quem visita a ilha pela primeira vez e quer conhecer 70% desse paraíso em um dia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),

    "culture-history": (
      <div className="space-y-12">
        {/* Conteúdo do Capítulo 6: Cultura e História */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Cultura e História</h3>
              <p className="text-gray-600">Explore a rica herança histórica de Fernando de Noronha</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Forte de Nossa Senhora dos Remédios */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-600" />
                Forte de Nossa Senhora dos Remédios
              </h4>
              <p className="text-gray-700 mb-4">
                Um dos principais pontos históricos da ilha, construído no século XVIII. É um dos maiores e mais bem preservados fortes da ilha, representando a arquitetura militar portuguesa.
              </p>
              <div className="bg-white/70 rounded-xl p-4">
                <p className="text-amber-800 text-sm">
                  <strong>💡 Dica do Tuca:</strong> Visite ao entardecer para capturar belas fotos do pôr do sol e tomar um drink. 
                  Em vários pontos que você vai passar durante seus passeios poderá ver ruínas, sempre pergunte ao seu guia o que são elas.
                </p>
              </div>
            </div>

            {/* Grid de Pontos Históricos */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Museu do Tubarão
                </h4>
                <p className="text-gray-700 mb-3">
                  Oferece uma visão sobre a fauna marinha local e a importância da preservação dos tubarões. 
                  O museu tem exposições educativas sobre a vida marinha.
                </p>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 Dica do Tuca:</strong> Ótimo lugar para aprender sobre a vida marinha. As crianças adoram e os adultos também se surpreendem com as curiosidades.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building className="w-5 h-5 text-green-600" />
                  Palácio de São Miguel
                </h4>
                <p className="text-gray-700 mb-3">
                  Sede administrativa da ilha, possui uma arquitetura colonial charmosa. Construído no século XVIII, 
                  ainda hoje serve como importante edifício governamental.
                </p>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-green-800 text-sm">
                    <strong>💡 Dica do Tuca:</strong> Vale a pena dar uma passada e apreciar a arquitetura colonial. 
                    Muitas vezes você pode ver exposições temporárias e eventos culturais.
                  </p>
                </div>
              </div>
            </div>

            {/* Outros Marcos Históricos */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-cyan-50 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-600" />
                  Forte do Sueste
                </h5>
                <p className="text-sm text-gray-700 mb-2">
                  Com vista privilegiada da Praia do Sueste, este forte fazia parte do sistema de defesa da ilha.
                </p>
                <p className="text-xs text-cyan-600">Excelente ponto para observar a vida marinha de cima</p>
              </div>
              
              <div className="bg-indigo-50 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Museu do Terminal
                </h5>
                <p className="text-sm text-gray-700 mb-2">
                  Oferece uma visão abrangente da história de Fernando de Noronha, desde sua descoberta até os dias atuais.
                </p>
                <p className="text-xs text-indigo-600">Exposições bem detalhadas e educativas</p>
              </div>

              <div className="bg-pink-50 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-600" />
                  Igreja dos Remédios
                </h5>
                <p className="text-sm text-gray-700 mb-2">
                  Marco religioso e histórico importante da ilha, localizada na Vila dos Remédios.
                </p>
                <p className="text-xs text-pink-600">Arquitetura colonial preservada</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),

    "sustainability": (
      <div className="space-y-12">
        {/* Conteúdo do Capítulo 10: Sustentabilidade e Preservação Ambiental */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Sustentabilidade e Preservação</h3>
              <p className="text-gray-600">Como contribuir para manter Fernando de Noronha sustentável</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Lei do Plástico Zero */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-green-600" />
                Lei do Plástico Zero
              </h4>
              <p className="text-gray-700 mb-4">
                Em vigor desde 2019, a Lei do Plástico Zero proíbe o uso, a venda e a distribuição de plásticos descartáveis em Fernando de Noronha. 
                Isso inclui canudos, copos, talheres, sacolas plásticas e outros itens similares.
              </p>
              
              <div className="bg-white/70 rounded-xl p-4 mb-4">
                <h5 className="font-semibold text-gray-900 mb-2">Objetivo da Lei</h5>
                <p className="text-gray-700">Reduzir a poluição plástica na ilha, protegendo a vida marinha e os ecossistemas locais.</p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-emerald-800 text-sm">
                  <strong>💡 Dica do Tuca:</strong> Apoie a Lei do Plástico Zero trazendo seus próprios utensílios reutilizáveis 
                  e incentivando outros visitantes a fazerem o mesmo.
                </p>
              </div>
            </div>

            {/* Como Contribuir */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Dicas para Visitantes
                </h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h5 className="font-semibold text-blue-900 mb-2">♻️ Reduza Plásticos</h5>
                    <p className="text-blue-800 text-sm">Traga garrafas reutilizáveis e sacolas de tecido</p>
                  </div>
                  <div className="bg-cyan-50 rounded-xl p-4">
                    <h5 className="font-semibold text-cyan-900 mb-2">🐠 Respeite a Vida Marinha</h5>
                    <p className="text-cyan-800 text-sm">Evite tocar nos corais e não alimente os animais</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h5 className="font-semibold text-emerald-900 mb-2">🌿 Siga as Trilhas</h5>
                    <p className="text-emerald-800 text-sm">Para proteger a vegetação nativa e evitar erosão</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-green-600" />
                  Participação em Projetos
                </h4>
                <div className="space-y-3">
                  <div className="bg-orange-50 rounded-xl p-4">
                    <h5 className="font-semibold text-orange-900 mb-2">🤝 Voluntariado</h5>
                    <p className="text-orange-800 text-sm">Participe de programas que ajudam na conservação da ilha</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <h5 className="font-semibold text-yellow-900 mb-2">🏖️ Limpeza de Praias</h5>
                    <p className="text-yellow-800 text-sm">Junte-se às iniciativas de limpeza para manter as praias livres de lixo</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h5 className="font-semibold text-purple-900 mb-2">🏛️ Projeto Tamar</h5>
                    <p className="text-purple-800 text-sm">Apoie a proteção das tartarugas marinhas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tratamento de Lixo */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                Tratamento de Lixo na Ilha
              </h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">♻️ Reciclagem</h5>
                  <p className="text-sm text-gray-700">
                    Materiais recicláveis são enviados para o continente, onde são processados adequadamente.
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">🌱 Compostagem</h5>
                  <p className="text-sm text-gray-700">
                    Resíduos orgânicos são compostados na própria ilha e utilizados como adubo.
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">📚 Educação</h5>
                  <p className="text-sm text-gray-700">
                    Programas educativos conscientizam sobre a correta destinação dos resíduos.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 mt-4">
                <p className="text-green-800 text-sm">
                  <strong>💡 Dica do Tuca:</strong> Faça sua parte separando corretamente os resíduos e participe dos 
                  programas de educação ambiental para aprender mais sobre como proteger a ilha.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),

    "favorite-spots": (
      <div className="space-y-12">
        {/* Conteúdo do Capítulo 9: Meus Cantos Favoritos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Meus Cantos Favoritos</h3>
              <p className="text-gray-600">Lugares especiais e dicas exclusivas do Tuca</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Praias Favoritas */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Waves className="w-6 h-6 text-cyan-600" />
                Praias Favoritas do Tuca
              </h4>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🏖️ Praia da Conceição</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Ideal para pegar um cantinho no Duda Rei e reunir a turma para passar a tarde por lá. 
                    Praia linda e com um &ldquo;movimento&rdquo; maior.
                  </p>
                  <div className="bg-cyan-50 rounded-lg p-2">
                    <p className="text-cyan-800 text-xs">
                      <strong>💡 Dica:</strong> Pegue um guarda-sol no bar do Duda Rei e faça dele a base da sua turma.
                    </p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🌊 Baía do Sancho</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Perfeita para mergulho e snorkeling, frequentemente considerada uma das praias mais bonitas do mundo.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-blue-800 text-xs">
                      <strong>💡 Dica:</strong> Chegue cedo para pegar um cantinho embaixo da sombra da árvore no canto direito.
                    </p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🐢 Praia do Leão</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Ótima para observar tartarugas, especialmente durante a temporada de desova.
                  </p>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <p className="text-orange-800 text-xs">
                      <strong>💡 Dica:</strong> Leve guarda-sol porque é muito difícil achar uma sombra por lá.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vida Noturna */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-purple-600" />
                Vida Noturna Favorita
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🍻 Bar do Cachorro</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Ambiente animado com música ao vivo e uma atmosfera vibrante.
                  </p>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-purple-800 text-sm">
                      <strong>💡 Dica do Tuca:</strong> Para mim, o ambiente mais bacana que integra os visitantes com os ilhéus. 
                      Veja o dia do forrozinho que é sempre mais animado.
                    </p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🎉 Pousada Zé Maria</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Conhecida por suas noites temáticas e festas animadas, especialmente o famoso festival gastronômico.
                  </p>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-indigo-800 text-sm">
                      <strong>💡 Dica do Tuca:</strong> Uma parada obrigatória é o Festival Gastronômico. 
                      Marque com antecedência, sempre está cheio!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mirantes Especiais */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-6 h-6 text-amber-600" />
                Mirante Secreto do Tuca
              </h4>
              
              <div className="bg-white/70 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-3">🌅 Mirante dos Golfinhos + Trilha do Sancho</h5>
                <p className="text-gray-700 mb-4">
                  A grande maioria sempre faz a trilha e desce direto para o Sancho. Mas existe uma trilha maior e mais completa que eu particularmente adoro.
                </p>
                <p className="text-gray-700 mb-4">
                  Ao invés de ir direto pela trilha que desce para o Sancho, eu sigo pela esquerda e vou antes ao Mirante dos Golfinhos. 
                  É um lugar lindo de contemplar, e ainda tem chance de ver os golfinhos do alto.
                </p>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>🏆 Segredo do Tuca:</strong> Saindo do Mirante dos Golfinhos, tem uma trilha que vai margeando o paredão 
                    com outros mirantes até chegar na descida do Sancho. É mais longa, mas vale cada passo!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),

    "stories-curiosities": (
      <div className="space-y-12">
        {/* Conteúdo do Capítulo 11: Histórias Engraçadas e Curiosidades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
              <Lightbulb className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Histórias e Curiosidades</h3>
              <p className="text-gray-600">Histórias engraçadas e curiosidades fascinantes da ilha</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Histórias Engraçadas */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-yellow-600" />
                Histórias Engraçadas
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🐬 O Golfinho Guia Turístico</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Uma vez, um grupo de turistas foi seguido por um golfinho curioso durante um passeio de barco. 
                    O golfinho parecia estar conduzindo o grupo, fazendo saltos acrobáticos como se fosse o &ldquo;guia turístico&rdquo; do dia.
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🦀 O &ldquo;Canguru&rdquo; de Noronha</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Um visitante confundiu um grande caranguejo terrestre (guaiamum) com um canguru. 
                    Alarmado, começou a avisar todos sobre o &ldquo;canguru&rdquo;, causando um alvoroço na praia!
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🛟 A Boia Fugitiva</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Em um dia ventoso, uma boia escapou e começou a flutuar em direção ao mar aberto. 
                    A operação de &ldquo;salvamento&rdquo; foi cheia de risadas, com a boia parecendo escapar sempre que alguém se aproximava.
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🐢 As Tartarugas Aventureiras</h5>
                  <p className="text-gray-700 text-sm mb-3">
                    Uma vez, uma tartaruga foi encontrada em um lugar improvável, no quintal de uma casa, 
                    depois de ter se perdido durante sua jornada de desova.
                  </p>
                </div>
              </div>
            </div>

            {/* Curiosidades Fascinantes */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-blue-600" />
                Curiosidades Fascinantes
              </h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">🎬 Noronha e Hollywood</h5>
                  <p className="text-gray-700 text-sm">
                    A beleza cênica de Fernando de Noronha tem atraído cineastas do mundo todo. 
                    Documentários da BBC e National Geographic frequentemente escolhem a ilha como cenário.
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">🪨 A Pedra do Chapéu</h5>
                  <p className="text-gray-700 text-sm">
                    Uma formação rochosa que se assemelha a um chapéu gigante. Histórias variam desde lendas de piratas 
                    até contos de amantes que a visitam para selar seu amor.
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">🌊 A Música das Ondas</h5>
                  <p className="text-gray-700 text-sm">
                    Um fenômeno curioso ocorre quando as ondas batem nas cavernas subaquáticas, 
                    produzindo um som melódico que os moradores chamam de &ldquo;música das ondas&rdquo;.
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">✈️ A Lenda do Avião no Mar</h5>
                  <p className="text-gray-700 text-sm">
                    Há uma história sobre um antigo hidroavião que afundou perto da ilha. 
                    Mergulhadores ainda procuram os destroços, tornando a história uma atração adicional.
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">👻 O &ldquo;Corpo Seco&rdquo;</h5>
                  <p className="text-gray-700 text-sm">
                    Uma antiga brincadeira de susto entre os jovens da ilha envolve o &ldquo;Corpo Seco&rdquo;, 
                    uma figura fictícia que supostamente aparece à noite.
                  </p>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">🌽 Festival do Milho</h5>
                  <p className="text-gray-700 text-sm">
                    Uma das celebrações mais pitorescas de Noronha onde os moradores se reúnem para cozinhar 
                    e compartilhar diversos pratos feitos à base de milho.
                  </p>
                </div>
              </div>
            </div>

            {/* Agradecimento */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">📚 Fonte das Histórias</h4>
                <p className="text-gray-700 mb-4">
                  Agradecimento especial ao livro <strong>&ldquo;1101 Curiosidades sobre o Arquipélago de Fernando de Noronha&rdquo;</strong> 
                  por fornecer essas histórias fascinantes.
                </p>
                <div className="bg-white/70 rounded-xl p-4">
                  <p className="text-indigo-800 text-sm">
                    Se você quiser saber mais, recomendo fortemente a leitura deste livro para descobrir 
                    ainda mais curiosidades sobre este pedaço especial do Brasil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),

    "useful-contacts": (
      <div className="space-y-12">
        {/* Conteúdo dos Contatos Úteis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(ui.cards.base, "p-8")}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl">
              <Phone className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Contatos Úteis</h3>
              <p className="text-gray-600">Informações essenciais para sua segurança e conveniência</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Emergências e Saúde */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                Emergências e Saúde
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Hospital São Lucas
                  </h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>📍 Endereço:</strong> BR-363, Fernando de Noronha, PE</p>
                    <p><strong>📞 Telefone:</strong> +55 81 3619-0458</p>
                    <p><strong>🕒 Funcionamento:</strong> 24 horas por dia, 7 dias por semana</p>
                    <p><strong>⚕️ Serviços:</strong> Urgência, emergência, internação, primeiros socorros</p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Posto de Saúde
                  </h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>📍 Endereço:</strong> Vila dos Remédios</p>
                    <p><strong>📞 Telefone:</strong> +55 81 3619-1125</p>
                    <p><strong>🕒 Funcionamento:</strong> Segunda a sexta, 8h às 17h</p>
                    <p><strong>⚕️ Serviços:</strong> Atendimento básico, vacinação, consultas, odontologia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Segurança
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🚔 Polícia Civil</h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>📍 Endereço:</strong> Vila dos Remédios</p>
                    <p><strong>📞 Telefone:</strong> +55 81 3619-1124</p>
                    <p><strong>🕒 Funcionamento:</strong> 24 horas por dia</p>
                    <p><strong>⚖️ Serviços:</strong> Registro de ocorrências, investigação, atendimento ao cidadão</p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">🚨 Polícia Militar</h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>📍 Endereço:</strong> Vila dos Remédios</p>
                    <p><strong>📞 Emergências:</strong> 190</p>
                    <p><strong>🕒 Funcionamento:</strong> 24 horas por dia</p>
                    <p><strong>🛡️ Serviços:</strong> Segurança pública, patrulhamento, emergências</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Farmácia */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-green-600" />
                Farmácia
              </h4>
              
              <div className="bg-white/70 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-3">💊 Farmácia Mix</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>📍 Endereço:</strong> Vila dos Remédios</p>
                  <p><strong>📞 Telefone:</strong> +55 81 3619-0450</p>
                  <p><strong>🕒 Funcionamento:</strong> Segunda a sábado, 8h às 20h | Domingo, 8h às 13h</p>
                  <p><strong>💊 Serviços:</strong> Medicamentos, produtos de higiene e cuidados pessoais</p>
                </div>
              </div>
            </div>

            {/* Dicas Importantes */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-6 h-6 text-amber-600" />
                Dicas Importantes
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-amber-900 mb-2">📱 Tenha Sempre os Contatos</h5>
                  <p className="text-amber-800 text-sm">
                    Salve esses contatos no seu celular assim que chegar na ilha para ter acesso rápido em caso de necessidade.
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-amber-900 mb-2">🏥 Emergências Médicas</h5>
                  <p className="text-amber-800 text-sm">
                    Para emergências graves que requerem evacuação médica, o hospital tem protocolo de transferência para o continente.
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-amber-900 mb-2">💊 Medicamentos</h5>
                  <p className="text-amber-800 text-sm">
                    Traga medicamentos pessoais, pois nem todos estão disponíveis na farmácia local.
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4">
                  <h5 className="font-semibold text-amber-900 mb-2">🆘 Em Caso de Emergência</h5>
                  <p className="text-amber-800 text-sm">
                    Mantenha sempre identificação e informações de contato de emergência com você.
                  </p>
                </div>
              </div>
            </div>
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
    "boas-vindas": "https://images.unsplash.com/photo-1614723268053-f32f936f13f9?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Fernando de Noronha aerial view
    "accommodation": "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Hotel room with a view
    "transportation": "/images/transfer-hero-guide.png", // Car on a scenic road
    "beaches": "/images/praias-hero.png", // Tropical beach
    "dining": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Restaurant with ocean view
    "monthly-guide": "/images/when-to-go.png", // Calendar or seasonal image
    "activities": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Diving and water activities
    "culture-history": "https://imgmd.net/images/v1/guia/2663135/vila-dos-remedios.jpg", // Historical fort or colonial architecture
    "sustainability": "https://blog.atalaianoronha.com.br/assets/uploads/2023/06/aves-atoba-scaled.jpg", // Environmental conservation
    "favorite-spots": "https://www.civitatis.com/f/brasil/fernando-de-noronha/fernando-de-noronha.jpg", // Secret spots and viewpoints
    "stories-curiosities": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Stories and curiosities
    "useful-contacts": "https://www.viajenaviagem.com/wp-content/uploads/2019/02/onde-ficar-em-fernando-de-noronha-pousada-morena-1920x1080-1.jpg.webp", // Modern communication/emergency
    "default": "https://images.unsplash.com/photo-1501612780327-45045538742d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Default image
  };
  return unsplashImages[sectionId] || unsplashImages["default"];
}

function GuiaPageContent() {
  const [activeSection, setActiveSection] = useState<string>("boas-vindas");
  // preferences removido (não utilizado)
  const [favorites, setFavorites] = useState<string[]>([]);
  // showPreferences removido (não utilizado)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // readProgress removido (não utilizado)
  // bookmarkedSections removido (não utilizado)
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openCommand, setOpenCommand] = useState(false);
  // setSearchTerm removido (não utilizado)
  // debouncedSearchTerm removido (não utilizado)

  // searchResults removido (não utilizado)
  // Estados não utilizados removidos: sectionProgress, setSectionProgress, viewMode, setViewMode, filters, setFilters
  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // scrollY removido (não utilizado)
  // Remover parallax problemático que interfere na interação do hero
  // const heroParallax = useTransform(scrollY, [0, 500], [0, 150]);
  // const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  // const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  // mouseX, mouseY removidos (não utilizados)

  // bind gesture removido (não utilizado)

  // travelData removido (não utilizado)
  // resto do travelData removido

  // useEffect para controlar botão de scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // useEffect keyboard removido (usa variáveis não utilizadas)
  // resto do useEffect keyboard removido

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    
    // Usar requestAnimationFrame para garantir que o DOM seja atualizado com a nova seção
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const heroElement = document.getElementById(`hero-${sectionId}`);
        if (heroElement) {
          heroElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      });
    });
  };

  const toggleFavorite = (item: string) => {
    setFavorites(prev => 
      prev.includes(item) 
        ? prev.filter(f => f !== item)
        : [...prev, item]
    );
  };

  const currentSectionData = guideSections.find(s => s.id === activeSection);
      // currentColor removido (não utilizado)

  return (
    <>
      <div className={cn("min-h-screen bg-gray-50", decorativeBackgrounds.gradient.subtle)} style={{ fontFamily: "'Inter', sans-serif" }}>

        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-70" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-tl from-cyan-100 via-indigo-100 to-purple-100 opacity-40"
            animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="flex min-h-screen overflow-hidden">
          {!isMobile && (
            <aside className="fixed left-0 top-0 w-80 h-full overflow-y-auto p-6 space-y-6 bg-white/60 backdrop-blur-lg border-r border-gray-200/80 z-40">
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

          <main className={cn("flex-1 overflow-y-auto", !isMobile && "ml-80")} ref={contentRef} id="main-content">
            {/* Hero Section - agora dentro do container de scroll */}
            <motion.div
              key={`hero-${activeSection}`}
              ref={heroRef}
              id={`hero-${activeSection}`}
              style={{
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
            
            <div className={cn(
              "max-w-4xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12",
              // Adicionar padding bottom no mobile para evitar sobreposição do menu flutuante
              isMobile && "pb-24"
            )}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div id={activeSection} className={cn(
                    "pt-4",
                    // Padding bottom adicional no mobile para o menu flutuante
                    isMobile && "pb-8"
                  )}>
                    <SectionContent
                      sectionId={activeSection}
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
              <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={() => setOpenCommand(true)}>
                <Search className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Command/Search Dialog */}
        <Dialog open={openCommand} onOpenChange={setOpenCommand}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Buscar no Guia</DialogTitle>
              <DialogDescription>
                Digite para procurar informações específicas no guia de Fernando de Noronha
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Ex: mergulho, trilhas, restaurantes..."
                className="w-full"
                autoFocus
              />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sugestões:</p>
                <div className="flex flex-wrap gap-2">
                  {guideSections.slice(0, 6).map((section) => (
                    <Button
                      key={section.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        scrollToSection(section.id);
                        setOpenCommand(false);
                      }}
                    >
                      {section.title}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => {
              const heroElement = document.getElementById(`hero-${activeSection}`);
              if (heroElement) {
                heroElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start',
                  inline: 'nearest'
                });
              }
            }}
            className="fixed bottom-28 right-4 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </>
  );
}

export default GuiaPageContent;
