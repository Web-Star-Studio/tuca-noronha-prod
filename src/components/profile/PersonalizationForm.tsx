'use client'

import { useState } from 'react'
import { Hotel, Tag, Activity, FileHeart, Gift, MapIcon, Utensils, PencilLine } from "lucide-react"
import { motion } from "framer-motion"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Preferências para personalização
const cuisineOptions = [
  { value: 'brasileira', label: 'Brasileira' },
  { value: 'italiana', label: 'Italiana' },
  { value: 'japonesa', label: 'Japonesa' },
  { value: 'vegetariana', label: 'Vegetariana' },
  { value: 'frutos_do_mar', label: 'Frutos do Mar' },
  { value: 'mediteranea', label: 'Mediterrânea' },
]

const accommodationOptions = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'pousada', label: 'Pousada' },
  { value: 'resort', label: 'Resort' },
  { value: 'casa', label: 'Casa/Apartamento' },
  { value: 'glamping', label: 'Glamping' },
]

const activityOptions = [
  { value: 'praia', label: 'Praia' },
  { value: 'trilha', label: 'Trilhas' },
  { value: 'mergulho', label: 'Mergulho' },
  { value: 'passeio_barco', label: 'Passeio de Barco' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'observacao', label: 'Observação de Vida Selvagem' },
]

const travelStyleOptions = [
  { value: 'relaxamento', label: 'Relaxamento' },
  { value: 'aventura', label: 'Aventura' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'familiar', label: 'Viagem em Família' },
  { value: 'romantico', label: 'Romântico' },
]

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
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
}

interface PreferencesType {
  cuisines: string[];
  accommodations: string[];
  activities: string[];
  travelStyles: string[];
  budget: string;
  specialRequests: string;
  [key: string]: string | string[];
}

interface PersonalizationFormProps {
  initialPreferences?: PreferencesType;
  onSave?: (preferences: PreferencesType) => void;
}

export default function PersonalizationForm({ 
  initialPreferences,
  onSave
}: PersonalizationFormProps) {
  const [preferences, setPreferences] = useState<PreferencesType>(initialPreferences || {
    cuisines: [],
    accommodations: [],
    activities: [],
    travelStyles: [],
    budget: 'medio',
    specialRequests: '',
  })

  const handlePreferenceChange = (category: string, value: string) => {
    setPreferences(prev => {
      // Se já existe o valor, remove; se não existe, adiciona
      if (Array.isArray(prev[category])) {
        if (prev[category].includes(value)) {
          return {
            ...prev,
            [category]: prev[category].filter((item) => item !== value)
          }
        }
        
        return {
          ...prev,
          [category]: [...prev[category], value]
        }
      } 
      
      return {
        ...prev,
        [category]: value
      }
    })
  }

  const handleSavePreferences = () => {
    // Aqui seria feita a chamada à API para salvar as preferências
    if (onSave) {
      onSave(preferences)
    } else {
      toast.success("Preferências salvas com sucesso!", {
        description: "Suas recomendações serão personalizadas de acordo com suas preferências."
      })
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="border-gray-100 bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <FileHeart className="h-5 w-5 text-blue-600 mr-2" />
            Personalize sua experiência
          </CardTitle>
          <CardDescription>
            Conte-nos suas preferências para que possamos recomendar experiências personalizadas para você.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Culinária */}
          <motion.div className="space-y-3" variants={itemVariants}>
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-blue-600" />
              <h3 className="text-md font-semibold">Preferências Culinárias</h3>
            </div>
            <p className="text-sm text-gray-500">Selecione até 3 tipos de culinária que você mais gosta</p>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map(option => (
                <Badge
                  key={option.value}
                  variant="outline"
                  className={`
                    cursor-pointer py-1.5 px-3 transition-all duration-200
                    ${preferences.cuisines.includes(option.value) 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}
                  `}
                  onClick={() => handlePreferenceChange('cuisines', option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </motion.div>
          
          <Separator className="opacity-70" />
          
          {/* Hospedagem */}
          <motion.div className="space-y-3" variants={itemVariants}>
            <div className="flex items-center gap-2">
              <Hotel className="h-5 w-5 text-blue-600" />
              <h3 className="text-md font-semibold">Tipos de Hospedagem</h3>
            </div>
            <p className="text-sm text-gray-500">Quais tipos de acomodação você prefere?</p>
            <div className="flex flex-wrap gap-2">
              {accommodationOptions.map(option => (
                <Badge
                  key={option.value}
                  variant="outline"
                  className={`
                    cursor-pointer py-1.5 px-3 transition-all duration-200
                    ${preferences.accommodations.includes(option.value) 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}
                  `}
                  onClick={() => handlePreferenceChange('accommodations', option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </motion.div>
          
          <Separator className="opacity-70" />
          
          {/* Atividades */}
          <motion.div className="space-y-3" variants={itemVariants}>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="text-md font-semibold">Atividades Preferidas</h3>
            </div>
            <p className="text-sm text-gray-500">Quais atividades mais interessam você?</p>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map(option => (
                <Badge
                  key={option.value}
                  variant="outline"
                  className={`
                    cursor-pointer py-1.5 px-3 transition-all duration-200
                    ${preferences.activities.includes(option.value) 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}
                  `}
                  onClick={() => handlePreferenceChange('activities', option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </motion.div>
          
          <Separator className="opacity-70" />
          
          {/* Estilo de Viagem */}
          <motion.div className="space-y-3" variants={itemVariants}>
            <div className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-md font-semibold">Estilo de Viagem</h3>
            </div>
            <p className="text-sm text-gray-500">Como você definiria seu estilo de viagem?</p>
            <div className="flex flex-wrap gap-2">
              {travelStyleOptions.map(option => (
                <Badge
                  key={option.value}
                  variant="outline"
                  className={`
                    cursor-pointer py-1.5 px-3 transition-all duration-200
                    ${preferences.travelStyles.includes(option.value) 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}
                  `}
                  onClick={() => handlePreferenceChange('travelStyles', option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </motion.div>
          
          <Separator className="opacity-70" />
          
          {/* Orçamento */}
          <motion.div className="space-y-3" variants={itemVariants}>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <h3 className="text-md font-semibold">Faixa de Orçamento</h3>
            </div>
            <p className="text-sm text-gray-500">Qual faixa de preço você normalmente busca?</p>
            <div className="max-w-xs">
              <Select 
                value={preferences.budget} 
                onValueChange={(value) => handlePreferenceChange('budget', value)}
              >
                <SelectTrigger className="border-gray-200 focus:ring-blue-400">
                  <SelectValue placeholder="Selecione uma faixa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economico">Econômico</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="luxo">Luxo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
          
          <Separator className="opacity-70" />
          
          {/* Requisitos Especiais */}
          <motion.div className="space-y-3" variants={itemVariants}>
            <div className="flex items-center gap-2">
              <PencilLine className="h-5 w-5 text-blue-600" />
              <h3 className="text-md font-semibold">Requisitos Especiais</h3>
            </div>
            <p className="text-sm text-gray-500">Alguma necessidade específica que devemos conhecer?</p>
            <textarea 
              className="w-full min-h-20 rounded-md border border-gray-200 p-3 text-sm focus:border-blue-400 focus:ring focus:ring-blue-200 transition-all"
              placeholder="Ex: Acessibilidade, restrições alimentares, preferências específicas..."
              value={preferences.specialRequests}
              onChange={(e) => handlePreferenceChange('specialRequests', e.target.value)}
            />
          </motion.div>
          
          <motion.div 
            className="pt-4" 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
          >
            <Button 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={handleSavePreferences}
            >
              <Gift className="mr-2 h-4 w-4" />
              Salvar Preferências
            </Button>
            <p className="mt-2 text-xs text-gray-500">
              Suas preferências nos ajudam a personalizar recomendações quando você visita nosso site.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}