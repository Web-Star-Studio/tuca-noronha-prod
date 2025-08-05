"use client";

import React, { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Search,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Star,
  ExternalLink,
  Calendar,
  CheckCircle,
  HeadphonesIcon
} from "lucide-react";
import { GlobalContactButton } from "@/components/contact/GlobalContactButton";
import Link from "next/link";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const faqs: FAQItem[] = [
  {
    id: "1",
    category: "reservas",
    question: "Como faço para reservar uma atividade?",
    answer: "Para reservar uma atividade, navegue até a seção 'Atividades', escolha a atividade desejada e clique em 'Reservar Agora'. Você será direcionado para o formulário de reserva onde poderá escolher datas, horários e fazer o pagamento. Após a confirmação, você receberá um e-mail com os detalhes da sua reserva.",
    tags: ["reserva", "atividade", "pagamento"]
  },
  {
    id: "2",
    category: "reservas",
    question: "Posso cancelar minha reserva?",
    answer: "Sim, você pode cancelar sua reserva até 24 horas antes da data agendada sem custos. Para cancelamentos com menos de 24 horas, será cobrada uma taxa de 50% do valor total. Para cancelar, acesse 'Minhas Reservas' no seu painel ou entre em contato conosco pelo WhatsApp.",
    tags: ["cancelamento", "política", "reembolso"]
  },
  {
    id: "3",
    category: "reservas",
    question: "Quais formas de pagamento são aceitas?",
    answer: "Aceitamos cartões de crédito (Visa, Mastercard, Elo), PIX, débito online e parcelamento em até 6x sem juros. Para pagamentos via PIX, você recebe 5% de desconto no valor total. Todos os pagamentos são processados de forma segura através do nosso sistema.",
    tags: ["pagamento", "cartão", "pix", "parcelamento"]
  },
  {
    id: "4",
    category: "reservas",
    question: "Como funciona o programa de fidelidade?",
    answer: "Nosso programa de fidelidade oferece pontos a cada reserva realizada. A cada R$ 100 gastos, você ganha 10 pontos. Com 100 pontos, você pode trocar por 10% de desconto na próxima reserva. Clientes VIP (mais de 5 reservas) recebem benefícios exclusivos como acesso antecipado a novas atividades.",
    tags: ["fidelidade", "pontos", "desconto", "vip"]
  },
  {
    id: "5",
    category: "planejamento",
    question: "Qual a melhor época para visitar Fernando de Noronha?",
    answer: "Fernando de Noronha é um destino que pode ser visitado o ano todo! A estação seca (setembro a março) oferece mar mais calmo e melhor visibilidade para mergulho. A estação chuvosa (abril a agosto) tem chuvas rápidas, mar mais agitado, mas paisagens mais verdes e menos turistas. Para surf, a melhor época é de dezembro a março.",
    tags: ["época", "clima", "mergulho", "surf"]
  },
  {
    id: "6",
    category: "planejamento",
    question: "Quantos dias são recomendados para a viagem?",
    answer: "Recomendamos de 4 a 7 dias para conhecer bem a ilha. Em 4 dias você consegue ver as principais praias e fazer algumas atividades. Com 7 dias, é possível explorar com mais calma, fazer mais mergulhos e aproveitar melhor cada local. Para quem gosta de natureza e tranquilidade, até 10 dias são perfeitos.",
    tags: ["duração", "roteiro", "planejamento"]
  },
  {
    id: "7",
    category: "planejamento",
    question: "Preciso de vacina para viajar para Fernando de Noronha?",
    answer: "Não há obrigatoriedade de vacinas específicas para Fernando de Noronha. Recomendamos estar com a vacinação básica em dia (tétano, hepatite A e B). Durante a pandemia, seguimos todos os protocolos sanitários. Consulte sempre o site oficial da ANVISA para informações atualizadas sobre requisitos sanitários.",
    tags: ["vacina", "saúde", "requisitos"]
  },
  {
    id: "8",
    category: "hospedagem",
    question: "Vocês oferecem hospedagem?",
    answer: "Sim! Temos parcerias com as melhores pousadas e hotéis da ilha. Oferecemos desde opções econômicas até hospedagens de luxo. Todas são selecionadas por qualidade, localização e atendimento. Você pode ver as opções na seção 'Hospedagem' e fazer sua reserva diretamente conosco com preços especiais.",
    tags: ["hospedagem", "pousada", "hotel", "parcerias"]
  },
  {
    id: "9",
    category: "hospedagem",
    question: "Qual a diferença entre as categorias de hospedagem?",
    answer: "Oferecemos 3 categorias: Econômica (pousadas simples, confortáveis, bom custo-benefício), Conforto (pousadas com mais comodidades, localização privilegiada, café da manhã incluso) e Luxo (hotéis premium, vista para o mar, serviços exclusivos). Todas são inspecionadas regularmente pela nossa equipe.",
    tags: ["categoria", "diferença", "preço", "comodidades"]
  },
  {
    id: "10",
    category: "atividades",
    question: "Preciso saber nadar para fazer as atividades aquáticas?",
    answer: "Para a maioria das atividades aquáticas, recomendamos saber nadar por segurança. Porém, oferecemos opções para não nadadores como passeios de barco, snorkeling com colete salva-vidas e mergulho batismal com instrutor. Sempre informamos o nível de dificuldade e requisitos de cada atividade na descrição.",
    tags: ["natação", "segurança", "requisitos", "mergulho"]
  },
  {
    id: "11",
    category: "atividades",
    question: "As atividades incluem equipamentos?",
    answer: "Sim! Todas as nossas atividades incluem equipamentos de segurança e necessários para a prática. Para mergulho: máscara, snorkel, nadadeiras, roupas de neoprene. Para trilhas: bastões quando necessário. Para passeios de barco: coletes salva-vidas. Equipamentos são higienizados entre cada uso.",
    tags: ["equipamentos", "segurança", "higiene", "incluído"]
  },
  {
    id: "12",
    category: "transporte",
    question: "Como chegar em Fernando de Noronha?",
    answer: "Fernando de Noronha só pode ser acessada por avião, através do Aeroporto Governador Carlos Wilson. Há voos diretos de Recife (1h30) e Natal (1h20). Companhias que operam: Gol e Azul. Recomendamos comprar as passagens com antecedência. Podemos ajudar com indicações de melhores voos e preços.",
    tags: ["voo", "aeroporto", "companhias", "acesso"]
  },
  {
    id: "13",
    category: "transporte",
    question: "Como é o transporte na ilha?",
    answer: "Na ilha, você pode se locomover de: buggy (mais comum, ideal para praias), carro (confortável para famílias), moto (econômico, para pessoas experientes) ou bike (ecológico, bom para distâncias curtas). Oferecemos aluguel de todos os tipos de veículos com preços especiais para nossos clientes.",
    tags: ["buggy", "carro", "moto", "bicicleta", "aluguel"]
  },
  {
    id: "14",
    category: "restaurantes",
    question: "Vocês fazem reservas em restaurantes?",
    answer: "Sim! Fazemos reservas nos melhores restaurantes da ilha. Temos parcerias que garantem mesas mesmo na alta temporada. Oferecemos desde restaurantes econômicos até experiências gastronômicas de luxo. Você pode solicitar reservas através do nosso WhatsApp ou na seção 'Restaurantes' do site.",
    tags: ["reserva", "restaurante", "gastronomia", "mesa"]
  },
  {
    id: "15",
    category: "restaurantes",
    question: "Há opções para vegetarianos e veganos?",
    answer: "Sim! Fernando de Noronha tem excelentes opções vegetarianas e veganas. Restaurantes como Corveta, Flamboyant e Mergulhão oferecem pratos específicos. Também temos parceria com chefs que fazem experiências gastronômicas personalizadas. Sempre confirmamos as opções disponíveis ao fazer suas reservas.",
    tags: ["vegetariano", "vegano", "dieta", "opções"]
  }
];

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [feedbackGiven, setFeedbackGiven] = useState<string[]>([]);

  const filteredFAQs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || faq.category === selectedCategory
      return matchesSearch && matchesCategory
    });
  }, [searchTerm, selectedCategory]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    faqs.forEach(faq => {
      stats[faq.category] = (stats[faq.category] || 0) + 1;
    });
    return stats;
  }, []);

  const categories = [
    { id: "reservas", label: "Reservas e Pagamentos", icon: "💳" },
    { id: "planejamento", label: "Planejamento", icon: "📅" },
    { id: "hospedagem", label: "Hospedagem", icon: "🏨" },
    { id: "atividades", label: "Atividades", icon: "🏊" },
    { id: "transporte", label: "Transporte", icon: "✈️" },
    { id: "restaurantes", label: "Restaurantes", icon: "🍽️" }
  ];

  const handleFeedback = (faqId: string) => {
    setFeedbackGiven(prev => [...prev, faqId]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Ajuda e Suporte */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')",
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative z-10 py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <HeadphonesIcon className="w-4 h-4 text-white mr-2" />
              <span className="text-sm text-white font-medium">Central de Ajuda</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
              Como podemos
              <span className="block text-blue-200">ajudar você?</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Encontre respostas para suas dúvidas ou entre em contato com nossa equipe especializada em Fernando de Noronha.
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-white/80 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Suporte 24h</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Respostas rápidas</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Especialistas locais</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 py-12 -mt-16 relative z-20">
        <div className="space-y-8">
          {/* Busca */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-lg">
            <CardContent className="p-4 md:p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  type="text"
                  placeholder="Pesquisar dúvidas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categorias */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl text-gray-800">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button
                  variant='default'
                  onClick={() => setSelectedCategory("")}
                  className={`rounded-full text-xs md:text-sm px-3 py-2 md:px-4 md:py-2 ${
                    selectedCategory === "" ? "bg-blue-500 text-white" : "bg-white text-gray-800 border border-gray-300"
                  }`}
                >
                  <span className="hidden sm:inline">Todas</span>
                  <span className="sm:hidden">🔍</span>
                  {faqs.length > 0 && <span className="ml-1">({faqs.length})</span>}
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant='default'
                    onClick={() => setSelectedCategory(category.id)}
                    className={`rounded-full text-xs md:text-sm px-3 py-2 md:px-4 md:py-2 ${
                      selectedCategory === category.id ? "bg-blue-500 text-white" : "bg-white text-gray-800 border border-gray-300"
                    }`}
                  >
                    <span className="mr-1">{category.icon}</span>
                    <span className="hidden sm:inline">{category.label}</span>
                    <span className="sm:hidden">
                      {category.id === "reservas" && "Reservas"}
                      {category.id === "planejamento" && "Planos"}
                      {category.id === "hospedagem" && "Hotel"}
                      {category.id === "atividades" && "Tours"}
                      {category.id === "transporte" && "Transporte"}
                      {category.id === "restaurantes" && "Food"}
                    </span>
                    {categoryStats[category.id] && <span className="ml-1">({categoryStats[category.id]})</span>}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <Card className="bg-white shadow-lg border border-gray-200 rounded-lg">
                <CardContent className="p-8 text-center">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-gray-600">Tente ajustar sua busca ou entre em contato conosco.</p>
                </CardContent>
              </Card>
            ) : (
              filteredFAQs.map((faq) => (
                <FAQCard 
                  key={faq.id} 
                  faq={faq} 
                  onFeedback={handleFeedback}
                  feedbackGiven={feedbackGiven.includes(faq.id)}
                />
              ))
            )}
          </div>

          {/* Contato */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg rounded-lg">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                Ainda precisa de ajuda?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 md:px-6">
              <p className="text-sm md:text-base text-gray-600">
                Nossa equipe está disponível para ajudar com qualquer dúvida sobre Fernando de Noronha.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-lg shadow-sm">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base text-gray-800">WhatsApp</p>
                    <p className="text-xs md:text-sm text-gray-600">Resposta em minutos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-lg shadow-sm">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base text-gray-800">Email</p>
                    <p className="text-xs md:text-sm text-gray-600">Resposta em até 2 horas</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span>Atendimento: Segunda a Domingo, das 6h às 22h</span>
              </div>

              <div className="flex gap-2">
                <GlobalContactButton />
              </div>
            </CardContent>
          </Card>

          {/* Links Úteis */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-lg">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl text-gray-800">Links Úteis</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <a href="/meu-painel/guia" className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base text-gray-800 group-hover:text-blue-600">Guia Interativo</p>
                    <p className="text-xs md:text-sm text-gray-600 truncate">Informações completas sobre a ilha</p>
                  </div>
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                </a>
                
                <Link href="/reservas" className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base text-gray-800 group-hover:text-green-600">Minhas Reservas</p>
                    <p className="text-xs md:text-sm text-gray-600 truncate">Gerencie suas reservas</p>
                  </div>
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                </Link>
                
                <Link href="/pacotes" className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base text-gray-800 group-hover:text-purple-600">Políticas</p>
                    <p className="text-xs md:text-sm text-gray-600 truncate">Termos e condições</p>
                  </div>
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer da Ajuda */}
          <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 shadow-lg rounded-lg">
            <CardContent className="p-4 md:p-8 text-center">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Emergências em Fernando de Noronha</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div className="space-y-1 md:space-y-2">
                  <p className="font-medium text-gray-800">Bombeiros: <span className="text-red-600">193</span></p>
                  <p className="font-medium text-gray-800">Polícia: <span className="text-blue-600">190</span></p>
                  <p className="font-medium text-gray-800">SAMU: <span className="text-green-600">192</span></p>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <p className="font-medium text-gray-800">Hospital São Lucas: <span className="text-blue-600">(81) 3619-1877</span></p>
                  <p className="font-medium text-gray-800">Capitania dos Portos: <span className="text-blue-600">(81) 3619-1131</span></p>
                  <p className="font-medium text-gray-800">ICMBio: <span className="text-green-600">(81) 3619-1171</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

// Componente FAQCard
function FAQCard({ faq, onFeedback, feedbackGiven }: { faq: FAQItem, onFeedback: (id: string) => void, feedbackGiven: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="bg-white shadow-lg border border-gray-200 rounded-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle 
          className="text-base md:text-lg text-gray-800 cursor-pointer flex items-start md:items-center justify-between group gap-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5 md:mt-0">
              {faq.category === "reservas" && "💳"}
              {faq.category === "planejamento" && "📅"}
              {faq.category === "hospedagem" && "🏨"}
              {faq.category === "atividades" && "🏊"}
              {faq.category === "transporte" && "✈️"}
              {faq.category === "restaurantes" && "🍽️"}
            </div>
            <span className="group-hover:text-blue-600 transition-colors leading-tight md:leading-normal break-words">
              {faq.question}
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1 flex-wrap">
              {faq.tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {faq.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{faq.tags.length - 2}
                </Badge>
              )}
            </div>
            <HelpCircle className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CardTitle>
        
        {/* Tags móveis - mostradas apenas quando fechado */}
        {!isOpen && (
          <div className="flex md:hidden items-center gap-1 flex-wrap mt-2">
            {faq.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {faq.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                +{faq.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      {isOpen && (
        <CardContent className="border-t pt-4 px-4 md:px-6">
          <div className="pl-0 md:pl-8">
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
              {faq.answer}
            </p>
            
            {/* Tags completas quando expandido no mobile */}
            <div className="flex md:hidden items-center gap-1 flex-wrap mb-4">
              {faq.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs md:text-sm text-gray-500">
                Esta resposta foi útil?
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback(faq.id)}
                disabled={feedbackGiven}
                className={`text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 self-start sm:self-auto ${
                  feedbackGiven ? "text-green-600" : "text-gray-600 hover:text-green-600"
                }`}
              >
                {feedbackGiven ? "✓ Obrigado!" : "👍 Útil"}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 