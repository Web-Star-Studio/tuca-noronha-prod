"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Users, Palmtree, Waves, Fish, 
  Camera, Sunrise, Utensils, BedDouble, DollarSign, 
  ChevronRight, MapPin, Check, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { buttonStyles, cardStyles, transitionEffects } from "@/lib/ui-config";

interface ChatbotFormData {
  tripDuration: string;
  tripDate: string;
  companions: string;
  interests: string[];
  budget: number;
  preferences: {
    accommodation: string;
    dining: string[];
    activities: string[];
  };
  specialRequirements: string;
}

interface NoronhaChatbotProps {
  onComplete?: (data: ChatbotFormData) => void;
  initialData?: Partial<ChatbotFormData>;
  userName?: string;
}

export default function NoronhaTravelChatbot({ onComplete, initialData, userName = "Visitante" }: NoronhaChatbotProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [formData, setFormData] = useState<ChatbotFormData>({
    tripDuration: initialData?.tripDuration || "",
    tripDate: initialData?.tripDate || "",
    companions: initialData?.companions || "",
    interests: initialData?.interests || [],
    budget: initialData?.budget || 5000,
    preferences: {
      accommodation: initialData?.preferences?.accommodation || "pousada",
      dining: initialData?.preferences?.dining || [],
      activities: initialData?.preferences?.activities || [],
    },
    specialRequirements: initialData?.specialRequirements || "",
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Definições de questões
  const questions = [
    {
      id: 'tripDuration',
      question: "Quantos dias você pretende ficar em Fernando de Noronha?",
      type: 'text',
      placeholder: 'Ex: 5 dias, 1 semana...',
      icon: <Calendar className="h-5 w-5" />,
      description: "A duração ideal para aproveitar as principais atrações da ilha é de 4 a 7 dias."
    },
    {
      id: 'tripDate',
      question: "Em que período você planeja visitar a ilha?",
      type: 'text',
      placeholder: 'Ex: Dezembro, Janeiro 2025...',
      icon: <Calendar className="h-5 w-5" />,
      description: "A alta temporada vai de dezembro a março, com clima mais quente e águas cristalinas."
    },
    {
      id: 'companions',
      question: "Quem vai te acompanhar nessa viagem?",
      type: 'text',
      placeholder: 'Ex: Sozinho, casal, família com 2 crianças...',
      icon: <Users className="h-5 w-5" />,
      description: "Fernando de Noronha é ideal para casais, famílias e grupos de amigos."
    },
    {
      id: 'interests',
      question: "Quais experiências você mais gostaria de viver em Noronha?",
      type: 'multiselect',
      description: "Selecione todas as experiências que deseja viver durante sua estadia.",
      options: [
        { id: 'praia', label: 'Praias', icon: <Palmtree /> },
        { id: 'mergulho', label: 'Mergulho', icon: <Waves /> },
        { id: 'snorkel', label: 'Snorkeling', icon: <Fish /> },
        { id: 'trilhas', label: 'Trilhas', icon: <Palmtree /> },
        { id: 'fotografia', label: 'Fotografia', icon: <Camera /> },
        { id: 'passeio_barco', label: 'Passeio de Barco', icon: <Waves /> },
        { id: 'por_do_sol', label: 'Pôr do Sol', icon: <Sunrise /> },
        { id: 'vida_noturna', label: 'Vida Noturna', icon: <Users /> },
      ],
    },
    {
      id: 'budget',
      question: "Qual é o seu orçamento aproximado para a viagem (por pessoa)?",
      type: 'slider',
      min: 3000,
      max: 15000,
      step: 1000,
      icon: <DollarSign className="h-5 w-5" />,
      description: "O orçamento médio para uma semana em Fernando de Noronha varia entre R$ 5.000 e R$ 10.000 por pessoa."
    },
    {
      id: 'accommodation',
      question: "Qual tipo de hospedagem você prefere?",
      type: 'radio',
      description: "A maioria dos visitantes opta por pousadas aconchegantes, que são a opção mais típica da ilha.",
      options: [
        { id: 'pousada', label: 'Pousada aconchegante', icon: <BedDouble /> },
        { id: 'resort', label: 'Resort com mais estrutura', icon: <BedDouble /> },
        { id: 'casa', label: 'Casa/Apartamento inteiro', icon: <BedDouble /> },
        { id: 'camping', label: 'Camping/Opção econômica', icon: <BedDouble /> },
      ],
      parentField: 'preferences',
    },
    {
      id: 'dining',
      question: "Que tipo de experiências gastronômicas você gostaria?",
      type: 'multiselect',
      description: "A culinária da ilha é conhecida pelos frutos do mar frescos e pratos regionais nordestinos.",
      options: [
        { id: 'frutos_mar', label: 'Frutos do Mar', icon: <Fish /> },
        { id: 'regional', label: 'Comida Regional', icon: <Utensils /> },
        { id: 'vegetariana', label: 'Opções Vegetarianas', icon: <Utensils /> },
        { id: 'gourmet', label: 'Alta Gastronomia', icon: <Utensils /> },
        { id: 'economica', label: 'Opções Econômicas', icon: <DollarSign /> },
      ],
      parentField: 'preferences',
    },
    {
      id: 'activities',
      question: "Que atividades você prefere para completar sua viagem?",
      type: 'multiselect',
      description: "Há mais de 15 trilhas ecológicas e dezenas de passeios disponíveis na ilha.",
      options: [
        { id: 'trilhas_guiadas', label: 'Trilhas Guiadas', icon: <Palmtree /> },
        { id: 'passeio_barco', label: 'Passeio de Barco', icon: <Waves /> },
        { id: 'mergulho_avancado', label: 'Mergulho Avançado', icon: <Fish /> },
        { id: 'tour_historico', label: 'Tour Histórico', icon: <MapPin /> },
        { id: 'observacao_fauna', label: 'Observação de Fauna', icon: <Fish /> },
        { id: 'por_do_sol_baia', label: 'Pôr do Sol na Baía', icon: <Sunrise /> },
      ],
      parentField: 'preferences',
    },
    {
      id: 'specialRequirements',
      question: "Você tem alguma necessidade especial ou algo que devemos saber para personalizar ainda mais sua experiência?",
      type: 'textarea',
      placeholder: 'Ex: Alergias, acessibilidade, preferências especiais...',
      icon: <Check className="h-5 w-5" />,
      description: "Esta informação nos ajudará a garantir que sua experiência seja perfeita."
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  useEffect(() => {
    // Focar no input quando o componente é carregado
    setTimeout(() => {
      inputRef.current?.focus();
    }, 1000);
  }, []);

  useEffect(() => {
    // Rolar para o topo quando uma nova questão é apresentada
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    
    // Focar no input para questões de texto/textarea
    if (currentQuestion < questions.length) {
      const question = questions[currentQuestion];
      if (question.type === 'text' || question.type === 'textarea') {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      }
    }
  }, [currentQuestion]);

  const handleInputChange = (value: unknown, field: string) => {
    // Handle nested fields (e.g. preferences.accommodation)
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField as keyof typeof prev],
          [childField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleMultiSelect = (optionId: string, field: string) => {
    // Handle nested fields for multiselect
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      const currentSelections = [...(formData[parentField as keyof typeof formData][childField] || [])];
      
      const newSelections = currentSelections.includes(optionId)
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];
      
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField as keyof typeof prev],
          [childField]: newSelections
        }
      }));
    } 
    // Handle direct fields
    else {
      const currentSelections = [...(formData[field as keyof typeof formData] || [])];
      
      const newSelections = currentSelections.includes(optionId)
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];
      
      setFormData(prev => ({
        ...prev,
        [field]: newSelections
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para questões de texto/textarea
    if (currentQuestion < questions.length) {
      const currentQ = questions[currentQuestion];
      
      if ((currentQ.type === 'text' || currentQ.type === 'textarea')) {
        if (!currentInput.trim()) return;
        
        if (currentQ.parentField) {
          setFormData(prev => ({
            ...prev,
            [currentQ.parentField]: {
              ...prev[currentQ.parentField as keyof typeof prev],
              [currentQ.id]: currentInput
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [currentQ.id]: currentInput
          }));
        }
        
        setCurrentInput("");
        setCurrentQuestion(prev => prev + 1);
      } 
      // Para multiselect/radio/slider
      else {
        // Verificar se há uma seleção para multiselect
        if (currentQ.type === 'multiselect') {
          const selections = currentQ.parentField
            ? formData[currentQ.parentField as keyof typeof formData][currentQ.id]
            : formData[currentQ.id as keyof typeof formData];
            
          if (!selections || selections.length === 0) {
            // Mostrar aviso
            return;
          }
        }
        // Verificar se há uma seleção para radio
        else if (currentQ.type === 'radio') {
          const selection = currentQ.parentField
            ? formData[currentQ.parentField as keyof typeof formData][currentQ.id]
            : formData[currentQ.id as keyof typeof formData];
            
          if (!selection) {
            // Mostrar aviso
            return;
          }
        }
        
        // Avançar para a próxima questão
        setCurrentQuestion(prev => prev + 1);
      }
    }
    
    // Se chegou ao final das questões, mostrar o resumo
    if (currentQuestion === questions.length - 1) {
      setShowSummary(true);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // Renderização do resumo
  const renderSummary = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-3 text-gray-800">Perfeito, {userName}!</h3>
          <p className="text-muted-foreground max-w-lg mx-auto">Vamos personalizar sua experiência em Fernando de Noronha com base nas suas preferências.</p>
        </div>
        
        <div className="space-y-6 bg-blue-50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Duração</h4>
              </div>
              <p className="pl-7 text-sm">{formData.tripDuration || "Não informado"}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Período</h4>
              </div>
              <p className="pl-7 text-sm">{formData.tripDate || "Não informado"}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Acompanhantes</h4>
              </div>
              <p className="pl-7 text-sm">{formData.companions || "Não informado"}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Orçamento</h4>
              </div>
              <p className="pl-7 text-sm">{formatCurrency(formData.budget)}</p>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Palmtree className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Interesses</h4>
            </div>
            <div className="pl-7 flex flex-wrap gap-2">
              {formData.interests && formData.interests.length > 0 ? (
                formData.interests.map(interest => {
                  const option = questions.find(q => q.id === 'interests')?.options?.find(o => o.id === interest);
                  return (
                    <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                      {option?.icon && <span className="text-blue-600">{option.icon}</span>}
                      {option?.label || interest}
                    </Badge>
                  );
                })
              ) : (
                <span className="text-sm text-muted-foreground">Nenhum interesse selecionado</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Hospedagem</h4>
            </div>
            <p className="pl-7 text-sm">
              {formData.preferences.accommodation === 'pousada' ? 'Pousada aconchegante' :
               formData.preferences.accommodation === 'resort' ? 'Resort com mais estrutura' :
               formData.preferences.accommodation === 'casa' ? 'Casa/Apartamento inteiro' :
               formData.preferences.accommodation === 'camping' ? 'Camping/Opção econômica' :
               'Não informado'}
            </p>
          </div>
          
          {formData.interests && formData.interests.length > 0 && (
            <div className="mt-6 pt-4 border-t border-blue-200">
              <h4 className="font-medium mb-3">Nossas recomendações para você:</h4>
              <ul className="space-y-2 pl-2">
                {formData.interests.includes('praia') && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Praia do Sancho - eleita uma das mais bonitas do mundo</span>
                  </li>
                )}
                {formData.interests.includes('mergulho') && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Mergulho na Baía dos Porcos ou Baía do Sueste</span>
                  </li>
                )}
                {formData.interests.includes('snorkel') && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Snorkeling na Praia da Atalaia (piscina natural)</span>
                  </li>
                )}
                {formData.interests.includes('trilhas') && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Trilha até o Mirante dos Golfinhos</span>
                  </li>
                )}
                {formData.interests.includes('fotografia') && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Pôr do sol na Praia do Boldró</span>
                  </li>
                )}
                {formData.interests.includes('passeio_barco') && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Passeio de barco ao redor da ilha</span>
                  </li>
                )}
                {formData.interests.includes('por_do_sol') && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Pôr do sol no Forte do Boldró</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleComplete}
            className={`${buttonStyles.variant.gradient} px-6`}
            size="lg"
          >
            Ver Minhas Recomendações Completas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // Renderização da questão atual
  const renderCurrentQuestion = () => {
    if (currentQuestion >= questions.length) {
      return null;
    }
    
    const question = questions[currentQuestion];
    
    return (
      <motion.div
        key={`question-${question.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 max-w-3xl mx-auto"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {question.icon && (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                {question.icon}
              </div>
            )}
            <h3 className="text-2xl font-medium text-gray-800">{question.question}</h3>
          </div>
          
          {question.description && (
            <p className="text-muted-foreground text-sm pl-14">{question.description}</p>
          )}
        </div>
        
        <div className="pl-14 pt-3">
          {question.type === 'multiselect' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {question.options?.map((option) => {
                const fieldPath = question.parentField 
                  ? `${question.parentField}.${question.id}` 
                  : question.id;
                
                const isSelected = question.parentField
                  ? formData[question.parentField as keyof typeof formData]?.[question.id as keyof typeof formData.preferences]?.includes(option.id)
                  : formData[question.id as keyof typeof formData]?.includes(option.id);
                
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`flex items-center justify-start p-4 h-auto ${isSelected ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' : ''}`}
                    onClick={() => handleMultiSelect(option.id, fieldPath)}
                  >
                    <div className={`w-8 h-8 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
                      {option.icon}
                    </div>
                    <span>{option.label}</span>
                    {isSelected && <Check className="ml-auto h-4 w-4" />}
                  </Button>
                );
              })}
            </div>
          )}
          
          {question.type === 'radio' && (
            <div className="space-y-3 mt-2">
              <RadioGroup
                value={question.parentField
                  ? formData[question.parentField as keyof typeof formData][question.id]
                  : formData[question.id as keyof typeof formData]}
                onValueChange={(value) => handleInputChange(value, question.parentField ? `${question.parentField}.${question.id}` : question.id)}
                className="space-y-3"
              >
                {question.options?.map((option) => (
                  <div 
                    key={option.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      question.parentField
                        ? formData[question.parentField as keyof typeof formData][question.id] === option.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                        : formData[question.id as keyof typeof formData] === option.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    } transition-colors`}
                  >
                    <RadioGroupItem value={option.id} id={`radio-${option.id}`} />
                    <Label htmlFor={`radio-${option.id}`} className="flex items-center cursor-pointer flex-1">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {option.icon}
                      </div>
                      <span>{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
          
          {question.type === 'slider' && (
            <div className="mt-6 space-y-8 px-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Econômico</span>
                <span>Conforto</span>
                <span>Premium</span>
              </div>
              
              <Slider
                value={[formData.budget]}
                min={question.min}
                max={question.max}
                step={question.step}
                onValueChange={(values) => handleInputChange(values[0], question.id)}
                className="mt-2"
              />
              
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-700">
                  {formatCurrency(formData.budget)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">por pessoa</p>
              </div>
            </div>
          )}
          
          {question.type === 'text' && (
            <div className="mt-2">
              <Input
                ref={inputRef}
                placeholder={question.placeholder || "Digite sua resposta..."}
                className="w-full p-3 text-base"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
              />
            </div>
          )}
          
          {question.type === 'textarea' && (
            <div className="mt-2">
              <Textarea
                placeholder={question.placeholder || "Digite sua resposta..."}
                className="w-full p-3 text-base min-h-[120px]"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-lg border border-gray-100">
      {/* Cabeçalho */}
      <div className="bg-[url('/images/noronha-header.jpg')] bg-cover bg-center h-40 relative flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-800/60 to-blue-900/30" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Experiência <span className="text-blue-200">Personalizada</span>
            </h2>
            <p className="text-blue-100 mt-2 opacity-90 max-w-md">
              Conte-nos suas preferências para criarmos um roteiro exclusivo para sua viagem a Fernando de Noronha
            </p>
          </div>
        </div>
      </div>
      
      {/* Barra de progresso */}
      <div className="px-8 pt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-700 font-medium">
            {showSummary ? 'Concluído!' : `Questão ${currentQuestion + 1} de ${questions.length}`}
          </span>
          <span className="text-gray-500 font-medium">
            {Math.round(((showSummary ? questions.length : currentQuestion) / questions.length) * 100)}%
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${((showSummary ? questions.length : currentQuestion) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Conteúdo */}
      <div 
        ref={contentRef}
        className="p-8 overflow-y-auto"
        style={{ minHeight: "420px", maxHeight: "500px" }}
      >
        <AnimatePresence mode="wait">
          {showSummary ? renderSummary() : renderCurrentQuestion()}
        </AnimatePresence>
      </div>
      
      {/* Botões de navegação */}
      {!showSummary && (
        <div className="p-6 border-t border-gray-100 flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className="text-gray-500 px-5"
          >
            Voltar
          </Button>
          
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              (questions[currentQuestion]?.type === 'text' || questions[currentQuestion]?.type === 'textarea') 
                ? !currentInput.trim() 
                : false
            }
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 shadow-md"
          >
            {currentQuestion === questions.length - 1 ? 'Concluir' : 'Próximo'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 