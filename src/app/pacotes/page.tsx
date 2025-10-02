"use client"

import { useState, useEffect } from "react"
import { Send, MapPin, CheckCircle, Star, User, Activity as ActivityIcon, Target, Car } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ParticipantSelector } from "@/components/ui/participant-selector"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Header from "@/components/header/Header"
import Footer from "@/components/footer/Footer"

type PackageFormData = {
  name: string;
  email: string;
  phone: string;
  age: string;
  occupation: string;
  originCity: string;
  customOriginCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  budget: string;
  groupSize: string;
  accommodationType: string;
  activities: string[];
  transportPreference: string;
  foodPreference: string;
  specialRequirements: string;
  hasSpecialNeeds: boolean;
  specialNeeds: string;
  travelExperience: string;
  howDidYouHear: string;
  flexibleDates: boolean;
  startMonth: string;
  endMonth: string;
  adults: number;
  children: number;
  includesAirfare: boolean;
}

const PENDING_PACKAGE_FORM_KEY = "packages:pending-request"

export default function PackagesPage() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [requestNumber, setRequestNumber] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [dateError, setDateError] = useState(false)
  const [completedSections, setCompletedSections] = useState({
    personal: false,
    trip: false,
    preferences: false
  })

  const createPackageRequest = useMutation(api.packages.createPackageRequest)
  
  // Buscar atividades ativas do banco de dados
  const activities = useQuery(api.activities.listActivities, { 
    isActive: true 
  })

  const [formData, setFormData] = useState<PackageFormData>({
    name: "",
    email: "",
    phone: "",
    age: "",
    occupation: "",
    originCity: "",
    customOriginCity: "",
    destination: "",
    startDate: "",
    endDate: "",
    duration: "",
    budget: "",
    groupSize: "1",
    accommodationType: "",
    activities: [] as string[],
    transportPreference: "",
    foodPreference: "",
    specialRequirements: "",
    hasSpecialNeeds: false,
    specialNeeds: "",
    travelExperience: "",
    howDidYouHear: "",
    flexibleDates: false,
    startMonth: "",
    endMonth: "",
    adults: 1,
    children: 0,
    includesAirfare: false
  })

  const updateCompletionState = (data: PackageFormData) => {
    const personalComplete = data.name && data.email && data.phone
    const tripDatesComplete = data.flexibleDates 
      ? (data.startMonth && data.endMonth)
      : (data.startDate && data.endDate && !dateError)
    const tripComplete = tripDatesComplete && data.budget && data.groupSize
    const preferencesComplete = data.accommodationType || data.activities.length > 0

    setCompletedSections({
      personal: Boolean(personalComplete),
      trip: Boolean(tripComplete),
      preferences: Boolean(preferencesComplete)
    })
  }

  const mergeStoredFormData = (prev: PackageFormData, stored: Partial<PackageFormData>): PackageFormData => {
    const restoredAdults = typeof stored.adults === "number" ? stored.adults : prev.adults
    const restoredChildren = typeof stored.children === "number" ? stored.children : prev.children
    const restoredTotal = restoredAdults + restoredChildren
    const restoredGroupSize = typeof stored.groupSize === "string" && stored.groupSize
      ? stored.groupSize
      : restoredTotal > 0
        ? String(restoredTotal)
        : prev.groupSize

    return {
      ...prev,
      name: typeof stored.name === "string" ? stored.name : prev.name,
      email: typeof stored.email === "string" ? stored.email : prev.email,
      phone: typeof stored.phone === "string" ? stored.phone : prev.phone,
      age: typeof stored.age === "string" ? stored.age : prev.age,
      occupation: typeof stored.occupation === "string" ? stored.occupation : prev.occupation,
      originCity: typeof stored.originCity === "string" ? stored.originCity : prev.originCity,
      customOriginCity: typeof stored.customOriginCity === "string" ? stored.customOriginCity : prev.customOriginCity,
      destination: typeof stored.destination === "string" ? stored.destination : prev.destination,
      startDate: typeof stored.startDate === "string" ? stored.startDate : prev.startDate,
      endDate: typeof stored.endDate === "string" ? stored.endDate : prev.endDate,
      duration: typeof stored.duration === "string" ? stored.duration : prev.duration,
      budget: typeof stored.budget === "string" ? stored.budget : prev.budget,
      groupSize: restoredGroupSize,
      accommodationType: typeof stored.accommodationType === "string" ? stored.accommodationType : prev.accommodationType,
      activities: Array.isArray(stored.activities)
        ? stored.activities.filter((activity): activity is string => typeof activity === "string")
        : prev.activities,
      transportPreference: typeof stored.transportPreference === "string" ? stored.transportPreference : prev.transportPreference,
      foodPreference: typeof stored.foodPreference === "string" ? stored.foodPreference : prev.foodPreference,
      specialRequirements: typeof stored.specialRequirements === "string" ? stored.specialRequirements : prev.specialRequirements,
      hasSpecialNeeds: typeof stored.hasSpecialNeeds === "boolean" ? stored.hasSpecialNeeds : prev.hasSpecialNeeds,
      specialNeeds: typeof stored.specialNeeds === "string" ? stored.specialNeeds : prev.specialNeeds,
      travelExperience: typeof stored.travelExperience === "string" ? stored.travelExperience : prev.travelExperience,
      howDidYouHear: typeof stored.howDidYouHear === "string" ? stored.howDidYouHear : prev.howDidYouHear,
      flexibleDates: typeof stored.flexibleDates === "boolean" ? stored.flexibleDates : prev.flexibleDates,
      startMonth: typeof stored.startMonth === "string" ? stored.startMonth : prev.startMonth,
      endMonth: typeof stored.endMonth === "string" ? stored.endMonth : prev.endMonth,
      adults: restoredAdults,
      children: restoredChildren,
      includesAirfare: typeof stored.includesAirfare === "boolean" ? stored.includesAirfare : prev.includesAirfare,
    }
  }

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return

    const storedForm = sessionStorage.getItem(PENDING_PACKAGE_FORM_KEY)
    if (!storedForm) return

    try {
      const parsed = JSON.parse(storedForm) as Partial<PackageFormData>
      setFormData(prev => {
        const updated = mergeStoredFormData(prev, parsed)
        updateCompletionState(updated)
        return updated
      })
    } catch (error) {
      console.error("Erro ao carregar solicitação de pacote salva:", error)
    }
  }, [isLoaded])

  // Verificar se as datas são válidas sempre que mudarem
  useEffect(() => {
    if (formData.startDate && formData.endDate && !formData.flexibleDates) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      
      if (endDate <= startDate) {
        setDateError(true)
        toast.error("A data de volta não pode ser anterior ou igual à data de ida")
      } else {
        setDateError(false)
      }
    } else {
      setDateError(false)
    }
  }, [formData.startDate, formData.endDate, formData.flexibleDates])

  const handleInputChange = (
    field: keyof PackageFormData,
    value: PackageFormData[keyof PackageFormData]
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value } as PackageFormData
      updateCompletionState(updated)
      return updated
    })
  }

  const handleActivityChange = (activity: string, checked: boolean) => {
    setFormData(prev => {
      const activities = checked
        ? [...prev.activities, activity]
        : prev.activities.filter(a => a !== activity)
      const updated: PackageFormData = { ...prev, activities }
      updateCompletionState(updated)
      return updated
    })
  }

  const handleParticipantsChange = (type: "adults" | "children", value: number) => {
    const sanitizedValue = Math.max(0, value)

    setFormData(prev => {
      const newAdults = type === "adults" ? sanitizedValue : prev.adults
      const newChildren = type === "children" ? sanitizedValue : prev.children
      const totalParticipants = newAdults + newChildren

      const updated: PackageFormData = {
        ...prev,
        adults: newAdults,
        children: newChildren,
        groupSize: totalParticipants > 0 ? String(totalParticipants) : ""
      }

      updateCompletionState(updated)
      return updated
    })
  }

  // Função para calcular data mínima para volta (1 dia após ida)
  const getMinEndDate = () => {
    if (!formData.startDate) return ""
    const startDate = new Date(formData.startDate)
    startDate.setDate(startDate.getDate() + 1)
    return startDate.toISOString().split('T')[0]
  }

  // Função para resetar data de volta se ela for anterior à ida
  const handleStartDateChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, startDate: value }
      
      // Se há data de volta e ela é anterior à nova data de ida + 1 dia, resetar
      if (prev.endDate && value) {
        const startDate = new Date(value)
        const endDate = new Date(prev.endDate)
        startDate.setDate(startDate.getDate() + 1)
        
        if (endDate < startDate) {
          newData.endDate = ""
        }
      }
      
      updateCompletionState(newData)
      return newData
    })
  }

  // Função para validar data de volta
  const handleEndDateChange = (value: string) => {
    if (formData.startDate && value) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(value)
      
      if (endDate <= startDate) {
        toast.error("A data de volta deve ser posterior à data de ida")
        return
      }
    }
    
    handleInputChange("endDate", value)
  }

  // Gerar opções de meses para datas flexíveis
  const getMonthOptions = () => {
    const months: { label: string; value: string }[] = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthYear = date.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      })
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.push({ label: monthYear, value })
    }
    return months
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) {
      toast.info("Estamos quase lá! Tente enviar novamente em instantes.")
      return
    }

    // Validação básica
    const datesValid = formData.flexibleDates 
      ? (formData.startMonth && formData.endMonth)
      : (formData.startDate && formData.endDate && !dateError)
      
    if (!formData.name || !formData.email || !formData.phone ||
      !datesValid || !formData.budget || !formData.groupSize) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    // Validação adicional para datas não flexíveis
    if (!formData.flexibleDates && dateError) {
      toast.error("A data de volta não pode ser anterior ou igual à data de ida")
      return
    }

    if (!userId) {
      try {
        const serializableForm: PackageFormData = {
          ...formData,
          activities: [...formData.activities],
        }
        sessionStorage.setItem(PENDING_PACKAGE_FORM_KEY, JSON.stringify(serializableForm))
      } catch (error) {
        console.error("Erro ao salvar solicitação antes do cadastro:", error)
      }

      toast.info("Crie sua conta para concluir o envio da cotação")
      router.push("/sign-up?redirect_url=/pacotes")
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate duration in days
      let durationInDays = 7; // Default for flexible dates
      
      if (!formData.flexibleDates && formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const requestData = {
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          age: formData.age ? Number(formData.age) : undefined,
          occupation: formData.occupation
        },
        tripDetails: {
          destination: "fernando-de-noronha", // Always Fernando de Noronha
          originCity: formData.originCity === "outras" ? formData.customOriginCity : formData.originCity || undefined,
          startDate: formData.flexibleDates ? undefined : formData.startDate,
          endDate: formData.flexibleDates ? undefined : formData.endDate,
          startMonth: formData.flexibleDates ? formData.startMonth : undefined,
          endMonth: formData.flexibleDates ? formData.endMonth : undefined,
          flexibleDates: formData.flexibleDates,
          duration: durationInDays,
          groupSize: Number(formData.groupSize),
          companions: "family", // Default, can be made dynamic
          budget: Number(formData.budget),
          budgetFlexibility: "somewhat_flexible", // Default, can be made dynamic
          includesAirfare: formData.includesAirfare
        },
        preferences: {
          accommodationType: formData.accommodationType ? [formData.accommodationType] : [],
          activities: formData.activities,
          transportation: formData.transportPreference ? [formData.transportPreference] : [],
          foodPreferences: formData.foodPreference ? [formData.foodPreference] : [],
          accessibility: formData.hasSpecialNeeds && formData.specialNeeds ? [formData.specialNeeds] : undefined
        },
        specialRequirements: formData.specialRequirements || undefined,
        previousExperience: formData.travelExperience || undefined,
        expectedHighlights: formData.howDidYouHear || undefined
      };

      const result = await createPackageRequest(requestData);

      setRequestNumber(result.requestNumber)
      setIsSubmitted(true)
      toast.success("Solicitação enviada com sucesso!")
      sessionStorage.removeItem(PENDING_PACKAGE_FORM_KEY)

    } catch (error) {
      console.error("Erro ao enviar solicitação:", error)
      toast.error("Erro ao enviar solicitação. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verificar se o formulário está válido
  const isFormValid = () => {
    const datesValid = formData.flexibleDates 
      ? (formData.startMonth && formData.endMonth)
      : (formData.startDate && formData.endDate && !dateError)
      
    return formData.name && formData.email && formData.phone &&
      datesValid && formData.budget && formData.groupSize && !dateError
  }

  if (isSubmitted) {
    return (
      <main className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
        <Header />
        <div className="min-h-screen bg-gray-50">
          {/* Hero Section - Success */}
          <section className="relative overflow-hidden">
            <div
              className="h-[40vh] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')",
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Solicitação Enviada!
                </h1>
                <p className="text-lg max-w-2xl mx-auto">
                  Sua viagem dos sonhos está sendo preparada
                </p>
              </div>
            </div>
          </section>

          {/* Success Content */}
          <section className="max-w-3xl mx-auto px-4 py-12 -mt-16 relative z-10">
            <Card className="bg-white shadow-lg border border-gray-200 rounded-lg">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Obrigado! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Sua solicitação de pacote personalizado foi recebida com sucesso.
                </p>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                  <p className="text-sm text-blue-700 mb-1 font-medium">
                    Número de acompanhamento:
                  </p>
                  <p className="text-xl font-mono font-bold text-blue-900">
                    {requestNumber}
                  </p>
                </div>

                <p className="text-gray-600 mb-8 text-sm">
                  Nossa equipe entrará em contato em até 24 horas para discutir os detalhes.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild variant="outline" className="border-gray-200">
                    <Link href="/meu-painel">
                      <Target className="w-4 h-4 mr-2" />
                      Acompanhar Solicitação
                    </Link>
                  </Button>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/">
                      <Car className="w-4 h-4 mr-2" />
                      Voltar ao Início
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
        <Footer />
      </main>
    )
  }

  // Transformar atividades do Convex em opções para o formulário
  const activityOptions = activities?.map(activity => ({
    id: activity._id,
    label: activity.title,
    icon: ActivityIcon, // Ícone padrão para todas as atividades
    description: activity.shortDescription || activity.description?.slice(0, 150) + '...' || 'Atividade em Fernando de Noronha'
  })) || []

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <div className="min-h-screen bg-white">
        {/* Hero Section - Fernando de Noronha */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')",
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          
          <div className="relative z-10 py-24 md:py-32">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/20">
                <MapPin className="w-4 h-4 text-white mr-2" />
                <span className="text-sm text-white font-medium">Fernando de Noronha</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
                Sua viagem para
                <span className="block text-blue-200">Fernando de Noronha</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Criamos experiências personalizadas para o paraíso natural brasileiro. 
                Conte-nos suas preferências e transformaremos seus sonhos em realidade.
              </p>
              
              <div className="flex items-center justify-center space-x-6 text-white/80 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Roteiros exclusivos</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Experiências únicas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section - Clean & Minimal */}
        <section className="max-w-4xl mx-auto px-4 py-12 -mt-16 relative z-20">
          
          <form onSubmit={handleSubmit} className="space-y-8 mt-20">

            {/* Informações Pessoais */}
            <Card className="bg-white shadow-lg border border-gray-200 rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Informações Pessoais</h3>
                    <p className="text-sm text-gray-500 font-normal">Conte-nos quem você é</p>
                  </div>
                  {completedSections.personal && (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-gray-600">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "border-gray-200 focus:border-blue-400 transition-colors",
                      focusedField === "name" ? "border-blue-400 ring-1 ring-blue-100" : ""
                    )}
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-600">
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "border-gray-200 focus:border-blue-400 transition-colors",
                      focusedField === "email" ? "border-blue-400 ring-1 ring-blue-100" : ""
                    )}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-gray-600">
                    Telefone *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "border-gray-200 focus:border-blue-400 transition-colors",
                      focusedField === "phone" ? "border-blue-400 ring-1 ring-blue-100" : ""
                    )}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm text-gray-600">
                    Idade
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    onFocus={() => setFocusedField("age")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "border-gray-200 focus:border-blue-400 transition-colors",
                      focusedField === "age" ? "border-blue-400 ring-1 ring-blue-100" : ""
                    )}
                    placeholder="Sua idade"
                  />
                </div>
                            </CardContent>
            </Card>

            {/* Detalhes da Viagem */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Detalhes da Viagem</h3>
                    <p className="text-sm text-gray-500 font-normal">Quando e para onde vamos?</p>
                  </div>
                  {completedSections.trip && (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="originCity" className="text-sm text-gray-600">
                    Cidade de Origem
                  </Label>
                  <Select value={formData.originCity} onValueChange={(value) => {
                    handleInputChange("originCity", value)
                    if (value !== "outras") {
                      handleInputChange("customOriginCity", "")
                    }
                  }}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-400">
                      <SelectValue placeholder="De onde você sairá?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sao-paulo-sp">🏙️ São Paulo - SP</SelectItem>
                      <SelectItem value="rio-de-janeiro-rj">🌊 Rio de Janeiro - RJ</SelectItem>
                      <SelectItem value="belo-horizonte-mg">⛰️ Belo Horizonte - MG</SelectItem>
                      <SelectItem value="brasilia-df">🏛️ Brasília - DF</SelectItem>
                      <SelectItem value="salvador-ba">🥥 Salvador - BA</SelectItem>
                      <SelectItem value="fortaleza-ce">🌞 Fortaleza - CE</SelectItem>
                      <SelectItem value="recife-pe">🐠 Recife - PE</SelectItem>
                      <SelectItem value="porto-alegre-rs">🍃 Porto Alegre - RS</SelectItem>
                      <SelectItem value="curitiba-pr">🌲 Curitiba - PR</SelectItem>
                      <SelectItem value="manaus-am">🌳 Manaus - AM</SelectItem>
                      <SelectItem value="belem-pa">🦜 Belém - PA</SelectItem>
                      <SelectItem value="goiania-go">🌾 Goiânia - GO</SelectItem>
                      <SelectItem value="campinas-sp">🏭 Campinas - SP</SelectItem>
                      <SelectItem value="sao-luis-ma">🏰 São Luís - MA</SelectItem>
                      <SelectItem value="maceio-al">🏝️ Maceió - AL</SelectItem>
                      <SelectItem value="natal-rn">🦀 Natal - RN</SelectItem>
                      <SelectItem value="teresina-pi">🌵 Teresina - PI</SelectItem>
                      <SelectItem value="campo-grande-ms">🐂 Campo Grande - MS</SelectItem>
                      <SelectItem value="joao-pessoa-pb">🌊 João Pessoa - PB</SelectItem>
                      <SelectItem value="aracaju-se">🦐 Aracaju - SE</SelectItem>
                      <SelectItem value="cuiaba-mt">🦎 Cuiabá - MT</SelectItem>
                      <SelectItem value="vitoria-es">⛵ Vitória - ES</SelectItem>
                      <SelectItem value="florianopolis-sc">🏄 Florianópolis - SC</SelectItem>
                      <SelectItem value="palmas-to">🌻 Palmas - TO</SelectItem>
                      <SelectItem value="macapa-ap">🌺 Macapá - AP</SelectItem>
                      <SelectItem value="rio-branco-ac">🌿 Rio Branco - AC</SelectItem>
                      <SelectItem value="boa-vista-rr">🦋 Boa Vista - RR</SelectItem>
                      <SelectItem value="porto-velho-ro">🐟 Porto Velho - RO</SelectItem>
                      <SelectItem value="outras">📍 Outra cidade</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {formData.originCity === "outras" && (
                    <div className="mt-3">
                      <Input
                        id="customOriginCity"
                        value={formData.customOriginCity}
                        onChange={(e) => handleInputChange("customOriginCity", e.target.value)}
                        onFocus={() => setFocusedField("customOriginCity")}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "border-gray-200 focus:border-blue-400 transition-colors",
                          focusedField === "customOriginCity" ? "border-blue-400 ring-1 ring-blue-100" : ""
                        )}
                        placeholder="Digite o nome da sua cidade"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    Destino
                  </Label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        🏝️
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Fernando de Noronha - PE</p>
                        <p className="text-sm text-blue-600">Paraíso natural brasileiro</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <ParticipantSelector
                    adults={formData.adults}
                    childrenCount={formData.children}
                    onAdultsChange={(value) => handleParticipantsChange("adults", value)}
                    onChildrenChange={(value) => handleParticipantsChange("children", value)}
                    minAdults={1}
                    maxAdults={20}
                    maxChildren={10}
                    minTotal={1}
                    maxTotal={30}
                    title="Número de Participantes *"
                    showSummary={false}
                    showLimits={false}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                  <div>
                    <Label className="text-sm text-gray-700 font-medium">
                      Precisa de passagens aéreas?
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Marque se deseja que cuidemos dos voos no orçamento do pacote.
                    </p>
                  </div>
                  <Switch
                    checked={formData.includesAirfare}
                    onCheckedChange={(checked) => handleInputChange("includesAirfare", checked)}
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <Label className="text-sm text-gray-700 font-medium">
                        Datas Flexíveis
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Escolha meses ao invés de datas específicas
                      </p>
                    </div>
                    <Switch
                      checked={formData.flexibleDates}
                      onCheckedChange={(checked) => handleInputChange("flexibleDates", checked)}
                    />
                  </div>

                  {!formData.flexibleDates ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-sm text-gray-600">
                          Data de Ida *
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="border-gray-200 focus:border-blue-400"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-sm text-gray-600">
                          Data de Volta *
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                          min={getMinEndDate()}
                          className={cn(
                            "transition-colors",
                            dateError 
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100" 
                              : "border-gray-200 focus:border-blue-400"
                          )}
                          required
                          disabled={!formData.startDate}
                        />
                        {!formData.startDate && (
                          <p className="text-xs text-gray-400">
                            Selecione a data de ida primeiro
                          </p>
                        )}
                        {dateError && formData.startDate && formData.endDate && (
                          <p className="text-xs text-red-600 mt-1">
                            A data de volta deve ser posterior à data de ida
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startMonth" className="text-sm text-gray-600">
                          Mês de Ida *
                        </Label>
                        <Select 
                          value={formData.startMonth} 
                          onValueChange={(value) => handleInputChange("startMonth", value)}
                        >
                          <SelectTrigger className="border-gray-200 focus:border-blue-400">
                            <SelectValue placeholder="Escolha o mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {getMonthOptions().map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endMonth" className="text-sm text-gray-600">
                          Mês de Volta *
                        </Label>
                        <Select 
                          value={formData.endMonth} 
                          onValueChange={(value) => handleInputChange("endMonth", value)}
                        >
                          <SelectTrigger className="border-gray-200 focus:border-blue-400">
                            <SelectValue placeholder="Escolha o mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {getMonthOptions()
                              .filter(month => !formData.startMonth || month.value >= formData.startMonth)
                              .map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {!formData.startMonth && (
                          <p className="text-xs text-gray-400">
                            Selecione o mês de ida primeiro
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="budget" className="text-sm text-gray-600">
                    Orçamento Total (R$) *
                  </Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-400">
                      <SelectValue placeholder="Selecione sua faixa de orçamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5000">Até R$ 5.000</SelectItem>
                      <SelectItem value="10000">R$ 5.000 - R$ 10.000</SelectItem>
                      <SelectItem value="20000">R$ 10.000 - R$ 20.000</SelectItem>
                      <SelectItem value="30000">R$ 20.000 - R$ 30.000</SelectItem>
                      <SelectItem value="50000">R$ 30.000 - R$ 50.000</SelectItem>
                      <SelectItem value="50001">Acima de R$ 50.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                                              </CardContent>
              </Card>

            {/* Preferências */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Suas Preferências</h3>
                    <p className="text-sm text-gray-500 font-normal">O que você gostaria de fazer?</p>
                  </div>
                  {completedSections.preferences && (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accommodationType" className="text-sm text-gray-600">
                      Tipo de Hospedagem
                    </Label>
                    <Select value={formData.accommodationType} onValueChange={(value) => handleInputChange("accommodationType", value)}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-400">
                        <SelectValue placeholder="Selecione sua preferência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples">Simples</SelectItem>
                        <SelectItem value="economica">Econômica</SelectItem>
                        <SelectItem value="intermediaria">Intermediária</SelectItem>
                        <SelectItem value="luxo">Luxo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transportPreference" className="text-sm text-gray-600">
                      Tipo de Transporte
                    </Label>
                    <Select value={formData.transportPreference} onValueChange={(value) => handleInputChange("transportPreference", value)}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-400">
                        <SelectValue placeholder="Como prefere se locomover?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer-privado">Transfer privado</SelectItem>
                        <SelectItem value="aluguel-carro">Aluguel de carro</SelectItem>
                        <SelectItem value="aluguel-buggy">Aluguel de buggy</SelectItem>
                        <SelectItem value="aluguel-moto">Aluguel de moto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600 mb-4 block">
                    Atividades de Interesse {activities === undefined && <span className="text-xs text-gray-400">(Carregando...)</span>}
                  </Label>
                  
                  {activityOptions.length === 0 && activities !== undefined && (
                    <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      Nenhuma atividade disponível no momento. Nossa equipe entrará em contato para apresentar as opções.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activityOptions.map((activity) => (
                      <div
                        key={activity.id}
                        className={cn(
                          "relative p-3 rounded-lg border cursor-pointer",
                          formData.activities.includes(activity.label)
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => handleActivityChange(activity.label, !formData.activities.includes(activity.label))}
                      >
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <activity.icon className={cn(
                              "w-4 h-4",
                              formData.activities.includes(activity.label) ? "text-blue-600" : "text-gray-500"
                            )} />
                            <span className={cn(
                              "text-sm font-medium",
                              formData.activities.includes(activity.label) ? "text-blue-700" : "text-gray-700"
                            )}>
                              {activity.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {activity.description}
                          </p>
                        </div>
                        {formData.activities.includes(activity.label) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequirements" className="text-sm text-gray-600">
                    Solicitações Especiais
                  </Label>
                  <Textarea
                    id="specialRequirements"
                    placeholder="Conte-nos sobre suas necessidades especiais, preferências alimentares, celebrações, ou qualquer detalhe que tornará sua viagem ainda mais especial..."
                    value={formData.specialRequirements}
                    onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
                    onFocus={() => setFocusedField("specialRequirements")}
                    onBlur={() => setFocusedField(null)}
                    rows={4}
                    className={cn(
                      "border-gray-200 focus:border-blue-400 resize-none transition-colors",
                      focusedField === "specialRequirements" ? "border-blue-400 ring-1 ring-blue-100" : ""
                    )}
                  />
                </div>
                              </CardContent>
              </Card>

            {/* Botão de Envio */}
            <div className="flex flex-col items-center gap-3 pt-6">
              {dateError && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    A data de volta deve ser posterior à data de ida
                  </span>
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !isFormValid()}
                className={cn(
                  "px-8 py-3 text-white rounded-lg font-medium transition-all duration-200",
                  isFormValid() && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    : "bg-gray-400 cursor-not-allowed opacity-60"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Solicitar Cotação Personalizada
                  </div>
                )}
              </Button>
            </div>
          </form>

                      {/* Info adicional */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center px-6 py-3 bg-blue-50 rounded-lg border border-blue-100">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                <p className="text-sm text-blue-700">
                  Nossa equipe entrará em contato em até 24 horas
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                <Link href="/meu-painel" className="text-blue-600 hover:text-blue-700 font-medium">
                  Acompanhe o status da sua solicitação
                </Link>
              </p>
            </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
