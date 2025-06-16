"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Palmtree, Waves, Camera, Utensils, BedDouble, 
  ChevronRight, MapPin, Check, ArrowRight, ChevronLeft,
  Star, Zap, Compass, Award, Target, TrendingUp, Sparkles,
  Clock, Calendar, Heart, Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cardStyles, buttonStyles, ui } from "@/lib/ui-config";
import { cn } from "@/lib/utils";

interface PersonalityProfile {
  adventureLevel: number;
  luxuryPreference: number;
  socialLevel: number;
  activityIntensity: number;
}

interface SmartPreferences {
  tripDuration: string;
  companions: string;
  interests: string[];
  budget: number;
  personalityProfile: PersonalityProfile;
  moodTags: string[];
  experienceGoals: string[];
}

interface InteractiveOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  moodColor: string;
}

interface PersonalizationStep {
  id: string;
  title: string;
  subtitle: string;
  type: 'visual-selection' | 'personality-sliders' | 'mood-board' | 'goal-selection';
  icon: React.ReactNode;
  options?: InteractiveOption[];
  sliders?: Array<{
    key: keyof PersonalityProfile;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }>;
}

interface ModernPersonalizationProps {
  onComplete?: (data: SmartPreferences) => void;
  initialData?: Partial<SmartPreferences>;
  userName?: string;
}

export default function PersonalizationChatbot({ 
  onComplete, 
  initialData, 
  userName = "Visitante" 
}: ModernPersonalizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<SmartPreferences>({
    tripDuration: initialData?.tripDuration || "",
    companions: initialData?.companions || "",
    interests: initialData?.interests || [],
    budget: initialData?.budget || 7500,
    personalityProfile: initialData?.personalityProfile || {
      adventureLevel: 50,
      luxuryPreference: 50,
      socialLevel: 50,
      activityIntensity: 50,
    },
    moodTags: initialData?.moodTags || [],
    experienceGoals: initialData?.experienceGoals || [],
  });
  
  const [showSummary, setShowSummary] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const steps: PersonalizationStep[] = [
    {
      id: 'basics',
      title: 'Vamos conhecer você!',
      subtitle: 'Duração da sua viagem em Fernando de Noronha',
      type: 'visual-selection',
      icon: <Users className="h-6 w-6" />,
      options: [
        {
          id: '3-4-days',
          label: '3-4 dias',
          description: 'Escapada rápida e intensa',
          icon: <Clock className="h-5 w-5" />,
          moodColor: 'bg-blue-100 border-blue-300 text-blue-800'
        },
        {
          id: '5-7-days',
          label: '5-7 dias',
          description: 'Experiência completa e equilibrada',
          icon: <Calendar className="h-5 w-5" />,
          moodColor: 'bg-green-100 border-green-300 text-green-800'
        },
        {
          id: '8-plus-days',
          label: '8+ dias',
          description: 'Imersão total no paraíso',
          icon: <Star className="h-5 w-5" />,
          moodColor: 'bg-purple-100 border-purple-300 text-purple-800'
        }
      ]
    },
    {
      id: 'personality',
      title: 'Qual é o seu estilo?',
      subtitle: 'Defina sua personalidade de viajante movendo os controles',
      type: 'personality-sliders',
      icon: <Zap className="h-6 w-6" />,
      sliders: [
        {
          key: 'adventureLevel',
          label: 'Nível de Aventura',
          description: 'Do relaxamento total à adrenalina pura',
          icon: <Compass className="h-5 w-5" />,
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500'
        },
        {
          key: 'luxuryPreference',
          label: 'Preferência por Luxo',
          description: 'Do básico ao premium',
          icon: <Star className="h-5 w-5" />,
          color: 'bg-gradient-to-r from-amber-500 to-orange-500'
        },
        {
          key: 'socialLevel',
          label: 'Nível Social',
          description: 'Momentos íntimos ou experiências compartilhadas',
          icon: <Users className="h-5 w-5" />,
          color: 'bg-gradient-to-r from-pink-500 to-rose-500'
        },
        {
          key: 'activityIntensity',
          label: 'Intensidade das Atividades',
          description: 'Contemplativo ou cheio de energia',
          icon: <Zap className="h-5 w-5" />,
          color: 'bg-gradient-to-r from-green-500 to-emerald-500'
        }
      ]
    },
    {
      id: 'mood-vibes',
      title: 'Que vibe você quer sentir?',
      subtitle: 'Selecione todas as sensações que você busca em Noronha',
      type: 'mood-board',
      icon: <Sparkles className="h-6 w-6" />,
      options: [
        {
          id: 'tranquil',
          label: 'Tranquilidade',
          description: 'Paz interior e desconexão',
          icon: <Waves className="h-5 w-5" />,
          moodColor: 'bg-sky-100 border-sky-300 text-sky-800'
        },
        {
          id: 'adventure',
          label: 'Aventura',
          description: 'Emoção e descobertas',
          icon: <Compass className="h-5 w-5" />,
          moodColor: 'bg-orange-100 border-orange-300 text-orange-800'
        },
        {
          id: 'romantic',
          label: 'Romance',
          description: 'Momentos especiais a dois',
          icon: <Heart className="h-5 w-5" />,
          moodColor: 'bg-pink-100 border-pink-300 text-pink-800'
        },
        {
          id: 'discovery',
          label: 'Descoberta',
          description: 'Explorar o desconhecido',
          icon: <MapPin className="h-5 w-5" />,
          moodColor: 'bg-purple-100 border-purple-300 text-purple-800'
        },
        {
          id: 'connection',
          label: 'Conexão',
          description: 'Com a natureza e pessoas',
          icon: <Users className="h-5 w-5" />,
          moodColor: 'bg-green-100 border-green-300 text-green-800'
        },
        {
          id: 'luxury',
          label: 'Sofisticação',
          description: 'Experiências refinadas',
          icon: <Star className="h-5 w-5" />,
          moodColor: 'bg-amber-100 border-amber-300 text-amber-800'
        }
      ]
    },
    {
      id: 'goals',
      title: 'Objetivos da viagem',
      subtitle: 'O que você espera levar desta experiência única?',
      type: 'goal-selection',
      icon: <Award className="h-6 w-6" />,
      options: [
        {
          id: 'relaxation',
          label: 'Relaxamento Total',
          description: 'Recarregar as energias completamente',
          icon: <Waves className="h-5 w-5" />,
          moodColor: 'bg-sky-100 border-sky-300 text-sky-800'
        },
        {
          id: 'adventure-memories',
          label: 'Memórias de Aventura',
          description: 'Histórias incríveis para contar',
          icon: <Camera className="h-5 w-5" />,
          moodColor: 'bg-orange-100 border-orange-300 text-orange-800'
        },
        {
          id: 'natural-connection',
          label: 'Conexão com a Natureza',
          description: 'Experiência ecológica transformadora',
          icon: <Palmtree className="h-5 w-5" />,
          moodColor: 'bg-emerald-100 border-emerald-300 text-emerald-800'
        },
        {
          id: 'instagram-worthy',
          label: 'Momentos Instagramáveis',
          description: 'Fotos incríveis para compartilhar',
          icon: <Camera className="h-5 w-5" />,
          moodColor: 'bg-pink-100 border-pink-300 text-pink-800'
        }
      ]
    }
  ];

  const handleOptionSelect = (optionId: string, stepType: string) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      
      switch (stepType) {
        case 'visual-selection':
          newPrefs.tripDuration = optionId;
          break;
        case 'mood-board':
          if (!newPrefs.moodTags.includes(optionId)) {
            newPrefs.moodTags = [...newPrefs.moodTags, optionId];
          } else {
            newPrefs.moodTags = newPrefs.moodTags.filter(tag => tag !== optionId);
          }
          break;
        case 'goal-selection':
          if (!newPrefs.experienceGoals.includes(optionId)) {
            newPrefs.experienceGoals = [...newPrefs.experienceGoals, optionId];
          } else {
            newPrefs.experienceGoals = newPrefs.experienceGoals.filter(goal => goal !== optionId);
          }
          break;
      }
      
      return newPrefs;
    });
  };

  const handleSliderChange = (key: keyof PersonalityProfile, value: number) => {
    setPreferences(prev => ({
      ...prev,
      personalityProfile: {
        ...prev.personalityProfile,
        [key]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(preferences);
    }
  };

  const renderPersonalitySliders = (step: PersonalizationStep) => {
    if (!step.sliders) return null;

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        {step.sliders.map((slider, index) => (
          <motion.div 
            key={slider.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", slider.color)}>
                  {slider.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{slider.label}</h4>
                  <p className="text-sm text-gray-600">{slider.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {preferences.personalityProfile[slider.key]}
                </div>
                <div className="text-xs text-gray-500">de 100</div>
              </div>
            </div>
            
            <div className="px-2">
              <Slider
                value={[preferences.personalityProfile[slider.key]]}
                onValueChange={(values) => handleSliderChange(slider.key, values[0])}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mínimo</span>
                <span>Máximo</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderOptions = (step: PersonalizationStep) => {
    if (!step.options) return null;

    const isMultiSelect = ['mood-board', 'goal-selection'].includes(step.type);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {step.options.map((option, index) => {
          const isSelected = 
            (step.type === 'visual-selection' && preferences.tripDuration === option.id) ||
            (step.type === 'mood-board' && preferences.moodTags.includes(option.id)) ||
            (step.type === 'goal-selection' && preferences.experienceGoals.includes(option.id));

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-300 border-2 h-full",
                  isSelected 
                    ? `${option.moodColor} shadow-lg transform scale-105` 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                )}
                onClick={() => handleOptionSelect(option.id, step.type)}
              >
                <CardContent className="p-6 text-center space-y-3 h-full flex flex-col justify-between">
                  <div>
                    <div className={cn(
                      "w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3",
                      isSelected ? "bg-white/20" : "bg-gray-100"
                    )}>
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{option.label}</h3>
                      <p className="text-sm opacity-80 mt-1">{option.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex justify-center"
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderCurrentStep = () => {
    const step = steps[currentStep];
    
    return (
      <motion.div
        key={`step-${step.id}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        <div className="text-center space-y-3">
          <div className={cn(
            "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white",
            currentStep < 2 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
            currentStep < 4 ? "bg-gradient-to-r from-purple-500 to-pink-500" :
            "bg-gradient-to-r from-green-500 to-emerald-500"
          )}>
            {step.icon}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{step.title}</h2>
            <p className="text-gray-600 text-lg mt-2">{step.subtitle}</p>
          </div>
        </div>

        <div>
          {step.type === 'personality-sliders' ? renderPersonalitySliders(step) : renderOptions(step)}
        </div>
      </motion.div>
    );
  };

  const renderSummary = () => {
    const personalityInsights = [
      {
        key: 'adventureLevel',
        label: 'Aventureiro',
        value: preferences.personalityProfile.adventureLevel,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        key: 'luxuryPreference', 
        label: 'Sofisticado',
        value: preferences.personalityProfile.luxuryPreference,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100'
      },
      {
        key: 'socialLevel',
        label: 'Social',
        value: preferences.personalityProfile.socialLevel,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100'
      },
      {
        key: 'activityIntensity',
        label: 'Ativo',
        value: preferences.personalityProfile.activityIntensity,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mx-auto">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Perfil Criado com Sucesso!</h2>
            <p className="text-gray-600 text-lg">Suas recomendações personalizadas estão prontas, {userName}.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className={cn(cardStyles.base, cardStyles.hover.lift)}>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                Seu Perfil de Viajante
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalityInsights.map((insight) => (
                <div key={insight.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn("w-3 h-3 rounded-full", insight.bgColor)} />
                    <span className="font-medium">{insight.label}</span>
                  </div>
                  <div className={cn("font-bold", insight.color)}>
                    {insight.value}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={cn(cardStyles.base, cardStyles.hover.lift)}>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                Suas Vibes
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {preferences.moodTags.map((tag) => {
                  const option = steps.find(s => s.type === 'mood-board')?.options?.find(o => o.id === tag);
                  return (
                    <Badge key={tag} className={cn("flex items-center space-x-1", option?.moodColor)}>
                      {option?.icon}
                      <span>{option?.label}</span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={cn(cardStyles.base, "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50")}>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-green-800">
                Recomendações Inteligentes Ativadas! 🎯
              </h3>
              <p className="text-green-700 max-w-2xl mx-auto">
                Com base no seu perfil único, nossa IA criará recomendações personalizadas de hospedagens, 
                atividades, restaurantes e experiências que combinam perfeitamente com você.
              </p>
              <Button 
                onClick={handleComplete}
                size="lg"
                className={cn(buttonStyles.variant.gradient, "shadow-lg hover:shadow-xl")}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Ver Minhas Recomendações IA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const progressPercentage = showSummary ? 100 : ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn(cardStyles.base, "min-h-[600px] max-w-6xl mx-auto overflow-hidden")}>
      {/* Header */}
      <div className={cn(
        "h-32 relative flex items-end",
        currentStep < 2 ? "bg-gradient-to-r from-blue-600 to-cyan-600" :
        "bg-gradient-to-r from-purple-600 to-pink-600"
      )}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative p-6 w-full">
          <h1 className="text-2xl font-bold text-white">
            Personalização Inteligente ✨
          </h1>
          <p className="text-white/90 mt-1">
            Criando sua experiência única em Fernando de Noronha
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {showSummary ? "Perfil Completo!" : `Passo ${currentStep + 1} de ${steps.length}`}
          </span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Content */}
      <div ref={contentRef} className="p-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          {showSummary ? renderSummary() : renderCurrentStep()}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!showSummary && (
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button
            onClick={handleNext}
            className={cn(
              currentStep < 2 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-purple-600 hover:bg-purple-700 text-white"
            )}
          >
            {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 