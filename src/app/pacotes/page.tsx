"use client"

import { useState } from "react"
import { Send, MapPin, Calendar, Users, DollarSign, CheckCircle, Sparkles, Heart, Star, Globe, Phone, Mail, User, Briefcase, Clock, Target, Car, Camera, Utensils, Waves, TreePine, Fish, Palette, Bike, Sunset, Ship, Sun, Zap, Mountain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Header from "@/components/header/Header"
import Footer from "@/components/footer/Footer"

export default function PackagesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [requestNumber, setRequestNumber] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [completedSections, setCompletedSections] = useState({
    personal: false,
    trip: false,
    preferences: false
  })

  const createPackageRequest = useMutation(api.packages.createPackageRequest)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    occupation: "",
    originCity: "",
    destination: "",
    startDate: "",
    endDate: "",
    duration: "",
    budget: "",
    groupSize: "",
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
    endMonth: ""
  })

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Check if sections are completed
      const personalComplete = updated.name && updated.email && updated.phone
      const tripDatesComplete = updated.flexibleDates 
        ? (updated.startMonth && updated.endMonth)
        : (updated.startDate && updated.endDate)
      const tripComplete = tripDatesComplete && updated.budget && updated.groupSize
      const preferencesComplete = updated.accommodationType || updated.activities.length > 0

      setCompletedSections({
        personal: Boolean(personalComplete),
        trip: Boolean(tripComplete),
        preferences: Boolean(preferencesComplete)
      })

      return updated
    })
  }

  const handleActivityChange = (activity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      activities: checked
        ? [...prev.activities, activity]
        : prev.activities.filter(a => a !== activity)
    }))
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
      
      return newData
    })
  }

  // Gerar opções de meses para datas flexíveis
  const getMonthOptions = () => {
    const months = []
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

    // Validação básica
    const datesValid = formData.flexibleDates 
      ? (formData.startMonth && formData.endMonth)
      : (formData.startDate && formData.endDate)
      
    if (!formData.name || !formData.email || !formData.phone ||
      !datesValid || !formData.budget || !formData.groupSize) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
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
          originCity: formData.originCity || undefined,
          startDate: formData.flexibleDates ? undefined : formData.startDate,
          endDate: formData.flexibleDates ? undefined : formData.endDate,
          startMonth: formData.flexibleDates ? formData.startMonth : undefined,
          endMonth: formData.flexibleDates ? formData.endMonth : undefined,
          flexibleDates: formData.flexibleDates,
          duration: durationInDays,
          groupSize: Number(formData.groupSize),
          companions: "family", // Default, can be made dynamic
          budget: Number(formData.budget),
          budgetFlexibility: "somewhat_flexible" // Default, can be made dynamic
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

    } catch (error) {
      console.error("Erro ao enviar solicitação:", error)
      toast.error("Erro ao enviar solicitação. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
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
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
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

  // Atividades atualizadas conforme solicitação
  const activityOptions = [
    { 
      id: "bicicleta-aquatica", 
      label: "Bicicleta aquática", 
      icon: Bike, 
      description: "Pedale sobre as águas cristalinas. Duração: 1h | Horário: 8h às 17h | Máx: 4 pessoas | Inclui: equipamento e instrutor"
    },
    { 
      id: "entardecer", 
      label: "Entardecer", 
      icon: Sunset, 
      description: "Contemple o pôr do sol mais belo. Duração: 2h | Horário: 16h às 18h | Máx: 15 pessoas | Inclui: transporte e bebida"
    },
    { 
      id: "entardecer-privativo", 
      label: "Entardecer privativo", 
      icon: Sun, 
      description: "Entardecer exclusivo para você. Duração: 2h | Horário: 16h às 18h | Máx: 6 pessoas | Inclui: jantar, bebidas e fotógrafo"
    },
    { 
      id: "barco-regular", 
      label: "Passeio de barco regular", 
      icon: Ship, 
      description: "Explore as praias em grupo. Duração: 6h | Horário: 9h às 15h | Máx: 20 pessoas | Inclui: almoço, bebidas e snorkel"
    },
    { 
      id: "barco-privativo", 
      label: "Passeio de barco privativo", 
      icon: Waves, 
      description: "Barco exclusivo para seu grupo. Duração: 8h | Horário: 8h às 16h | Máx: 12 pessoas | Inclui: capitão, almoço gourmet, bebidas premium"
    },
    { 
      id: "ilhatour-regular", 
      label: "Ilhatour regular", 
      icon: MapPin, 
      description: "Conheça as principais ilhas. Duração: 8h | Horário: 7h às 15h | Máx: 25 pessoas | Inclui: transporte, almoço e guia"
    },
    { 
      id: "ilhatour-privativo", 
      label: "Ilhatour privativo", 
      icon: Target, 
      description: "Tour personalizado pelas ilhas. Duração: 10h | Horário: 7h às 17h | Máx: 8 pessoas | Inclui: guia exclusivo, refeições premium"
    },
    { 
      id: "canoa-havaiana", 
      label: "Canoa havaiana", 
      icon: Zap, 
      description: "Remada em equipe tradicional. Duração: 1h30 | Horário: 8h às 16h | Máx: 6 pessoas | Inclui: equipamento e instrutor certificado"
    },
    { 
      id: "trilhas", 
      label: "Trilhas", 
      icon: Mountain, 
      description: "Trilha do Pico (3h, difícil), Trilha dos Golfinhos (2h, médio), Trilha da Praia (1h, fácil) | Inclui: guia e equipamentos"
    },
    { 
      id: "pesca", 
      label: "Pesca", 
      icon: Fish, 
      description: "Barco Fishing 35 pés. Duração: 4h | Horário: 6h ou 14h | Máx: 6 pessoas | Inclui: equipamentos, isca, bebidas e lanche"
    },
    { 
      id: "relaxamento-praia", 
      label: "Relaxamento na praia", 
      icon: Palette, 
      description: "Day use com conforto total. Duração: dia todo | Horário: 9h às 17h | Inclui: cadeiras, guarda-sol, bebidas e massagem"
    },
    { 
      id: "mergulho-batismo", 
      label: "Mergulho batismo", 
      icon: Fish, 
      description: "Primeira experiência de mergulho. Duração: 3h | Horário: 8h ou 14h | Máx: 4 pessoas | Inclui: instrutor, equipamentos e certificado"
    },
    { 
      id: "mergulho-snorkel", 
      label: "Mergulho snorkel", 
      icon: Waves, 
      description: "Explore a vida marinha na superfície. Duração: 2h | Horário: 9h às 16h | Máx: 8 pessoas | Inclui: equipamentos e guia marinho"
    }
  ]

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
                  <span>Suporte 24h</span>
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
                <div className="space-y-2">
                  <Label htmlFor="originCity" className="text-sm text-gray-600">
                    Cidade de Origem
                  </Label>
                  <Select value={formData.originCity} onValueChange={(value) => handleInputChange("originCity", value)}>
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

                <div className="space-y-2">
                  <Label htmlFor="groupSize" className="text-sm text-gray-600">
                    Número de Pessoas *
                  </Label>
                  <Select value={formData.groupSize} onValueChange={(value) => handleInputChange("groupSize", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-400">
                      <SelectValue placeholder="Quantas pessoas?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 pessoa</SelectItem>
                      <SelectItem value="2">2 pessoas</SelectItem>
                      <SelectItem value="3">3 pessoas</SelectItem>
                      <SelectItem value="4">4 pessoas</SelectItem>
                      <SelectItem value="5">5 pessoas</SelectItem>
                      <SelectItem value="6">6+ pessoas</SelectItem>
                    </SelectContent>
                  </Select>
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
                          onChange={(e) => handleInputChange("endDate", e.target.value)}
                          min={getMinEndDate()}
                          className="border-gray-200 focus:border-blue-400"
                          required
                          disabled={!formData.startDate}
                        />
                        {!formData.startDate && (
                          <p className="text-xs text-gray-400">
                            Selecione a data de ida primeiro
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
                        <SelectItem value="categoria-turistica">Categoria turística</SelectItem>
                        <SelectItem value="categoria-intermediaria">Categoria intermediária</SelectItem>
                        <SelectItem value="categoria-intermediaria-2">Categoria intermediária 2</SelectItem>
                        <SelectItem value="categoria-luxo">Categoria luxo</SelectItem>
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
                        <SelectItem value="transfer-regular">Transfer regular/compartilhado</SelectItem>
                        <SelectItem value="aluguel-carro">Aluguel de carro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600 mb-4 block">
                    Atividades de Interesse
                  </Label>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activityOptions.map((activity, index) => (
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
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Solicitar Pacote Personalizado
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