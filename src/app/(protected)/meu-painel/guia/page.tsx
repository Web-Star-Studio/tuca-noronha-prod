"use client";

import { useState, useEffect, useMemo } from "react";
import { format, isSameMonth, isAfter, isBefore, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, MapPin, Calendar, Utensils, Waves, Building, Info, Star, Plane, Home, Car, UtensilsCrossed, Sun, Clock, Filter, Heart, DollarSign, Thermometer, Droplets, Zap, X, Camera, Map } from "lucide-react";
import { cardStyles, decorativeBackgrounds, buttonStyles } from "@/lib/ui-config";
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

const guideSections = [
  {
    id: "getting-started",
    title: "Como Chegar",
    icon: Plane,
    description: "Informações completas sobre voos, taxas obrigatórias e documentação necessária para sua viagem"
  },
  {
    id: "accommodation", 
    title: "Hospedagem",
    icon: Home,
    description: "Conheça as melhores regiões da ilha e escolha a hospedagem ideal para sua estadia"
  },
  {
    id: "transportation",
    title: "Transporte",
    icon: Car,
    description: "Compare todas as opções de transporte disponíveis na ilha e escolha a melhor para você"
  },
  {
    id: "beaches",
    title: "Praias",
    icon: Waves,
    description: "Descubra as praias mais incríveis do arquipélago com dicas práticas e informações de acesso"
  },
  {
    id: "dining", 
    title: "Gastronomia",
    icon: UtensilsCrossed,
    description: "Saboreie os melhores restaurantes e especialidades locais da ilha paradisíaca"
  },
  {
    id: "monthly-guide",
    title: "Quando Ir",
    icon: Sun,
    description: "Planeje sua viagem conhecendo o clima e as melhores atividades para cada época do ano"
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

  return (
    <div className="flex min-h-screen bg-gray-50 -mt-24">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-gray-200 fixed h-full overflow-y-auto hidden lg:block top-0 pt-11">
        {/* Configurações de Viagem */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Personalizar Guia</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
              className="h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {showPreferences && (
            <div className="space-y-4">
              {/* Data de Viagem */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Quando você vai viajar?
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-xs h-8"
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
                  Orçamento: R$ {preferences.budget[0]} - R$ {preferences.budget[1]}
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
            </div>
          )}
        </div>
        <nav className="p-4 space-y-2">
          {guideSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <section.icon className={`w-5 h-5 ${
                activeSection === section.id ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <div className="flex-1">
                <div className="font-medium">{section.title}</div>
                <div className="text-sm text-gray-500">
                  {section.id === "getting-started" && "Voos e documentação"}
                  {section.id === "accommodation" && "Onde ficar na ilha"}
                  {section.id === "transportation" && "Como se locomover"}
                  {section.id === "beaches" && "Praias e trilhas"}
                  {section.id === "dining" && "Restaurantes e bares"}
                  {section.id === "monthly-guide" && "Melhor época"}
                </div>
              </div>
              {activeSection === section.id && (
                <ChevronRight className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </nav>
        
        {/* Informações Dinâmicas baseadas na data */}
        {preferences.travelDate && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Sua Viagem - {format(preferences.travelDate, "MMM/yyyy", { locale: ptBR })}
            </h3>
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Clima</span>
                </div>
                <div className="text-xs text-blue-800">
                  {travelData.weather.temperature}°C • {travelData.weather.season}
                </div>
                <div className="text-xs text-blue-700">
                  {travelData.weather.rainChance}% chance de chuva
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Preços Estimados</span>
                </div>
                <div className="text-xs text-green-800">
                  Hospedagem: R$ {travelData.prices.accommodation}/dia
                </div>
                <div className="text-xs text-green-700">
                  Atividades: R$ {travelData.prices.activities}/dia
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Recomendado</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {travelData.bestActivities.slice(0, 2).map((activity) => (
                    <Badge key={activity} variant="secondary" className="text-xs">
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alertas Meteorológicos */}
        <div className="p-4 border-t border-gray-200">
          <WeatherAlerts />
        </div>

        {/* Quick Stats in Sidebar */}
        <div className="p-4 mt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Resumo</h3>
          <div className="space-y-3">
            {[
              { label: "Praias principais", value: "16", icon: Waves },
              { label: "Restaurantes", value: "25+", icon: Utensils },
              { label: "Atividades", value: "50+", icon: Star }
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <stat.icon className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-24 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="p-4">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Guia Fernando de Noronha</h1>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {guideSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 pt-40 lg:pt-0">
        {/* Hero Section */}
        <section className="relative mb-10">
          <div>
            <div
              className="h-[60vh] bg-cover bg-center filter brightness-60 transition-all duration-700"
              style={{
                backgroundImage: `url('${getHeroImage(activeSection)}')`,
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                  {guideSections.find(s => s.id === activeSection)?.title || "Guia Fernando de Noronha"}
                </h1>
                <p className="text-xl max-w-2xl mx-auto">
                  {guideSections.find(s => s.id === activeSection)?.description || 
                   "Descubra todos os segredos do paraíso brasileiro com informações atualizadas e dicas exclusivas."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          <SectionContent 
            sectionId={activeSection} 
            preferences={preferences}
            travelData={travelData}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      </main>
    </div>
  );
}

interface SectionContentProps {
  sectionId: string;
  preferences: UserPreferences;
  travelData: TravelData;
  favorites: string[];
  onToggleFavorite: (item: string) => void;
}

function SectionContent({ sectionId, preferences, travelData, favorites, onToggleFavorite }: SectionContentProps) {
  switch (sectionId) {
    case "getting-started":
      return <GettingStartedContent preferences={preferences} travelData={travelData} />;
    case "accommodation":
      return <AccommodationContent />;
    case "transportation":
      return <TransportationContent />;
    case "beaches":
      return <BeachesContent preferences={preferences} travelData={travelData} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
    case "dining":
      return <DiningContent />;
    case "monthly-guide":
      return <MonthlyGuideContent />;
    default:
      return <div>Seção não encontrada</div>;
  }
}

function GettingStartedContent({ preferences, travelData }: { preferences: UserPreferences; travelData: TravelData }) {
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedAirline, setSelectedAirline] = useState<string>('');
  const [flightResults, setFlightResults] = useState<any[]>([]);
  const [showFlightResults, setShowFlightResults] = useState(false);

  // Principais cidades de origem
  const originCities = [
    { code: 'GRU', name: 'São Paulo (Guarulhos)', region: 'Sudeste', distance: 2100 },
    { code: 'GIG', name: 'Rio de Janeiro (Galeão)', region: 'Sudeste', distance: 1900 },
    { code: 'BSB', name: 'Brasília', region: 'Centro-Oeste', distance: 1650 },
    { code: 'REC', name: 'Recife', region: 'Nordeste', distance: 545 },
    { code: 'FOR', name: 'Fortaleza', region: 'Nordeste', distance: 450 },
    { code: 'NAT', name: 'Natal', region: 'Nordeste', distance: 350 },
    { code: 'SSA', name: 'Salvador', region: 'Nordeste', distance: 950 },
    { code: 'BEL', name: 'Belém', region: 'Norte', distance: 1200 },
    { code: 'MAO', name: 'Manaus', region: 'Norte', distance: 2200 },
    { code: 'CGH', name: 'São Paulo (Congonhas)', region: 'Sudeste', distance: 2100 },
    { code: 'CNF', name: 'Belo Horizonte', region: 'Sudeste', distance: 1800 },
    { code: 'CWB', name: 'Curitiba', region: 'Sul', distance: 2300 },
    { code: 'POA', name: 'Porto Alegre', region: 'Sul', distance: 2600 },
    { code: 'FLN', name: 'Florianópolis', region: 'Sul', distance: 2400 },
    { code: 'VCP', name: 'Campinas (Viracopos)', region: 'Sudeste', distance: 2080 },
    { code: 'CGB', name: 'Cuiabá', region: 'Centro-Oeste', distance: 1850 },
    { code: 'GYN', name: 'Goiânia', region: 'Centro-Oeste', distance: 1700 }
  ];

  // Companhias aéreas que operam para Fernando de Noronha
  const airlines = [
    { 
      code: 'G3', 
      name: 'Gol', 
      routes: ['GRU', 'GIG', 'BSB', 'REC', 'FOR'],
      priceRange: 'R$ 800-2.500',
      frequency: 'Diário',
      aircraft: 'Boeing 737',
      features: ['Conexão obrigatória', 'Bagagem inclusa']
    },
    { 
      code: 'AD', 
      name: 'Azul', 
      routes: ['GRU', 'REC', 'FOR', 'NAT', 'VCP'],
      priceRange: 'R$ 850-2.800',
      frequency: 'Diário',
      aircraft: 'Airbus A320',
      features: ['Voos diretos de REC', 'Conexão via Recife']
    },
    { 
      code: 'LA', 
      name: 'LATAM', 
      routes: ['GRU', 'GIG', 'BSB', 'REC'],
      priceRange: 'R$ 900-3.000',
      frequency: '5x por semana',
      aircraft: 'Airbus A320',
      features: ['Conexão em Recife', 'Programa de milhas']
    }
  ];

  // Calcular informações de voo baseadas na origem selecionada
  const calculateFlightInfo = (originCode: string) => {
    const origin = originCities.find(city => city.code === originCode);
    if (!origin) return null;

    // Lógica para calcular tempo de voo e conexões
    const isDirectRoute = ['REC', 'FOR', 'NAT'].includes(originCode);
    const flightTime = Math.round(origin.distance / 800 * 60); // Aproximação baseada na distância
    const totalTime = isDirectRoute ? flightTime : flightTime + 120; // +2h para conexão

    // Preço baseado na distância e época
    const basePrice = 600 + (origin.distance * 0.5);
    const seasonMultiplier = preferences.travelDate && 
      ([11, 0, 1, 2].includes(preferences.travelDate.getMonth())) ? 1.8 : 1.2;
    const estimatedPrice = Math.round(basePrice * seasonMultiplier);

    return {
      origin,
      isDirectRoute,
      flightTime,
      totalTime,
      estimatedPrice,
      connections: isDirectRoute ? [] : ['REC'],
      availableAirlines: airlines.filter(airline => airline.routes.includes(originCode))
    };
  };

  const flightInfo = selectedOrigin ? calculateFlightInfo(selectedOrigin) : null;

  // Dados sobre taxas obrigatórias
  const requiredFees = [
    {
      name: 'Taxa de Preservação Ambiental (TPA)',
      value: 'R$ 79,20/dia',
      description: 'Taxa obrigatória para preservação do arquipélago',
      paymentMethod: 'Online antecipado ou no aeroporto',
      notes: 'Válida por 10 dias. Após esse período, paga-se nova taxa.',
      link: 'https://www.noronha.pe.gov.br'
    },
    {
      name: 'Taxa de Permanência',
      value: 'R$ 25,28/dia',
      description: 'Para brasileiros, cobrada após 5 dias de permanência',
      paymentMethod: 'No aeroporto na saída',
      notes: 'Primeiros 5 dias são isentos para brasileiros'
    }
  ];

  // Documentação necessária
  const requiredDocuments = [
    {
      type: 'Documento de Identidade',
      description: 'RG ou CNH (dentro da validade) ou Passaporte',
      required: true,
      notes: 'CNH digital é aceita'
    },
    {
      type: 'Comprovante de Hospedagem',
      description: 'Voucher de hotel/pousada ou carta convite',
      required: true,
      notes: 'Obrigatório apresentar na chegada'
    },
    {
      type: 'Comprovante do Voo de Volta',
      description: 'Passagem de retorno confirmada',
      required: true,
      notes: 'Não é permitida entrada sem voo de volta'
    },
    {
      type: 'Certificado de Vacinação',
      description: 'Febre amarela (recomendado)',
      required: false,
      notes: 'Não obrigatório, mas recomendado'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Como Chegar a Fernando de Noronha</h2>
        <p className="text-gray-600">Planeje sua viagem com informações atualizadas sobre voos, taxas e documentação.</p>
      </div>

      {/* Seletor de Cidade de Origem - Interativo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Plane className="w-5 h-5" />
          Calcule sua Rota de Viagem
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-3">
              De onde você vai partir?
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione sua cidade</option>
              {originCities
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((city) => (
                  <option key={city.code} value={city.code}>
                    {city.name} - {city.region}
                  </option>
                ))}
            </select>
          </div>

          {flightInfo && (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Informações da Rota</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Distância:</span>
                  <span className="font-medium">{flightInfo.origin.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tempo de voo:</span>
                  <span className="font-medium">
                    {Math.floor(flightInfo.totalTime / 60)}h{flightInfo.totalTime % 60}min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tipo:</span>
                  <span className="font-medium">
                    {flightInfo.isDirectRoute ? 'Direto' : 'Com conexão'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Preço estimado:</span>
                  <span className="font-medium text-green-600">
                    R$ {flightInfo.estimatedPrice.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados de Voo Detalhados */}
      {flightInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">
            Opções de Voo: {flightInfo.origin.name} → Fernando de Noronha
          </h3>

          <div className="grid gap-4">
            {flightInfo.availableAirlines.map((airline) => (
              <div key={airline.code} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{airline.name}</h4>
                    <p className="text-gray-600 text-sm">{airline.aircraft}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">{airline.priceRange}</div>
                    <div className="text-sm text-gray-500">{airline.frequency}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-500">Rota:</span>
                    <div className="font-medium">
                      {flightInfo.isDirectRoute ? 
                        `${flightInfo.origin.code} → FEN` : 
                        `${flightInfo.origin.code} → REC → FEN`
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Duração total:</span>
                    <div className="font-medium">
                      {Math.floor(flightInfo.totalTime / 60)}h{flightInfo.totalTime % 60}min
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Conexões:</span>
                    <div className="font-medium">
                      {flightInfo.isDirectRoute ? 'Voo direto' : 'Via Recife'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {airline.features.map((feature, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Dicas específicas para a rota */}
          <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">💡 Dicas para sua rota</h4>
            <div className="text-sm text-amber-800 space-y-1">
              {flightInfo.isDirectRoute ? (
                <>
                  <p>• Você está com sorte! Voos diretos disponíveis da sua cidade.</p>
                  <p>• Reserve com antecedência para melhores preços.</p>
                </>
              ) : (
                <>
                  <p>• Conexão obrigatória em Recife - tempo mínimo de 1h30 entre voos.</p>
                  <p>• Considere chegar em Recife no dia anterior se houver poucos voos.</p>
                </>
              )}
              <p>• Chegue ao aeroporto com 2h de antecedência.</p>
              <p>• Voos para Noronha têm restrição de peso - máximo 23kg por pessoa.</p>
            </div>
          </div>
        </div>
      )}

      {/* Taxas Obrigatórias */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Taxas Obrigatórias
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {requiredFees.map((fee, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold">{fee.name}</h4>
                <Badge className="bg-green-100 text-green-800 font-semibold">
                  {fee.value}
                </Badge>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{fee.description}</p>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Pagamento:</span>
                  <span className="ml-2 font-medium">{fee.paymentMethod}</span>
                </div>
                <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                  <span className="text-yellow-800">⚠️ {fee.notes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calculadora de taxas baseada na duração da viagem */}
        {preferences.duration > 0 && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              💰 Custo total das taxas para {preferences.duration} dias
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">TPA:</span>
                <div className="font-semibold">
                  R$ {(79.20 * Math.min(preferences.duration, 10)).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2
                  })}
                </div>
              </div>
              <div>
                <span className="text-blue-700">Taxa Permanência:</span>
                <div className="font-semibold">
                  R$ {(25.28 * Math.max(0, preferences.duration - 5)).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2
                  })}
                </div>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <span className="text-blue-700">Total:</span>
                <div className="font-semibold text-lg">
                  R$ {(
                    (79.20 * Math.min(preferences.duration, 10)) + 
                    (25.28 * Math.max(0, preferences.duration - 5))
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documentação Necessária */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Documentação Necessária
        </h3>
        
        <div className="grid gap-4">
          {requiredDocuments.map((doc, index) => (
            <div key={index} className={`border rounded-lg p-4 ${
              doc.required ? 'border-red-200 bg-red-50' : 'border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  doc.required ? 'bg-red-500' : 'bg-gray-400'
                }`}>
                  {doc.required ? '!' : 'i'}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{doc.type}</h4>
                    <Badge className={doc.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                      {doc.required ? 'Obrigatório' : 'Recomendado'}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-2">{doc.description}</p>
                  
                  <div className="bg-gray-100 p-2 rounded text-xs text-gray-600">
                    💡 {doc.notes}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dicas Finais e Checklist */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <h3 className="text-xl font-semibold text-green-900 mb-4">✅ Checklist Final da Viagem</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-800 mb-3">Antes de Viajar</h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li>□ Passagens aéreas compradas</li>
              <li>□ Hospedagem reservada</li>
              <li>□ TPA paga (online recomendado)</li>
              <li>□ Documentos válidos separados</li>
              <li>□ Seguro viagem contratado</li>
              <li>□ Protetor solar FPS 60+</li>
              <li>□ Equipamentos de mergulho (se aplicável)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-green-800 mb-3">No Aeroporto</h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li>□ Check-in 2h antes</li>
              <li>□ Bagagem máximo 23kg</li>
              <li>□ Documentos em mãos</li>
              <li>□ Comprovante de hospedagem</li>
              <li>□ Comprovante TPA (se pago online)</li>
              <li>□ Passagem de volta confirmada</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-white p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">🎯 Lembretes Importantes</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-green-800">
            <div>• Noronha tem apenas 1 voo por dia por companhia</div>
            <div>• Limite de 420 visitantes simultâneos</div>
            <div>• Não há voos noturnos - último às 17h</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccommodationContent() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  
  const accommodationAreas = [
    {
      id: "vila-remedios",
      name: "Vila dos Remédios",
      description: "Centro histórico da ilha com maior infraestrutura",
      priceRange: "R$ 300 - R$ 800/dia",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop&q=80",
      pros: ["Centro comercial", "Vida noturna", "Restaurantes", "Bancos e farmácia"],
      cons: ["Mais movimentado", "Ruído noturno"],
      features: ["Wi-Fi", "Ar condicionado", "Restaurantes", "Mercado", "Farmácia", "Correios"],
      bestFor: "Primeira visita, viajantes que querem comodidade",
      accommodationTypes: ["Pousadas familiares", "Hotéis boutique", "Suítes luxo"],
      gallery: [
        {
          src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop&q=80",
          alt: "Vila dos Remédios centro",
          caption: "Centro histórico da Vila dos Remédios"
        },
        {
          src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&q=80",
          alt: "Pousadas Vila dos Remédios",
          caption: "Pousadas charmosas no centro"
        }
      ]
    },
    {
      id: "floresta-nova",
      name: "Floresta Nova",
      description: "Região residencial próxima às principais praias",
      priceRange: "R$ 250 - R$ 600/dia",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop&q=80",
      pros: ["Próximo às praias", "Mais silencioso", "Ambiente familiar"],
      cons: ["Menos restaurantes", "Precisa de transporte"],
      features: ["Natureza", "Proximidade praias", "Ambiente residencial"],
      bestFor: "Casais, famílias, quem busca tranquilidade",
      accommodationTypes: ["Pousadas ecológicas", "Casas de temporada", "Flats"],
      gallery: [
        {
          src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop&q=80",
          alt: "Floresta Nova natureza",
          caption: "Ambiente natural da Floresta Nova"
        }
      ]
    },
    {
      id: "boldro",
      name: "Boldró",
      description: "Vista privilegiada para o mar e pôr do sol",
      priceRange: "R$ 400 - R$ 1.200/dia",
      image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=500&fit=crop&q=80",
      pros: ["Vista espetacular", "Pôr do sol", "Mais exclusivo"],
      cons: ["Mais caro", "Longe do centro"],
      features: ["Vista para o mar", "Pôr do sol", "Privacidade"],
      bestFor: "Lua de mel, viagem romântica, experiência premium",
      accommodationTypes: ["Pousadas de luxo", "Suítes vista mar", "Bangalôs"],
      gallery: [
        {
          src: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=600&h=400&fit=crop&q=80",
          alt: "Boldró pôr do sol",
          caption: "Pôr do sol espetacular do Boldró"
        }
      ]
    },
    {
      id: "vila-trinta",
      name: "Vila do Trinta",
      description: "Área residencial mais econômica e familiar",
      priceRange: "R$ 200 - R$ 450/dia",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop&q=80",
      pros: ["Mais barato", "Ambiente local", "Tranquilo"],
      cons: ["Longe das praias", "Poucos serviços"],
      features: ["Economia", "Convivência local", "Autenticidade"],
      bestFor: "Viajantes econômicos, estadias longas",
      accommodationTypes: ["Pousadas simples", "Quartos em casas", "Hostels"],
      gallery: [
        {
          src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&q=80",
          alt: "Vila do Trinta",
          caption: "Ambiente familiar da Vila do Trinta"
        }
      ]
    }
  ];

  const accommodationTips = [
    {
      icon: "🏠",
      title: "Reserve com antecedência",
      description: "Especialmente de dezembro a março (alta temporada)",
      urgency: "critical"
    },
    {
      icon: "🌡️",
      title: "Ar condicionado é essencial",
      description: "Temperaturas podem chegar a 30°C com alta umidade",
      urgency: "important"
    },
    {
      icon: "💧",
      title: "Verifique o abastecimento de água",
      description: "Algumas pousadas têm horários limitados",
      urgency: "important"
    },
    {
      icon: "🚗",
      title: "Considere a localização",
      description: "Distâncias e opções de transporte disponíveis",
      urgency: "normal"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Onde Ficar em Fernando de Noronha</h2>
        <p className="text-gray-600">Escolha a região ideal baseada no seu perfil e orçamento.</p>
      </div>

      {/* Dicas importantes */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">💡 Dicas Essenciais para Hospedagem</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {accommodationTips.map((tip, index) => (
            <div key={index} className={`p-3 rounded-lg border ${
              tip.urgency === 'critical' ? 'bg-red-50 border-red-200' :
              tip.urgency === 'important' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{tip.icon}</span>
                <div>
                  <h4 className={`font-semibold ${
                    tip.urgency === 'critical' ? 'text-red-900' :
                    tip.urgency === 'important' ? 'text-yellow-900' :
                    'text-blue-900'
                  }`}>
                    {tip.title}
                  </h4>
                  <p className={`text-sm ${
                    tip.urgency === 'critical' ? 'text-red-700' :
                    tip.urgency === 'important' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regiões da ilha */}
      <div className="grid gap-6">
        {accommodationAreas.map((area) => (
          <div key={area.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Imagem */}
              <div className="relative h-64 md:h-auto">
                <Image
                  src={area.image}
                  alt={area.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-gray-900">
                    {area.priceRange}
                  </Badge>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">{area.name}</h3>
                  <p className="text-gray-600">{area.description}</p>
                </div>

                {/* Tipos de acomodação */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tipos de hospedagem:</h4>
                  <div className="flex flex-wrap gap-2">
                    {area.accommodationTypes.map((type, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Vantagens e Desvantagens */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">✅ Vantagens</h4>
                    <ul className="space-y-1">
                      {area.pros.map((pro, i) => (
                        <li key={i} className="text-sm text-gray-600">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">⚠️ Considerações</h4>
                    <ul className="space-y-1">
                      {area.cons.map((con, i) => (
                        <li key={i} className="text-sm text-gray-600">• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">💡 Ideal para:</h4>
                  <p className="text-sm text-gray-700">{area.bestFor}</p>
                </div>

                {/* Galeria */}
                {area.gallery.length > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Ver fotos ({area.gallery.length})
                    </Button>
                    
                    {selectedArea === area.id && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {area.gallery.map((photo, i) => (
                          <div key={i} className="relative h-24 rounded overflow-hidden">
                            <Image
                              src={photo.src}
                              alt={photo.alt}
                              fill
                              className="object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mapa das regiões */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-600" />
          Localização das Regiões
        </h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {accommodationAreas.map((area) => (
              <div key={area.id} className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">{area.name}</div>
                <div className="text-sm text-gray-600 mt-1">{area.priceRange}</div>
                <div className="text-xs text-blue-600 mt-2">{area.bestFor}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportationContent() {
  const [selectedTransport, setSelectedTransport] = useState<string>('buggy');
  const [tripDays, setTripDays] = useState(7);

  const transportOptions = [
    {
      id: "buggy",
      type: "Buggy",
      dailyPrice: 380,
      description: "Opção mais popular para explorar a ilha com total liberdade",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&q=80",
      pros: ["Liberdade total de horários", "Acesso a todas as praias", "Aventura e adrenalina", "Ideal para casais"],
      cons: ["Mais caro", "Requer CNH válida", "Combustível limitado", "Direção em terreno irregular"],
      requirements: ["CNH válida", "Cartão de crédito", "Experiência em direção"],
      capacity: "2-4 pessoas",
      fuelCost: "R$ 50-80/dia",
      insuranceIncluded: true,
      bestFor: "Casais, grupos pequenos, aventureiros",
      bookingTip: "Reserve com antecedência, especialmente na alta temporada"
    },
    {
      id: "onibus",
      type: "Ônibus",
      dailyPrice: 25,
      description: "Transporte público econômico e sustentável",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop&q=80", 
      pros: ["Muito econômico", "Não precisa dirigir", "Ecológico", "Conhece outros viajantes"],
      cons: ["Horários limitados", "Não vai a todas as praias", "Menos flexibilidade", "Pode lotar"],
      requirements: ["Apenas dinheiro trocado"],
      capacity: "30+ pessoas",
      fuelCost: "Incluído",
      insuranceIncluded: true,
      bestFor: "Viajantes econômicos, mochileiros",
      bookingTip: "Consulte horários na pousada, ponto na Vila dos Remédios"
    },
    {
      id: "taxi",
      type: "Táxi",
      dailyPrice: 180,
      description: "Conforto e comodidade com motorista local",
      image: "https://images.unsplash.com/photo-1520340356442-63be05f62c5e?w=800&h=400&fit=crop&q=80",
      pros: ["Muito confortável", "Motorista conhece a ilha", "Porta a porta", "Sem preocupação"],
      cons: ["Caro para uso constante", "Dependência de disponibilidade", "Esperas possíveis"],
      requirements: ["Agendamento"],
      capacity: "3-4 pessoas",
      fuelCost: "Incluído",
      insuranceIncluded: true,
      bestFor: "Idosos, famílias com crianças, viagens de luxo",
      bookingTip: "Peça contato na pousada, alguns oferecem pacotes diários"
    },
    {
      id: "bike",
      type: "Bicicleta",
      dailyPrice: 35,
      description: "Opção sustentável para distâncias médias",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=400&fit=crop&q=80",
      pros: ["Exercício saudável", "Ecológico", "Preço acessível", "Estacionamento fácil"],
      cons: ["Limitado por distância", "Cansativo no calor", "Terreno acidentado", "Sem proteção chuva"],
      requirements: ["Bom condicionamento"],
      capacity: "1 pessoa",
      fuelCost: "Zero",
      insuranceIncluded: false,
      bestFor: "Jovens, atletas, distâncias curtas",
      bookingTip: "Várias locadoras no centro, verifique estado dos freios"
    }
  ];

  const currentTransport = transportOptions.find(t => t.id === selectedTransport);

  const calculateTotalCost = (option: any, days: number) => {
    const baseCost = option.dailyPrice * days;
    const fuelCost = option.id === 'buggy' ? 65 * days : 0;
    return baseCost + fuelCost;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Transporte em Fernando de Noronha</h2>
        <p className="text-gray-600">Compare custos reais e escolha a melhor opção para sua viagem.</p>
      </div>

      {/* Calculadora de custos */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">🧮 Calculadora de Custos de Transporte</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dias de viagem: {tripDays}
            </label>
            <Slider
              value={[tripDays]}
              onValueChange={([value]) => setTripDays(value)}
              max={15}
              min={3}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Comparação de Custos ({tripDays} dias)</h4>
            <div className="space-y-2">
              {transportOptions.map((option) => (
                <div key={option.id} className="flex justify-between items-center">
                  <span className="text-sm">{option.type}:</span>
                  <span className="font-semibold text-green-600">
                    R$ {calculateTotalCost(option, tripDays).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de transporte */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h3 className="text-xl font-semibold">Escolha seu Meio de Transporte</h3>
        </div>
        
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {transportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedTransport(option.id)}
                className={`flex-shrink-0 px-6 py-4 text-center font-medium transition-colors min-w-0 ${
                  selectedTransport === option.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span>{option.type}</span>
                  <Badge variant="outline" className="text-xs">
                    R$ {option.dailyPrice}/dia
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {currentTransport && (
          <div className="p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Imagem e informações principais */}
              <div className="space-y-4">
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <Image
                    src={currentTransport.image}
                    alt={currentTransport.type}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-gray-900 font-semibold">
                      R$ {currentTransport.dailyPrice}/dia
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{currentTransport.type}</h4>
                  <p className="text-gray-600 text-sm mb-3">{currentTransport.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Capacidade:</span>
                      <div className="font-medium">{currentTransport.capacity}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Combustível:</span>
                      <div className="font-medium">{currentTransport.fuelCost}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Seguro:</span>
                      <div className="font-medium">
                        {currentTransport.insuranceIncluded ? '✅ Incluído' : '❌ Não incluído'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Ideal para:</span>
                      <div className="font-medium text-xs">{currentTransport.bestFor}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes e comparação */}
              <div className="space-y-4">
                {/* Vantagens e desvantagens */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      ✅ Vantagens
                    </h4>
                    <ul className="space-y-1">
                      {currentTransport.pros.map((pro, i) => (
                        <li key={i} className="text-sm text-green-600">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      ⚠️ Considerações
                    </h4>
                    <ul className="space-y-1">
                      {currentTransport.cons.map((con, i) => (
                        <li key={i} className="text-sm text-red-600">• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Requisitos */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-2">📋 Requisitos</h4>
                  <div className="text-sm text-blue-600">
                    {Array.isArray(currentTransport.requirements) 
                      ? currentTransport.requirements.join(' • ')
                      : currentTransport.requirements
                    }
                  </div>
                </div>

                {/* Dica de reserva */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-700 mb-2">💡 Dica de Reserva</h4>
                  <p className="text-sm text-amber-600">{currentTransport.bookingTip}</p>
                </div>

                {/* Custo total para a viagem */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-700 mb-2">💰 Custo Total ({tripDays} dias)</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-600">Diárias ({tripDays}x):</span>
                      <span>R$ {(currentTransport.dailyPrice * tripDays).toLocaleString('pt-BR')}</span>
                    </div>
                    {currentTransport.id === 'buggy' && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">Combustível:</span>
                        <span>R$ {(65 * tripDays).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                    <div className="border-t border-purple-200 pt-1">
                      <div className="flex justify-between font-semibold text-purple-900">
                        <span>Total:</span>
                        <span>R$ {calculateTotalCost(currentTransport, tripDays).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dicas gerais de transporte */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4">🚗 Dicas Importantes sobre Transporte</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">⛽</span>
              <div>
                <h4 className="font-medium">Combustível Limitado</h4>
                <p className="text-sm text-gray-600">Apenas 1 posto na ilha. Tank up cedo, pode faltar à tarde.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-xl">🛣️</span>
              <div>
                <h4 className="font-medium">Estradas de Terra</h4>
                <p className="text-sm text-gray-600">Muitas estradas são de terra batida. Cuidado após chuvas.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">📱</span>
              <div>
                <h4 className="font-medium">GPS Limitado</h4>
                <p className="text-sm text-gray-600">Sinal de celular pode falhar. Baixe mapas offline.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-xl">🌅</span>
              <div>
                <h4 className="font-medium">Horários de Pico</h4>
                <p className="text-sm text-gray-600">Evite circular entre 12h-14h (muito sol) e após 18h (escuro).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeachesContent({ preferences, travelData, favorites, onToggleFavorite }: { 
  preferences: UserPreferences; 
  travelData: TravelData; 
  favorites: string[]; 
  onToggleFavorite: (item: string) => void; 
}) {
  const beaches = [
    {
      name: "Baía do Sancho",
      difficulty: "Moderada",
      access: "Trilha íngreme ou barco",
      bestTime: "Manhã (8h-11h)",
      highlights: ["Praia mais bonita do mundo", "Mergulho livre", "Tartarugas"],
      tips: "Leve água e chegue cedo para evitar multidões",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop&q=80",
      description: "Eleita a praia mais bonita do mundo, é obrigatório ter cartão do TAMAR.",
      gallery: [
        {
          id: "sancho-1",
          src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop&q=80",
          alt: "Vista panorâmica da Baía do Sancho",
          caption: "Vista aérea da praia mais bonita do mundo",
          category: "Panorâmica"
        },
        {
          id: "sancho-2", 
          src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=80",
          alt: "Mergulho livre na Baía do Sancho",
          caption: "Águas cristalinas ideais para mergulho livre",
          category: "Mergulho"
        },
        {
          id: "sancho-3",
          src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop&q=80",
          alt: "Trilha de acesso ao Sancho",
          caption: "Trilha íngreme mas recompensadora",
          category: "Trilha"
        },
        {
          id: "sancho-4",
          src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&q=80",
          alt: "Vida marinha do Sancho",
          caption: "Rica vida marinha com tartarugas",
                     category: "Vida Marinha"
         }
       ],
       location: {
         name: "Baía do Sancho",
         coordinates: { lat: -3.8566, lng: -32.4297 },
         distance: {
           fromCenter: "4.2 km",
           walkingTime: "45 min",
           drivingTime: "8 min"
         },
         nearbyAttractions: ["Mirante dos Golfinhos", "Centro de Visitantes TAMAR"],
         parkingInfo: "Estacionamento limitado. Chegue cedo.",
         accessNotes: "Trilha íngreme de 20 minutos ou acesso por barco (agendamento necessário)"
       }
    },
    {
      name: "Baía dos Porcos", 
      difficulty: "Fácil",
      access: "Caminha curta pela Cacimba do Padre",
      bestTime: "Tarde (14h-17h)",
      highlights: ["Piscinas naturais", "Morro Dois Irmãos", "Snorkel"],
      tips: "Ideal para fotos no final da tarde com boa iluminação",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop&q=80",
      description: "Vista icônica dos Dois Irmãos e piscinas naturais cristalinas.",
      gallery: [
        {
          id: "porcos-1",
          src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop&q=80",
          alt: "Morro Dois Irmãos visto da Baía dos Porcos",
          caption: "Vista icônica dos Dois Irmãos",
          category: "Panorâmica"
        },
        {
          id: "porcos-2",
          src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=800&fit=crop&q=80",
          alt: "Piscinas naturais da Baía dos Porcos",
          caption: "Piscinas naturais cristalinas",
          category: "Piscinas Naturais"
        },
        {
          id: "porcos-3",
          src: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=1200&h=800&fit=crop&q=80",
          alt: "Pôr do sol na Baía dos Porcos",
          caption: "Final de tarde perfeito para fotos",
                     category: "Pôr do Sol"
         }
       ],
       location: {
         name: "Baía dos Porcos",
         coordinates: { lat: -3.8525, lng: -32.4361 },
         distance: {
           fromCenter: "3.8 km",
           walkingTime: "35 min",
           drivingTime: "6 min"
         },
         nearbyAttractions: ["Cacimba do Padre", "Morro Dois Irmãos"],
         parkingInfo: "Estacionamento na Cacimba do Padre",
         accessNotes: "Caminhada fácil de 10 minutos pela praia da Cacimba do Padre"
       }
    },
    {
      name: "Praia do Leão",
      difficulty: "Fácil",
      access: "Estrada de terra + caminhada curta",
      bestTime: "Manhã (7h-10h)",
      highlights: ["Desova de tartarugas", "Surf", "Vista panorâmica"],
      tips: "Respeite o período de desova (dez-jun) - observação à distância",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&q=80",
      description: "Praia selvagem onde tartarugas depositam seus ovos."
    },
    {
      name: "Praia do Sueste",
      difficulty: "Fácil", 
      access: "Estrada até a praia",
      bestTime: "Manhã (8h-12h)",
      highlights: ["Tubarões-lixa", "Mergulho", "Mais selvagem"],
      tips: "Use equipamentos de mergulho e respeite os tubarões",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&q=80",
      description: "Encontro garantido com tubarões-lixa inofensivos."
    },
    {
      name: "Atalaia",
      difficulty: "Controlada",
      access: "Agendamento obrigatório ICMBio",
      bestTime: "Maré baixa",
      highlights: ["Piscina natural", "Peixes coloridos", "Experiência única"],
      tips: "Agende com antecedência - vagas limitadas por dia",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=400&fit=crop&q=80",
      description: "Piscina natural com vida marinha abundante - acesso controlado."
    },
    {
      name: "Cacimba do Padre",
      difficulty: "Fácil",
      access: "Estrada até a praia",
      bestTime: "Tarde para pôr do sol",
      highlights: ["Pôr do sol", "Surf", "Morro Dois Irmãos"],
      tips: "Melhor spot para assistir o pôr do sol na ilha",
      image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=400&fit=crop&q=80",
      description: "Vista frontal dos Dois Irmãos e pôr do sol espetacular."
    },
    {
      name: "Praia do Porto",
      difficulty: "Fácil",
      access: "Centro da vila",
      bestTime: "Manhã (7h-10h)",
      highlights: ["Mergulho urbano", "Vida marinha", "Fácil acesso"],
      tips: "Ideal para quem não quer se deslocar muito",
      image: "https://images.unsplash.com/photo-1544967882-d73b0067f3c1?w=800&h=400&fit=crop&q=80",
      description: "Praia urbana com boa estrutura e mergulho de qualidade."
    },
    {
      name: "Praia da Conceição",
      difficulty: "Fácil",
      access: "Caminhada curta da vila",
      bestTime: "Manhã e tarde",
      highlights: ["Mirante", "Morro do Pico", "Fácil acesso"],
      tips: "Boa opção para relaxar após outras atividades",
      image: "https://images.unsplash.com/photo-1588157456015-e4d4a31455b3?w=800&h=400&fit=crop&q=80",
      description: "Vista do Morro do Pico e acesso fácil para toda família."
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Praias de Fernando de Noronha</h2>
        <p className="text-gray-600">Descubra as praias mais incríveis do arquipélago com dicas práticas.</p>
        
        {/* Informações dinâmicas baseadas na data */}
        {preferences.travelDate && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Condições para sua viagem - {format(preferences.travelDate, "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Temperatura</div>
                  <div className="text-xs text-blue-700">{travelData.weather.temperature}°C</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Chuva</div>
                  <div className="text-xs text-blue-700">{travelData.weather.rainChance}% de chance</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Movimento</div>
                  <div className="text-xs text-blue-700">
                    {travelData.crowds === 'low' ? 'Tranquilo' : 
                     travelData.crowds === 'medium' ? 'Moderado' : 'Movimentado'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm font-medium text-blue-900 mb-1">Atividades recomendadas:</div>
              <div className="flex flex-wrap gap-2">
                {travelData.bestActivities.map((activity) => (
                  <Badge key={activity} variant="secondary" className="bg-blue-100 text-blue-800">
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Condições em Tempo Real - Card Principal */}
      <div className="mb-8">
        <RealTimeConditions
          beachName="Fernando de Noronha"
          coordinates={{ lat: -3.8566, lng: -32.4297 }}
        />
      </div>

      <div className="grid gap-6">
        {beaches.map((beach: any, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Imagem da praia */}
            <div className="relative h-48 w-full">
              <Image
                src={beach.image}
                alt={beach.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(beach.name)}
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white backdrop-blur-sm"
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      favorites.includes(beach.name) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-600'
                    }`} 
                  />
                </Button>
                <span className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${
                  beach.difficulty === 'Fácil' ? 'bg-green-100/90 text-green-800' :
                  beach.difficulty === 'Moderada' ? 'bg-yellow-100/90 text-yellow-800' :
                  beach.difficulty === 'Controlada' ? 'bg-blue-100/90 text-blue-800' :
                  'bg-purple-100/90 text-purple-800'
                }`}>
                  {beach.difficulty}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">{beach.name}</h3>
                <p className="text-gray-600 text-sm">{beach.description}</p>
              </div>
            
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Acesso</h4>
                  <p className="text-sm text-gray-600">{beach.access}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Melhor Horário</h4>
                  <p className="text-sm text-gray-600">{beach.bestTime}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Destaques</h4>
                  <div className="flex flex-wrap gap-1">
                    {beach.highlights.slice(0, 2).map((highlight, i) => (
                      <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Dica Importante</h4>
                <p className="text-sm text-gray-700">{beach.tips}</p>
              </div>

              {/* Galeria de Imagens */}
              {beach.gallery && beach.gallery.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Galeria de Fotos
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {beach.gallery.length} fotos
                    </Badge>
                  </div>
                                     <ImageGallery
                     images={beach.gallery}
                     className="mt-3"
                   />
                 </div>
               )}

               {/* Informações de Localização */}
               {beach.location && (
                 <div className="mt-6">
                   <BeachLocation beach={beach.location} />
                 </div>
               )}

               {/* Condições Específicas da Praia */}
               {beach.location && beach.location.coordinates && (
                 <div className="mt-6">
                   <RealTimeConditions
                     beachName={beach.name}
                     coordinates={beach.location.coordinates}
                   />
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiningContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>('restaurants');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  const restaurantCategories = [
    { id: 'restaurants', name: 'Restaurantes', icon: '🏠' },
    { id: 'events', name: 'Eventos Gastronômicos', icon: '🎉' },
    { id: 'specialties', name: 'Pratos Típicos', icon: '🍽️' },
    { id: 'bars', name: 'Bares & Drinks', icon: '🍹' }
  ];

  const restaurants = [
    {
      id: 'ze-maria',
      name: 'Zé Maria',
      category: 'Frutos do mar premium',
      priceRange: 'R$ 150-250/pessoa',
      location: 'Vila dos Remédios',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop&q=80',
      specialties: ['Lagosta grelhada', 'Peixe na crosta de caju', 'Festival quartas/sábados'],
      description: 'Restaurante mais famoso da ilha, conhecido pelo festival gastronômico com música ao vivo.',
      rating: 4.8,
      features: ['Música ao vivo', 'Vista panorâmica', 'Menu degustação', 'Reserva obrigatória'],
      hours: 'Ter-Dom: 18h-22h',
      tips: 'Reserve com antecedência. Festival acontece quartas e sábados às 19h30.'
    },
    {
      id: 'mergulhao',
      name: 'Mergulhão',
      category: 'Frutos do mar tradicional',
      priceRange: 'R$ 80-150/pessoa',
      location: 'Porto de Santo Antônio',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop&q=80',
      specialties: ['Moqueca de peixe', 'Lagosta na moranga', 'Bobó de camarão'],
      description: 'Tradicional casa de frutos do mar com pratos generosos e ambiente familiar.',
      rating: 4.5,
      features: ['Frente para o mar', 'Pratos generosos', 'Ambiente familiar', 'Preço justo'],
      hours: 'Seg-Dom: 11h-22h',
      tips: 'Experimente a lagosta na moranga, especialidade da casa.'
    },
    {
      id: 'cacimba-bistro',
      name: 'Cacimba Bistrô',
      category: 'Culinária contemporânea',
      priceRange: 'R$ 100-180/pessoa',
      location: 'Cacimba do Padre',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop&q=80',
      specialties: ['Risotto de camarão', 'Polvo grelhado', 'Ceviche tropical'],
      description: 'Culinária sofisticada com vista para o mar e toque contemporâneo.',
      rating: 4.7,
      features: ['Vista para Dois Irmãos', 'Culinária autoral', 'Ambiente romântico', 'Carta de vinhos'],
      hours: 'Qua-Mon: 18h-23h',
      tips: 'Peça mesa na varanda para ver o pôr do sol nos Dois Irmãos.'
    },
    {
      id: 'varanda',
      name: 'Varanda',
      category: 'Comida regional',
      priceRange: 'R$ 60-120/pessoa',
      location: 'Vila dos Remédios',
      image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=400&fit=crop&q=80',
      specialties: ['Peixe com pirão', 'Baião de dois', 'Carne de sol'],
      description: 'Autêntica culinária nordestina em ambiente acolhedor e caseiro.',
      rating: 4.3,
      features: ['Comida caseira', 'Preços acessíveis', 'Ambiente familiar', 'Porções generosas'],
      hours: 'Seg-Dom: 11h-21h',
      tips: 'Ideal para almoço. Peça o peixe do dia com pirão de peixe.'
    }
  ];

  const gastroEvents = [
    {
      name: 'Festival do Zé Maria',
      frequency: 'Quartas e Sábados',
      time: '19h30',
      price: 'R$ 220-280/pessoa',
      description: 'Experiência gastronômica completa com menu degustação de 7 pratos, música ao vivo e vista panorâmica.',
      includes: ['Menu degustação', 'Música ao vivo', 'Drinks inclusos', 'Sobremesa especial'],
      booking: 'Reserva obrigatória com 24h antecedência'
    },
    {
      name: 'Noite da Lagosta - Mergulhão',
      frequency: 'Sextas-feiras',
      time: '19h',
      price: 'R$ 180-220/pessoa',
      description: 'Noite especial dedicada à lagosta local com diferentes preparos.',
      includes: ['3 preparos de lagosta', 'Acompanhamentos', 'Sobremesa', 'Caipirinha'],
      booking: 'Recomendada reserva'
    }
  ];

  const localSpecialties = [
    {
      name: 'Peixe com Pirão',
      price: 'R$ 45-75',
      description: 'Prato tradicional com peixe fresco grelhado acompanhado de pirão de peixe cremoso.',
      ingredients: ['Peixe local', 'Farinha de mandioca', 'Caldo de peixe', 'Temperos regionais'],
      whereToTry: ['Varanda', 'Mergulhão', 'Flamboyant']
    },
    {
      name: 'Lagosta Grelhada',
      price: 'R$ 120-200',
      description: 'Lagosta fresca grelhada na brasa com temperos especiais da ilha.',
      ingredients: ['Lagosta local', 'Alho', 'Manteiga', 'Ervas finas'],
      whereToTry: ['Zé Maria', 'Mergulhão', 'Cacimba Bistrô']
    },
    {
      name: 'Caju Cristalizado',
      price: 'R$ 15-25',
      description: 'Doce tradicional feito com caju local, especialidade única da ilha.',
      ingredients: ['Caju vermelho', 'Açúcar cristal', 'Água'],
      whereToTry: ['Lojas locais', 'Mercado', 'Algumas pousadas']
    },
    {
      name: 'Água de Coco com Cajuína',
      price: 'R$ 12-18',
      description: 'Bebida refrescante que combina água de coco natural com cajuína.',
      ingredients: ['Coco verde', 'Cajuína artesanal'],
      whereToTry: ['Praias', 'Bares', 'Ambulantes']
    }
  ];

  const bars = [
    {
      name: 'Bar do Meio',
      specialty: 'Caipirinhas e petiscos',
      location: 'Praia do Meio',
      hours: '16h-22h',
      highlight: 'Caipirinha de caju na praia'
    },
    {
      name: 'Simpatia Quase Amor',
      specialty: 'Drinks autorais',
      location: 'Vila dos Remédios',
      hours: '18h-01h',
      highlight: 'Drinks com frutas locais'
    }
  ];

  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gastronomia em Fernando de Noronha</h2>
        <p className="text-gray-600">Descubra os sabores únicos da ilha com ingredientes frescos e locais.</p>
      </div>

      {/* Navegação por categorias */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {restaurantCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === category.id
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-medium text-sm">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo baseado na categoria selecionada */}
      {selectedCategory === 'restaurants' && (
        <div className="space-y-6">
          <div className="grid gap-6">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-3 gap-0">
                  <div className="relative h-48 md:h-auto">
                    <Image
                      src={restaurant.image}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold">{restaurant.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold">{restaurant.name}</h3>
                        <p className="text-gray-600">{restaurant.category}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {restaurant.priceRange}
                      </Badge>
                    </div>

                    <p className="text-gray-700 mb-4">{restaurant.description}</p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">🍽️ Especialidades</h4>
                        <ul className="space-y-1">
                          {restaurant.specialties.map((specialty, i) => (
                            <li key={i} className="text-sm text-gray-600">• {specialty}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">✨ Características</h4>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.features.map((feature, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">📍 Localização:</span>
                        <div className="font-medium">{restaurant.location}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">🕒 Horários:</span>
                        <div className="font-medium">{restaurant.hours}</div>
                      </div>
                    </div>

                    <div className="mt-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <h5 className="font-medium text-orange-900 mb-1">💡 Dica</h5>
                      <p className="text-sm text-orange-800">{restaurant.tips}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCategory === 'events' && (
        <div className="space-y-6">
          {gastroEvents.map((event, index) => (
            <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-orange-900">{event.name}</h3>
                  <p className="text-orange-800">{event.description}</p>
                </div>
                <Badge className="bg-orange-600 text-white">
                  {event.price}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">📅 Informações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span>{event.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-orange-600" />
                      <span>{event.booking}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-orange-900 mb-2">🎁 Incluso</h4>
                  <ul className="space-y-1">
                    {event.includes.map((item, i) => (
                      <li key={i} className="text-sm text-orange-700">✓ {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCategory === 'specialties' && (
        <div className="grid md:grid-cols-2 gap-6">
          {localSpecialties.map((dish, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{dish.name}</h3>
                <Badge variant="outline" className="text-green-600">
                  {dish.price}
                </Badge>
              </div>
              
              <p className="text-gray-600 mb-4">{dish.description}</p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">🥘 Ingredientes</h4>
                  <div className="flex flex-wrap gap-1">
                    {dish.ingredients.map((ingredient, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">📍 Onde experimentar</h4>
                  <p className="text-sm text-gray-600">{dish.whereToTry.join(' • ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCategory === 'bars' && (
        <div className="grid md:grid-cols-2 gap-6">
          {bars.map((bar, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-2">{bar.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Especialidade:</span>
                  <span className="font-medium">{bar.specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Localização:</span>
                  <span className="font-medium">{bar.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Horário:</span>
                  <span className="font-medium">{bar.hours}</span>
                </div>
              </div>
              <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">⭐ Destaque</h4>
                <p className="text-sm text-blue-800">{bar.highlight}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dicas gerais de gastronomia */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4">🍴 Dicas Gastronômicas</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">🦐</span>
              <div>
                <h4 className="font-medium">Frutos do Mar</h4>
                <p className="text-sm text-gray-600">Sempre frescos, pescados diariamente. Experimente lagosta e peixe local.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">🥥</span>
              <div>
                <h4 className="font-medium">Bebidas Locais</h4>
                <p className="text-sm text-gray-600">Água de coco, cajuína e caipirinhas de frutas regionais.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">📱</span>
              <div>
                <h4 className="font-medium">Reservas</h4>
                <p className="text-sm text-gray-600">Sempre recomendadas, especialmente para jantares e eventos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyGuideContent() {
  const [selectedSeason, setSelectedSeason] = useState<string>('year');
  
  const seasons = [
    { id: 'year', name: 'Visão Anual', icon: '📅' },
    { id: 'dry', name: 'Época Seca', icon: '☀️' },
    { id: 'wet', name: 'Época Chuvosa', icon: '🌧️' },
    { id: 'best', name: 'Melhores Meses', icon: '⭐' }
  ];

  const monthsData = [
    {
      month: "Janeiro",
      shortName: "Jan",
      season: "wet",
      climate: { temp: "26-30°C", avgTemp: 28, rain: "240mm", rainDays: 18, humidity: 85, sea: "Agitado" },
      activities: ["Trilhas", "Observação de aves", "Fotografia", "Gastronomia"],
      crowds: "high",
      priceLevel: "high",
      tips: "Alta temporada - reserve com antecedência. Chuvas frequentes à tarde, mas manhãs costumam ser ensolaradas.",
      pros: ["Vida marinha abundante", "Época de nidificação", "Festivais locais"],
      cons: ["Preços altos", "Muita chuva", "Mar agitado"],
      bestFor: ["Observação da fauna", "Fotografia de natureza"],
      visibility: 15,
      waveHeight: 2.5
    },
    {
      month: "Fevereiro", 
      shortName: "Fev",
      season: "wet",
      climate: { temp: "26-30°C", avgTemp: 28, rain: "180mm", rainDays: 15, humidity: 84, sea: "Agitado" },
      activities: ["Mergulho", "Trilhas curtas", "Gastronomia", "Observação"],
      crowds: "high",
      priceLevel: "high",
      tips: "Ainda alta temporada. Final do carnaval. Março pode ser melhor opção com menos chuva.",
      pros: ["Carnaval", "Águas quentes", "Tartarugas"],
      cons: ["Ainda caro", "Chuvas regulares", "Lotado"],
      bestFor: ["Festivais", "Mergulho em águas quentes"],
      visibility: 18,
      waveHeight: 2.2
    },
    {
      month: "Março",
      shortName: "Mar",
      season: "wet",
      climate: { temp: "26-29°C", avgTemp: 27, rain: "120mm", rainDays: 12, humidity: 82, sea: "Moderado" },
      activities: ["Praias", "Mergulho", "Caminhadas", "Todas atividades"],
      crowds: "medium",
      priceLevel: "medium",
      tips: "Início da melhora climática. Bom equilíbrio entre preço e clima. Transição para época seca.",
      pros: ["Menos chuva", "Preços melhores", "Mar mais calmo"],
      cons: ["Ainda instável", "Algumas chuvas"],
      bestFor: ["Equilíbrio preço/clima", "Primeiros mergulhos"],
      visibility: 22,
      waveHeight: 1.8
    },
    {
      month: "Abril",
      shortName: "Abr",
      season: "dry",
      climate: { temp: "25-28°C", avgTemp: 26, rain: "80mm", rainDays: 8, humidity: 79, sea: "Calmo" },
      activities: ["Todas as praias", "Mergulho livre", "Trilhas", "Fotografia"],
      crowds: "low",
      priceLevel: "low",
      tips: "Excelente mês! Clima seco, mar calmo, preços melhores. Uma das melhores épocas para visitar.",
      pros: ["Clima seco", "Mar calmo", "Preços baixos", "Visibilidade excelente"],
      cons: ["Pode ventar mais"],
      bestFor: ["Mergulho", "Fotografias", "Economia"],
      visibility: 28,
      waveHeight: 1.2
    },
    {
      month: "Maio",
      shortName: "Mai",
      season: "dry",
      climate: { temp: "24-27°C", avgTemp: 25, rain: "60mm", rainDays: 6, humidity: 77, sea: "Calmo" },
      activities: ["Mergulho", "Todas as praias", "Trilhas", "Observação"],
      crowds: "low",
      priceLevel: "low",
      tips: "Época ideal para mergulho. Visibilidade máxima, mar calmo, preços excelentes.",
      pros: ["Mergulho perfeito", "Clima seco", "Poucos turistas"],
      cons: ["Pode ser ventoso", "Noites mais frias"],
      bestFor: ["Mergulho profissional", "Tranquilidade"],
      visibility: 30,
      waveHeight: 1.0
    },
    {
      month: "Junho",
      shortName: "Jun",
      season: "dry",
      climate: { temp: "23-26°C", avgTemp: 24, rain: "40mm", rainDays: 4, humidity: 75, sea: "Muito calmo" },
      activities: ["Mergulho", "Observação golfinhos", "Trilhas", "Relaxamento"],
      crowds: "low",
      priceLevel: "low",
      tips: "Época seca no auge. Ideal para mergulho e observação da vida marinha. Temperaturas mais amenas.",
      pros: ["Clima perfeito", "Visibilidade máxima", "Preços baixos"],
      cons: ["Ventos alísios", "Noites frescas"],
      bestFor: ["Mergulho avançado", "Observação marinha"],
      visibility: 32,
      waveHeight: 0.8
    },
    {
      month: "Julho",
      shortName: "Jul",
      season: "dry",
      climate: { temp: "23-26°C", avgTemp: 24, rain: "30mm", rainDays: 3, humidity: 74, sea: "Muito calmo" },
      activities: ["Mergulho", "Observação golfinhos", "Trilhas", "Fotografia"],
      crowds: "medium",
      priceLevel: "medium",
      tips: "Época seca ideal. Férias escolares aumentam movimento. Excelente para todas as atividades.",
      pros: ["Clima seco", "Mar espelho", "Vida marinha ativa"],
      cons: ["Mais turistas", "Preços sobem"],
      bestFor: ["Famílias", "Mergulho", "Fotografia"],
      visibility: 30,
      waveHeight: 0.8
    },
    {
      month: "Agosto",
      shortName: "Ago",
      season: "dry",
      climate: { temp: "23-26°C", avgTemp: 24, rain: "25mm", rainDays: 2, humidity: 73, sea: "Calmo" },
      activities: ["Todas atividades", "Mergulho", "Trilhas", "Observação"],
      crowds: "medium",
      priceLevel: "medium",
      tips: "Continuação da época seca. Excelente para todas as atividades. Ainda parte das férias.",
      pros: ["Sem chuvas", "Visibilidade ótima", "Todas praias acessíveis"],
      cons: ["Férias escolares", "Preços médios"],
      bestFor: ["Atividades diversas", "Mergulho técnico"],
      visibility: 28,
      waveHeight: 1.0
    },
    {
      month: "Setembro",
      shortName: "Set",
      season: "dry",
      climate: { temp: "24-27°C", avgTemp: 25, rain: "20mm", rainDays: 2, humidity: 75, sea: "Calmo" },
      activities: ["Mergulho", "Todas as praias", "Observação golfinhos", "Fotografia"],
      crowds: "low",
      priceLevel: "low",
      tips: "Época seca ideal. Visibilidade excelente para mergulho. Movimento baixo após férias.",
      pros: ["Visibilidade máxima", "Poucos turistas", "Preços bons"],
      cons: ["Ventos podem aumentar"],
      bestFor: ["Mergulho profissional", "Tranquilidade"],
      visibility: 30,
      waveHeight: 1.1
    },
    {
      month: "Outubro",
      shortName: "Out",
      season: "dry",
      climate: { temp: "25-28°C", avgTemp: 26, rain: "25mm", rainDays: 3, humidity: 77, sea: "Calmo" },
      activities: ["Mergulho", "Praias", "Trilhas", "Observação"],
      crowds: "low",
      priceLevel: "low",
      tips: "Final da época seca. Ainda excelente para mergulho. Temperatura começa a subir.",
      pros: ["Ainda seco", "Bom custo-benefício", "Menos vento"],
      cons: ["Início das mudanças"],
      bestFor: ["Última chance época seca", "Custo-benefício"],
      visibility: 26,
      waveHeight: 1.3
    },
    {
      month: "Novembro",
      shortName: "Nov",
      season: "wet",
      climate: { temp: "26-29°C", avgTemp: 27, rain: "60mm", rainDays: 7, humidity: 80, sea: "Moderado" },
      activities: ["Praias", "Mergulho", "Trilhas matinais"],
      crowds: "low",
      priceLevel: "low",
      tips: "Transição para época chuvosa. Ainda bom período, chuvas esparsas. Última oportunidade antes da alta.",
      pros: ["Preços baixos", "Poucas pessoas", "Ainda pouca chuva"],
      cons: ["Instabilidade climática", "Mar começa agitar"],
      bestFor: ["Economia", "Transição"],
      visibility: 22,
      waveHeight: 1.6
    },
    {
      month: "Dezembro",
      shortName: "Dez",
      season: "wet",
      climate: { temp: "26-30°C", avgTemp: 28, rain: "120mm", rainDays: 12, humidity: 83, sea: "Agitado" },
      activities: ["Trilhas", "Gastronomia", "Observação aves"],
      crowds: "high",
      priceLevel: "high",
      tips: "Início da alta temporada. Chuvas aumentam. Reserve com antecedência para fim de ano.",
      pros: ["Vida marinha", "Festivais", "Nidificação"],
      cons: ["Chuvas frequentes", "Preços altos", "Muito movimento"],
      bestFor: ["Reveillon", "Observação fauna"],
      visibility: 18,
      waveHeight: 2.0
    }
  ];

  const drySeasonMonths = monthsData.filter(m => m.season === 'dry');
  const wetSeasonMonths = monthsData.filter(m => m.season === 'wet');
  const bestMonths = monthsData.filter(m => ['Abril', 'Maio', 'Junho', 'Setembro'].includes(m.month));

  const seasonalOverview = {
    dry: {
      period: "Abril a Outubro",
      highlights: ["Clima seco", "Mar calmo", "Visibilidade excelente", "Preços melhores"],
      bestFor: ["Mergulho", "Fotografia subaquática", "Todas as praias", "Economia"],
      avgTemp: "24-27°C",
      avgRain: "35mm/mês",
      crowds: "Baixo a médio"
    },
    wet: {
      period: "Novembro a Março", 
      highlights: ["Vida marinha abundante", "Nidificação", "Águas quentes", "Festivais"],
      bestFor: ["Observação fauna", "Mergulho em águas quentes", "Eventos", "Festivais"],
      avgTemp: "26-30°C", 
      avgRain: "140mm/mês",
      crowds: "Alto"
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quando Visitar Fernando de Noronha</h2>
        <p className="text-gray-600">Escolha a época ideal baseada no clima, atividades e orçamento.</p>
      </div>

      {/* Navegação por época */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSeason === season.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{season.icon}</div>
              <div className="font-medium text-sm">{season.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Visão anual */}
      {selectedSeason === 'year' && (
        <div className="space-y-6">
          {/* Gráfico visual das estações */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Panorama Anual do Clima</h3>
            <div className="grid grid-cols-12 gap-1 mb-4">
              {monthsData.map((month) => (
                <div key={month.month} className="text-center">
                  <div 
                    className={`h-20 rounded mb-2 ${
                      month.season === 'dry' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}
                    style={{ opacity: month.crowds === 'high' ? 1 : month.crowds === 'medium' ? 0.7 : 0.4 }}
                  />
                  <div className="text-xs font-medium">{month.shortName}</div>
                  <div className="text-xs text-gray-600">{month.climate.avgTemp}°</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Época Seca (Abril-Outubro)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span>Época Chuvosa (Novembro-Março)</span>
              </div>
            </div>
          </div>

          {/* Resumo das estações */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                ☀️ Época Seca
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-yellow-700 font-medium">Período:</span>
                  <span className="ml-2">{seasonalOverview.dry.period}</span>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">Temperatura:</span>
                  <span className="ml-2">{seasonalOverview.dry.avgTemp}</span>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">Chuva média:</span>
                  <span className="ml-2">{seasonalOverview.dry.avgRain}</span>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-900">Ideal para:</h4>
                  <ul className="text-sm text-yellow-700">
                    {seasonalOverview.dry.bestFor.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                🌧️ Época Chuvosa
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-blue-700 font-medium">Período:</span>
                  <span className="ml-2">{seasonalOverview.wet.period}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Temperatura:</span>
                  <span className="ml-2">{seasonalOverview.wet.avgTemp}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Chuva média:</span>
                  <span className="ml-2">{seasonalOverview.wet.avgRain}</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Ideal para:</h4>
                  <ul className="text-sm text-blue-700">
                    {seasonalOverview.wet.bestFor.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Todos os meses */}
          <div className="grid gap-4">
            {monthsData.map((monthData, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid lg:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{monthData.month}</h3>
                    <div className="space-y-1 text-sm">
                      <div>🌡️ {monthData.climate.temp}</div>
                      <div>💧 {monthData.climate.rain}</div>
                      <div>🌊 {monthData.climate.sea}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Atividades</h4>
                    <div className="flex flex-wrap gap-1">
                      {monthData.activities.slice(0, 3).map((activity, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Movimento:</span>
                      <Badge className={
                        monthData.crowds === 'high' ? 'bg-red-100 text-red-800' :
                        monthData.crowds === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {monthData.crowds === 'high' ? 'Alto' : 
                         monthData.crowds === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Preços:</span>
                      <Badge className={
                        monthData.priceLevel === 'high' ? 'bg-red-100 text-red-800' :
                        monthData.priceLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {monthData.priceLevel === 'high' ? 'Altos' : 
                         monthData.priceLevel === 'medium' ? 'Médios' : 'Baixos'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium text-gray-900 mb-1">💡 Dica</h4>
                    <p className="text-xs text-gray-700">{monthData.tips}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Época seca */}
      {selectedSeason === 'dry' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
            <h3 className="text-xl font-semibold text-yellow-900 mb-4">☀️ Época Seca (Abril - Outubro)</h3>
            <p className="text-yellow-800 mb-4">
              Período ideal para mergulho e atividades aquáticas. Clima seco, mar calmo e visibilidade excelente.
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              {drySeasonMonths.map((month) => (
                <div key={month.month} className="bg-white p-4 rounded border border-yellow-200">
                  <h4 className="font-semibold">{month.month}</h4>
                  <div className="text-sm space-y-1 mt-2">
                    <div>🌡️ {month.climate.avgTemp}°C</div>
                    <div>💧 {month.climate.rain}</div>
                    <div>👁️ {month.visibility}m</div>
                    <div className="mt-2">
                      <Badge className={
                        month.priceLevel === 'low' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {month.priceLevel === 'low' ? 'Econômico' : 'Médio'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Época chuvosa */}
      {selectedSeason === 'wet' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">🌧️ Época Chuvosa (Novembro - Março)</h3>
            <p className="text-blue-800 mb-4">
              Período de maior movimento turístico. Vida marinha abundante, águas mais quentes, mas chuvas frequentes.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {wetSeasonMonths.map((month) => (
                <div key={month.month} className="bg-white p-4 rounded border border-blue-200">
                  <h4 className="font-semibold">{month.month}</h4>
                  <div className="text-sm space-y-1 mt-2">
                    <div>🌡️ {month.climate.avgTemp}°C</div>
                    <div>💧 {month.climate.rain}</div>
                    <div>🌊 {month.climate.sea}</div>
                    <div className="mt-2">
                      <Badge className={
                        month.crowds === 'high' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {month.crowds === 'high' ? 'Lotado' : 'Moderado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Melhores meses */}
      {selectedSeason === 'best' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
            <h3 className="text-xl font-semibold text-green-900 mb-4">⭐ Melhores Meses para Visitar</h3>
            <p className="text-green-800 mb-4">
              Época ideal que combina clima seco, mar calmo, visibilidade excelente e preços mais acessíveis.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {bestMonths.map((month) => (
                <div key={month.month} className="bg-white p-6 rounded-lg border border-green-200">
                  <h4 className="text-lg font-semibold text-green-900 mb-3">{month.month}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="font-medium text-green-800 mb-2">✅ Vantagens</h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        {month.pros.map((pro, i) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-green-800 mb-2">📊 Dados</h5>
                      <div className="text-sm text-green-700 space-y-1">
                        <div>🌡️ {month.climate.temp}</div>
                        <div>💧 {month.climate.rain}</div>
                        <div>👁️ Visibilidade: {month.visibility}m</div>
                        <div>🌊 Ondas: {month.waveHeight}m</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h5 className="font-medium text-green-900 mb-1">🎯 Ideal para:</h5>
                    <div className="flex flex-wrap gap-1">
                      {month.bestFor.map((activity, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 