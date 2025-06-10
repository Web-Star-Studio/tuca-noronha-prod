"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Store, 
  Building2, 
  Car, 
  Activity, 
  Calendar, 
  ArrowLeft,
  Loader2,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { RestaurantForm } from "@/components/dashboard/restaurants"
import type { Restaurant } from "@/lib/services/restaurantService"

const organizationTypes = [
  {
    value: "restaurant",
    label: "Restaurante",
    description: "Estabelecimento gastronômico com reservas de mesa",
    icon: Store
  },
  {
    value: "accommodation",
    label: "Hospedagem",
    description: "Pousadas, hotéis e acomodações",
    icon: Building2
  },
  {
    value: "rental_service",
    label: "Aluguel de Veículos",
    description: "Serviço de locação de carros e veículos",
    icon: Car
  },
  {
    value: "activity_service",
    label: "Atividades",
    description: "Promoção e organização de atividades turísticas",
    icon: Activity
  },
  {
    value: "event_service",
    label: "Eventos",
    description: "Organização e promoção de eventos",
    icon: Calendar
  }
]

export default function NovoEmpreendimentoPage() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const [step, setStep] = useState(1) // Controle de etapas
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    email: "",
    phone: "",
    website: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const createOrganization = useMutation(api.domains.rbac.mutations.createOrganization)
  const createOrganizationWithRestaurant = useMutation(api.domains.rbac.mutations.createOrganizationWithRestaurant)

  // Verificação de acesso - apenas partners e masters podem criar organizações
  if (!user || (user.role !== "partner" && user.role !== "master")) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
            <p className="text-slate-600 mb-4">Você não tem permissão para criar organizações.</p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        </div>
      </div>
    )
  }

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.type) {
      toast.error("Nome e tipo são obrigatórios")
      return
    }

    // Se for restaurante, avançar para o próximo passo
    if (formData.type === "restaurant") {
      setStep(2)
      return
    }

    // Para outros tipos, criar apenas a organização
    setIsLoading(true)

    try {
      await createOrganization({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        settings: {
          contactInfo: {
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            website: formData.website.trim() || undefined,
          }
        }
      })

      toast.success("Empreendimento criado com sucesso!")
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Erro ao criar empreendimento:", error)
      toast.error("Erro ao criar empreendimento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestaurantSubmit = async (restaurantData: Restaurant) => {
    setIsLoading(true)

    try {
      await createOrganizationWithRestaurant({
        organizationName: formData.name.trim(),
        organizationDescription: formData.description.trim() || undefined,
        organizationType: "restaurant",
        organizationSettings: {
          contactInfo: {
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            website: formData.website.trim() || undefined,
          }
        },
        restaurantData: {
          name: restaurantData.name,
          slug: restaurantData.slug,
          description: restaurantData.description,
          description_long: restaurantData.description_long,
          address: restaurantData.address,
          phone: restaurantData.phone,
          website: restaurantData.website,
          cuisine: restaurantData.cuisine,
          priceRange: restaurantData.priceRange,
          diningStyle: restaurantData.diningStyle,
          hours: restaurantData.hours,
          features: restaurantData.features,
          dressCode: restaurantData.dressCode,
          paymentOptions: restaurantData.paymentOptions,
          parkingDetails: restaurantData.parkingDetails,
          mainImage: restaurantData.mainImage,
          galleryImages: restaurantData.galleryImages,
          menuImages: restaurantData.menuImages,
          rating: restaurantData.rating,
          acceptsReservations: restaurantData.acceptsReservations,
          maximumPartySize: restaurantData.maximumPartySize,
          tags: restaurantData.tags,
          executiveChef: restaurantData.executiveChef,
          privatePartyInfo: restaurantData.privatePartyInfo,
          isActive: restaurantData.isActive,
          isFeatured: restaurantData.isFeatured,
        }
      })

      toast.success("Empreendimento e restaurante criados com sucesso!")
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Erro ao criar empreendimento:", error)
      toast.error("Erro ao criar empreendimento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedType = organizationTypes.find(type => type.value === formData.type)

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (step === 2) {
                setStep(1)
              } else {
                router.back()
              }
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 2 ? "Voltar" : "Voltar"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {step === 1 ? "Criar Novo Empreendimento" : "Configurar Restaurante"}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 
                ? "Crie um novo empreendimento para gerenciar seus ativos e colaboradores."
                : "Configure os detalhes do seu restaurante."
              }
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        {formData.type === "restaurant" && (
          <div className="flex items-center space-x-4 mb-6">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Informações Básicas</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Detalhes do Restaurante</span>
            </div>
          </div>
        )}

        {/* Step 1: Basic Organization Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Empreendimento</CardTitle>
              <CardDescription>
                Preencha as informações básicas do seu novo empreendimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Empreendimento *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Restaurante do Mar"
                    required
                  />
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Negócio *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de negócio" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview do tipo selecionado */}
                {selectedType && (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <selectedType.icon className="h-6 w-6 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{selectedType.label}</h3>
                          <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                          {selectedType.value === "restaurant" && (
                            <p className="text-sm text-blue-600 mt-1">
                              💡 Após confirmar, você configurará os detalhes específicos do restaurante
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva seu empreendimento"
                    rows={3}
                  />
                </div>

                {/* Informações de Contato */}
                <div className="space-y-4">
                  <h3 className="font-medium">Informações de Contato</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://www.exemplo.com"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : formData.type === "restaurant" ? (
                      <>
                        Próximo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      "Criar Empreendimento"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Restaurant Details (only for restaurant type) */}
        {step === 2 && formData.type === "restaurant" && (
          <Card>
            <CardHeader>
              <CardTitle>Configurar Restaurante</CardTitle>
              <CardDescription>
                Configure os detalhes específicos do seu restaurante para completar a criação do empreendimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestaurantForm
                onSubmit={handleRestaurantSubmit}
                onCancel={() => setStep(1)}
                loading={isLoading}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 