"use client"

import { useState } from "react"
import { Send, MapPin, Calendar, Users, DollarSign, CheckCircle, Sparkles, Heart, Star, Globe, Phone, Mail, User, Briefcase, Clock, Target, Plane, Camera, Utensils, Waves, TreePine, Fish, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CitySelector } from "@/components/ui/city-selector"
import { useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { toast } from "sonner"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
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
    howDidYouHear: ""
  })

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Check if sections are completed
      const personalComplete = updated.name && updated.email && updated.phone
      const tripComplete = updated.destination && updated.startDate && updated.endDate && updated.budget && updated.groupSize
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica
    if (!formData.name || !formData.email || !formData.phone || !formData.destination ||
      !formData.startDate || !formData.endDate || !formData.budget || !formData.groupSize) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate duration in days
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const requestData = {
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          age: formData.age ? Number(formData.age) : undefined,
          occupation: formData.occupation
        },
        tripDetails: {
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
            <div
              className="h-[60vh] bg-cover bg-center filter brightness-50"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')",
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center text-white px-4"
              >
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                  Pacotes Personalizados
                </h1>
                <p className="text-xl max-w-2xl mx-auto">
                  Viagens sob medida para experiências inesquecíveis em Fernando de Noronha
                </p>
              </motion.div>
            </div>
          </section>

          {/* Success Message */}
          <section className="max-w-4xl mx-auto px-4 py-12 -mt-20 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", duration: 0.6 }}
                    className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Solicitação Enviada com Sucesso! 🎉
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                      Sua solicitação de pacote personalizado foi recebida com sucesso.
                    </p>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-8">
                      <p className="text-sm text-blue-700 mb-2 font-medium">
                        <strong>Número de acompanhamento:</strong>
                      </p>
                      <p className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                        {requestNumber}
                      </p>
                    </div>

                    <p className="text-gray-600 mb-8">
                      Nossa equipe entrará em contato em até 24 horas para discutir os detalhes do seu pacote personalizado.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900 mb-1">
                            Acompanhe sua solicitação
                          </p>
                          <p className="text-sm text-blue-700 mb-3">
                            Você pode acompanhar o status da sua solicitação a qualquer momento no seu painel pessoal.
                          </p>
                          <Link 
                            href="/meu-painel" 
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Ir para meu painel
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-all">
                        <Link href="/meu-painel">
                          <Target className="w-4 h-4 mr-2" />
                          Ver Minhas Solicitações
                        </Link>
                      </Button>
                      <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                        <Link href="/">
                          <Plane className="w-4 h-4 mr-2" />
                          Voltar ao Início
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </div>
        <Footer />
      </main>
    )
  }

  const activityOptions = [
    { id: "mergulho", label: "Mergulho/Snorkeling", icon: Fish, color: "from-blue-400 to-cyan-500" },
    { id: "trilhas", label: "Trilhas Ecológicas", icon: TreePine, color: "from-green-400 to-emerald-500" },
    { id: "barco", label: "Passeios de Barco", icon: Waves, color: "from-blue-500 to-teal-500" },
    { id: "golfinhos", label: "Observação de Golfinhos", icon: Heart, color: "from-pink-400 to-rose-500" },
    { id: "pesca", label: "Pesca Esportiva", icon: Target, color: "from-orange-400 to-red-500" },
    { id: "paddle", label: "Stand Up Paddle", icon: Waves, color: "from-cyan-400 to-blue-500" },
    { id: "fotografia", label: "Fotografia Submarina", icon: Camera, color: "from-purple-400 to-indigo-500" },
    { id: "relaxamento", label: "Relaxamento na Praia", icon: Palette, color: "from-yellow-400 to-orange-500" }
  ]

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 z-10" />
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
              className="h-[70vh] bg-cover bg-center filter brightness-60"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')",
              }}
            />
          </div>

          <div className="relative z-20 h-[70vh] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-center text-white px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", duration: 0.8 }}
              >
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Pacotes Personalizados
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
              >
                Conte-nos sobre sua viagem dos sonhos e criaremos um pacote único especialmente para você
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="max-w-5xl mx-auto px-4 py-16 -mt-16 relative z-10 mt-10">
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >

            {/* Informações Pessoais */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    Informações Pessoais
                    {completedSections.personal && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "transition-all duration-300 border-2",
                        focusedField === "name"
                          ? "border-blue-400 shadow-lg ring-4 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
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
                        "transition-all duration-300 border-2",
                        focusedField === "email"
                          ? "border-blue-400 shadow-lg ring-4 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      placeholder="seu@email.com"
                      required
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "transition-all duration-300 border-2",
                        focusedField === "phone"
                          ? "border-blue-400 shadow-lg ring-4 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
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
                        "transition-all duration-300 border-2",
                        focusedField === "age"
                          ? "border-blue-400 shadow-lg ring-4 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      placeholder="Sua idade"
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2 md:col-span-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="occupation" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Profissão
                    </Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => handleInputChange("occupation", e.target.value)}
                      onFocus={() => setFocusedField("occupation")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "transition-all duration-300 border-2",
                        focusedField === "occupation"
                          ? "border-blue-400 shadow-lg ring-4 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      placeholder="Qual sua profissão?"
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Detalhes da Viagem */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    Detalhes da Viagem
                    {completedSections.trip && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className="space-y-2"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="destination" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      🎯 Destino Principal *
                    </Label>
                    <CitySelector
                      value={formData.destination}
                      onValueChange={(value) => handleInputChange("destination", value)}
                      placeholder="Escolha qualquer cidade do Brasil..."
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      💡 Agora você pode escolher qualquer cidade do Brasil como destino!
                    </p>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="groupSize" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Número de Pessoas *
                    </Label>
                    <Select value={formData.groupSize} onValueChange={(value) => handleInputChange("groupSize", value)}>
                      <SelectTrigger className="border-2 hover:border-gray-300 transition-colors">
                        <SelectValue placeholder="Quantas pessoas?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">👤 1 pessoa</SelectItem>
                        <SelectItem value="2">👥 2 pessoas</SelectItem>
                        <SelectItem value="3">👨‍👩‍👧 3 pessoas</SelectItem>
                        <SelectItem value="4">👨‍👩‍👧‍👦 4 pessoas</SelectItem>
                        <SelectItem value="5">👨‍👩‍👧‍👦 5 pessoas</SelectItem>
                        <SelectItem value="6">👨‍👩‍👧‍👦 6+ pessoas</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Ida *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="border-2 hover:border-gray-300 transition-colors"
                      required
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Volta *
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className="border-2 hover:border-gray-300 transition-colors"
                      required
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2 md:col-span-2"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="budget" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Orçamento Total (R$) *
                    </Label>
                    <Select value={formData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
                      <SelectTrigger className="border-2 hover:border-gray-300 transition-colors">
                        <SelectValue placeholder="Selecione sua faixa de orçamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5000">💰 Até R$ 5.000</SelectItem>
                        <SelectItem value="10000">💰💰 R$ 5.000 - R$ 10.000</SelectItem>
                        <SelectItem value="20000">💰💰💰 R$ 10.000 - R$ 20.000</SelectItem>
                        <SelectItem value="30000">💰💰💰💰 R$ 20.000 - R$ 30.000</SelectItem>
                        <SelectItem value="50000">💰💰💰💰💰 R$ 30.000 - R$ 50.000</SelectItem>
                        <SelectItem value="50001">💎 Acima de R$ 50.000</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preferências */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    Suas Preferências
                    {completedSections.preferences && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      className="space-y-2"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Label htmlFor="accommodationType" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        Tipo de Hospedagem
                      </Label>
                      <Select value={formData.accommodationType} onValueChange={(value) => handleInputChange("accommodationType", value)}>
                        <SelectTrigger className="border-2 hover:border-gray-300 transition-colors">
                          <SelectValue placeholder="Selecione sua preferência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pousada-luxo">✨ Pousada de Luxo</SelectItem>
                          <SelectItem value="pousada-conforto">🏨 Pousada Confortável</SelectItem>
                          <SelectItem value="casa-aluguel">🏠 Casa de Aluguel</SelectItem>
                          <SelectItem value="resort">🏖️ Resort/Hotel</SelectItem>
                          <SelectItem value="economica">💝 Opção Econômica</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Label htmlFor="transportPreference" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Plane className="w-4 h-4" />
                        Preferência de Transporte
                      </Label>
                      <Select value={formData.transportPreference} onValueChange={(value) => handleInputChange("transportPreference", value)}>
                        <SelectTrigger className="border-2 hover:border-gray-300 transition-colors">
                          <SelectValue placeholder="Como prefere se locomover?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buggy-privado">🚗 Buggy Privado</SelectItem>
                          <SelectItem value="buggy-compartilhado">🚐 Buggy Compartilhado</SelectItem>
                          <SelectItem value="transfer-privado">🚙 Transfer Privado</SelectItem>
                          <SelectItem value="onibus-linha">🚌 Ônibus de Linha</SelectItem>
                          <SelectItem value="bicicleta">🚴 Bicicleta</SelectItem>
                          <SelectItem value="caminhada">🚶 A pé</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  </div>

                  <div>
                    <Label className="text-lg font-medium mb-6 block flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Atividades de Interesse
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {activityOptions.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index, type: "spring" }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                            formData.activities.includes(activity.label)
                              ? `bg-gradient-to-r ${activity.color} text-white border-transparent shadow-lg`
                              : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                          )}
                          onClick={() => handleActivityChange(activity.label, !formData.activities.includes(activity.label))}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <activity.icon className={cn(
                              "w-8 h-8 transition-colors",
                              formData.activities.includes(activity.label) ? "text-white" : "text-gray-600"
                            )} />
                            <span className={cn(
                              "text-sm font-medium transition-colors",
                              formData.activities.includes(activity.label) ? "text-white" : "text-gray-700"
                            )}>
                              {activity.label}
                            </span>
                          </div>
                          <AnimatePresence>
                            {formData.activities.includes(activity.label) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Label htmlFor="specialRequirements" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Solicitações Especiais
                    </Label>
                    <Textarea
                      id="specialRequirements"
                      placeholder="Conte-nos sobre suas necessidades especiais, preferências alimentares, celebrações, ou qualquer outro detalhe importante que tornará sua viagem ainda mais especial..."
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
                      onFocus={() => setFocusedField("specialRequirements")}
                      onBlur={() => setFocusedField(null)}
                      rows={4}
                      className={cn(
                        "transition-all duration-300 border-2 resize-none",
                        focusedField === "specialRequirements"
                          ? "border-blue-400 shadow-lg ring-4 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Botão de Envio */}
            <motion.div
              className="flex justify-center pt-8 max-w-[500px] mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-12 py-4 text-lg bg-blue-600 hover:bg-blue-700 border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl"
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                        />
                        Criando sua viagem dos sonhos...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="submit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center text-white"
                      >
                        <Send className="w-5 h-5 mr-3" />
                        Solicitar Pacote Personalizado
                        <Sparkles className="w-5 h-5 ml-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>

          {/* Info adicional */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link href="/meu-painel" className="text-gray-600 hover:text-gray-800 ml-1 font-medium  decoration-2 underline-offset-4 transition-colors">
              Acompanhe o status aqui ✨
            </Link>
          </motion.div>
        </section>
      </div>
      <Footer />
    </main>
  )
} 