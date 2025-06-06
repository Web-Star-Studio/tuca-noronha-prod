"use client";

import { useState } from "react";
import { ChevronRight, MapPin, Calendar, Utensils, Waves, Building, Info, Star, Plane, Home, Car, UtensilsCrossed, Sun, Clock } from "lucide-react";
import { cardStyles, decorativeBackgrounds } from "@/lib/ui-config";
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

export default function GuiaPage() {
  const [activeSection, setActiveSection] = useState<string>("getting-started");

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
        
        {/* Quick Stats in Sidebar */}
        <div className="p-4 mt-8 border-t border-gray-200">
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
          <SectionContent sectionId={activeSection} />
        </div>
      </main>
    </div>
  );
}

function SectionContent({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case "getting-started":
      return <GettingStartedContent />;
    case "accommodation":
      return <AccommodationContent />;
    case "transportation":
      return <TransportationContent />;
    case "beaches":
      return <BeachesContent />;
    case "dining":
      return <DiningContent />;
    case "monthly-guide":
      return <MonthlyGuideContent />;
    default:
      return <div>Seção não encontrada</div>;
  }
}

function GettingStartedContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Como Chegar a Fernando de Noronha</h2>
        <p className="text-gray-600">Informações sobre voos, taxas e documentação necessária.</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            Voos para a Ilha
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">De Recife (REC)</h4>
                <p className="text-sm text-gray-600">Voo direto • 1h20min</p>
                <p className="text-sm text-gray-600">Companhias: Azul, Gol</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">De Natal (NAT)</h4>
                <p className="text-sm text-gray-600">Voo direto • 1h10min</p>
                <p className="text-sm text-gray-600">Companhias: Azul, Gol</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Dica Importante</h4>
              <p className="text-sm text-blue-800">Reserve com antecedência. Voos costumam esgotar rapidamente, especialmente na alta temporada.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Taxas Obrigatórias
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
              <div>
                <h4 className="font-medium text-amber-900">Taxa de Preservação Ambiental (TPA)</h4>
                <p className="text-sm text-amber-700">Paga online antes da viagem</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-amber-900">R$ 644,00</div>
                <div className="text-xs text-amber-700">por pessoa</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium text-green-900">PARNAMAR</h4>
                <p className="text-sm text-green-700">Paga na chegada (ICMBio)</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-900">R$ 186,50</div>
                <div className="text-xs text-green-700">por pessoa</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">Documentação</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Documento de identificação</p>
                <p className="text-sm text-gray-600">RG ou CNH com foto</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Comprovante de hospedagem</p>
                <p className="text-sm text-gray-600">Reserva confirmada em pousada ou hotel</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Comprovante da TPA</p>
                <p className="text-sm text-gray-600">Protocolo de pagamento da taxa ambiental</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccommodationContent() {
  const accommodations = [
    {
      name: "Vila dos Remédios",
      description: "Centro histórico com infraestrutura completa",
      features: ["Restaurantes", "Mercados", "Farmácia", "Correios"],
      pros: ["Maior variedade de serviços", "Vida noturna"]
    },
    {
      name: "Vila do Trinta",
      description: "Área residencial tranquila",
      features: ["Ambiente familiar", "Mais silencioso", "Preços acessíveis"],
      pros: ["Mais econômico", "Menos movimentado"]
    },
    {
      name: "Floresta Nova/Velha",
      description: "Próximo às principais praias",
      features: ["Acesso fácil às praias", "Ambiente natural"],
      pros: ["Localização privilegiada", "Contato com natureza"]
    },
    {
      name: "Boldró",
      description: "Vista para o mar e pôr do sol",
      features: ["Vista panorâmica", "Pôr do sol espetacular"],
      pros: ["Vistas incríveis", "Mais exclusivo"]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Onde Ficar em Fernando de Noronha</h2>
        <p className="text-gray-600">Conheça as diferentes regiões da ilha e escolha a melhor para sua estadia.</p>
      </div>

      <div className="grid gap-6">
        {accommodations.map((area, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-3">{area.name}</h3>
            <p className="text-gray-600 mb-4">{area.description}</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-900">Características</h4>
                <ul className="space-y-1">
                  {area.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-900">Vantagens</h4>
                <ul className="space-y-1">
                  {area.pros.map((pro, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransportationContent() {
  const transportOptions = [
    {
      type: "Buggy",
      price: "R$ 300-450/dia",
      pros: ["Liberdade total", "Acesso a praias remotas", "Aventura"],
      cons: ["Mais caro", "Requer habilitação", "Combustível limitado"],
      description: "Opção mais popular para explorar a ilha"
    },
    {
      type: "Ônibus",
      price: "R$ 5-10/viagem", 
      pros: ["Mais econômico", "Não precisa dirigir", "Ecológico"],
      cons: ["Horários limitados", "Não vai a todas as praias", "Menos flexibilidade"],
      description: "Transporte público da ilha"
    },
    {
      type: "Táxi",
      price: "R$ 30-80/viagem",
      pros: ["Confortável", "Porta a porta", "Motorista local"],
      cons: ["Caro para o dia todo", "Dependência", "Esperas"],
      description: "Conforto para trajetos específicos"
    },
    {
      type: "Caminhada",
      price: "Gratuito",
      pros: ["Exercício", "Contato com natureza", "Zero custo"],
      cons: ["Limitado pela distância", "Cansativo no calor", "Tempo"],
      description: "Para distâncias curtas e trilhas"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Como se Locomover</h2>
        <p className="text-gray-600">Compare as opções de transporte disponíveis na ilha.</p>
      </div>

      <div className="grid gap-6">
        {transportOptions.map((option, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{option.type}</h3>
                <p className="text-gray-600">{option.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{option.price}</div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-green-700">Vantagens</h4>
                <ul className="space-y-1">
                  {option.pros.map((pro, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-red-700">Desvantagens</h4>
                <ul className="space-y-1">
                  {option.cons.map((con, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BeachesContent() {
  const beaches = [
    {
      name: "Baía do Sancho",
      difficulty: "Moderada",
      access: "Trilha íngreme ou barco",
      bestTime: "Manhã (8h-11h)",
      highlights: ["Praia mais bonita do mundo", "Mergulho livre", "Tartarugas"],
      tips: "Leve água e chegue cedo para evitar multidões"
    },
    {
      name: "Baía dos Porcos", 
      difficulty: "Fácil",
      access: "Caminha curta pela Cacimba do Padre",
      bestTime: "Tarde (14h-17h)",
      highlights: ["Piscinas naturais", "Morro Dois Irmãos", "Snorkel"],
      tips: "Ideal para fotos no final da tarde com boa iluminação"
    },
    {
      name: "Praia do Leão",
      difficulty: "Fácil",
      access: "Estrada de terra + caminhada curta",
      bestTime: "Manhã (7h-10h)",
      highlights: ["Desova de tartarugas", "Surf", "Vista panorâmica"],
      tips: "Respeite o período de desova (dez-jun) - observação à distância"
    },
    {
      name: "Praia do Sueste",
      difficulty: "Fácil", 
      access: "Estrada até a praia",
      bestTime: "Manhã (8h-12h)",
      highlights: ["Tubarões-lixa", "Mergulho", "Mais selvagem"],
      tips: "Use equipamentos de mergulho e respeite os tubarões"
    },
    {
      name: "Atalaia",
      difficulty: "Controlada",
      access: "Agendamento obrigatório ICMBio",
      bestTime: "Maré baixa",
      highlights: ["Piscina natural", "Peixes coloridos", "Experiência única"],
      tips: "Agende com antecedência - vagas limitadas por dia"
    },
    {
      name: "Cacimba do Padre",
      difficulty: "Fácil",
      access: "Estrada até a praia",
      bestTime: "Tarde para pôr do sol",
      highlights: ["Pôr do sol", "Surf", "Morro Dois Irmãos"],
      tips: "Melhor spot para assistir o pôr do sol na ilha"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Praias de Fernando de Noronha</h2>
        <p className="text-gray-600">Descubra as praias mais incríveis do arquipélago com dicas práticas.</p>
      </div>

      <div className="grid gap-6">
        {beaches.map((beach, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{beach.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                beach.difficulty === 'Fácil' ? 'bg-green-100 text-green-800' :
                beach.difficulty === 'Moderada' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {beach.difficulty}
              </span>
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
          </div>
        ))}
      </div>
    </div>
  );
}

function DiningContent() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gastronomia em Fernando de Noronha</h2>
        <p className="text-gray-600">Sabores únicos da ilha com ingredientes frescos e locais.</p>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6 mb-6">
        <h3 className="text-xl font-semibold mb-3 text-orange-900">Festival do Zé Maria</h3>
        <p className="text-orange-800 mb-3">
          Experiência gastronômica única com música ao vivo e menu degustação com frutos do mar locais.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">Quartas e Sábados</span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">19h30</span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">Reserva obrigatória</span>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Restaurantes Recomendados</h3>
          <div className="space-y-4">
            {[
              { name: "Mergulhão", specialty: "Frutos do mar", location: "Porto" },
              { name: "Cacimba Bistrô", specialty: "Culinária contemporânea", location: "Cacimba do Padre" },
              { name: "Varanda", specialty: "Comida caseira", location: "Vila dos Remédios" },
              { name: "Flamboyant", specialty: "Pizza e massas", location: "Vila dos Remédios" }
            ].map((restaurant, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{restaurant.name}</h4>
                  <p className="text-sm text-gray-600">{restaurant.specialty}</p>
                </div>
                <div className="text-sm text-gray-500">{restaurant.location}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Especialidades Locais</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Peixe com Pirão", description: "Prato tradicional com peixe fresco e pirão de peixe" },
              { name: "Lagosta Grelhada", description: "Lagosta local grelhada com temperos especiais" },
              { name: "Caipirinha de Cajá", description: "Bebida refrescante com fruta típica da região" },
              { name: "Tapioca de Queijo", description: "Tapioca artesanal com queijo coalho local" }
            ].map((dish, i) => (
              <div key={i} className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">{dish.name}</h4>
                <p className="text-sm text-blue-800">{dish.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyGuideContent() {
  const months = [
    {
      month: "Janeiro",
      climate: { temp: "26-30°C", rain: "Alta", sea: "Agitado" },
      activities: ["Trilhas", "Observação de aves", "Fotografia"],
      tips: "Alta temporada - reserve com antecedência. Chuvas frequentes à tarde."
    },
    {
      month: "Fevereiro", 
      climate: { temp: "26-30°C", rain: "Alta", sea: "Agitado" },
      activities: ["Mergulho", "Trilhas curtas", "Gastronomia"],
      tips: "Ainda alta temporada. Março pode ser melhor opção com menos chuva."
    },
    {
      month: "Março",
      climate: { temp: "26-29°C", rain: "Moderada", sea: "Moderado" },
      activities: ["Praias", "Mergulho", "Caminhadas"],
      tips: "Início da melhora climática. Bom equilíbrio entre preço e clima."
    },
    {
      month: "Abril",
      climate: { temp: "25-28°C", rain: "Baixa", sea: "Calmo" },
      activities: ["Todas as praias", "Mergulho livre", "Trilhas"],
      tips: "Excelente mês! Clima seco, mar calmo, preços melhores."
    },
    {
      month: "Setembro",
      climate: { temp: "24-27°C", rain: "Baixa", sea: "Calmo" },
      activities: ["Mergulho", "Todas as praias", "Observação de golfinhos"],
      tips: "Época seca ideal. Visibilidade excelente para mergulho."
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quando Visitar Fernando de Noronha</h2>
        <p className="text-gray-600">Planeje sua viagem conhecendo o clima e atividades de cada época.</p>
      </div>

      <div className="grid gap-6">
        {months.map((monthData, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4">{monthData.month}</h3>
            
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Temperatura</h4>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                  {monthData.climate.temp}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Chuva</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  monthData.climate.rain === 'Baixa' ? 'bg-green-100 text-green-800' :
                  monthData.climate.rain === 'Moderada' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {monthData.climate.rain}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Mar</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  monthData.climate.sea === 'Calmo' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {monthData.climate.sea}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Atividades</h4>
                <div className="flex flex-wrap gap-1">
                  {monthData.activities.slice(0, 2).map((activity, i) => (
                    <span key={i} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Dicas</h4>
              <p className="text-sm text-blue-800">{monthData.tips}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 