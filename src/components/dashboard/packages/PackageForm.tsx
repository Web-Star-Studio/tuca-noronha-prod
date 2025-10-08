"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { toast } from "sonner"

interface PackageFormProps {
  package?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function PackageForm({ package: pkg, onSubmit, onCancel, isSubmitting }: PackageFormProps) {
  // Fetch data for selects

  const vehiclesQuery = useQuery(api.domains.vehicles.queries.listVehicles, {
    paginationOpts: { limit: 100 },
    organizationId: undefined // Load all vehicles for package creation
  })
  const activitiesQuery = useQuery(api.domains.activities.queries.getAll, {})
  const restaurantsQuery = useQuery(api.domains.restaurants.queries.getAll, {})
  const eventsQuery = useQuery(api.domains.events.queries.getAll, {})


  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    description_long: "",
    duration: 3,
    maxGuests: 4,
    basePrice: 0,
    discountPercentage: 0,
    currency: "BRL",

    vehicleId: "",
    includedActivityIds: [] as string[],
    includedRestaurantIds: [] as string[],
    includedEventIds: [] as string[],
    highlights: ["Vista panorâmica", "Guia especializado"] as string[],
    includes: ["Transporte", "Refeições"] as string[],
    excludes: ["Bebidas alcoólicas", "Seguro viagem"] as string[],
    itinerary: [] as Array<{
      day: number
      title: string
      description: string
      activities: string[]
    }>,
    mainImage: "",
    galleryImages: [] as string[],
    cancellationPolicy: "Cancelamento gratuito até 48h antes da viagem",
    terms: ["Documento com foto obrigatório", "Crianças menores de 12 anos pagam meia"] as string[],
    availableFromDate: "",
    availableToDate: "",
    blackoutDates: [] as string[],
    isActive: true,
    isFeatured: false,
    tags: ["natureza", "aventura"] as string[],
    category: "Aventura",
  })









  // Initialize form with existing package data
  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || "",
        slug: pkg.slug || "",
        description: pkg.description || "",
        description_long: pkg.description_long || "",
        duration: pkg.duration || 3,
        maxGuests: pkg.maxGuests || 4,
        basePrice: pkg.basePrice || 0,
        discountPercentage: pkg.discountPercentage || 0,
        currency: pkg.currency || "BRL",
        accommodationId: pkg.accommodationId || "",
        vehicleId: pkg.vehicleId || "",
        includedActivityIds: pkg.includedActivityIds || [],
        includedRestaurantIds: pkg.includedRestaurantIds || [],
        includedEventIds: pkg.includedEventIds || [],
        highlights: pkg.highlights || [],
        includes: pkg.includes || [],
        excludes: pkg.excludes || [],
        itinerary: pkg.itinerary || [],
        mainImage: pkg.mainImage || "",
        galleryImages: pkg.galleryImages || [],
        cancellationPolicy: pkg.cancellationPolicy || "",
        terms: pkg.terms || [],
        availableFromDate: pkg.availableFromDate || "",
        availableToDate: pkg.availableToDate || "",
        blackoutDates: pkg.blackoutDates || [],
        isActive: pkg.isActive ?? true,
        isFeatured: pkg.isFeatured ?? false,
        tags: pkg.tags || [],
        category: pkg.category || "Aventura",
      })
    }
  }, [pkg])

  // Generate slug from name
  useEffect(() => {
    if (formData.name && !pkg) {
      const slug = formData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, pkg])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }





  const handleMultiSelectChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[]
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] }
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) }
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.description || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    if (formData.duration < 1) {
      toast.error("A duração deve ser pelo menos 1 dia")
      return
    }

    if (formData.maxGuests < 1) {
      toast.error("O número máximo de hóspedes deve ser pelo menos 1")
      return
    }

    // Convert string IDs to proper format for submission
    const submissionData = {
      ...formData,

      vehicleId: formData.vehicleId || undefined,
    }

    onSubmit(submissionData)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const categories = [
    "Aventura", "Relaxamento", "Cultural", "Gastronômico", 
    "Romântico", "Família", "Negócios", "Eco-turismo"
  ]

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Pacote *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Aventura na Chapada Diamantina"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="aventura-chapada-diamantina"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Curta *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição breve do pacote..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_long">Descrição Completa</Label>
              <Textarea
                id="description_long"
                value={formData.description_long}
                onChange={(e) => handleInputChange("description_long", e.target.value)}
                placeholder="Descrição detalhada do pacote..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (dias) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxGuests">Máximo de Hóspedes *</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  value={formData.maxGuests}
                  onChange={(e) => handleInputChange("maxGuests", parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainImage">Imagem Principal (URL)</Label>
              <Input
                id="mainImage"
                type="url"
                value={formData.mainImage}
                onChange={(e) => handleInputChange("mainImage", e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services" className="space-y-6">


            {/* Vehicle */}
            <div className="space-y-2">
              <Label>Veículo (Opcional)</Label>
              <Select 
                value={formData.vehicleId || "none"} 
                onValueChange={(value) => handleInputChange("vehicleId", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum veículo</SelectItem>
                  {vehiclesQuery?.vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.name} - {formatPrice(vehicle.estimatedPricePerDay)}/dia
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activities */}
            <div className="space-y-2">
              <Label>Atividades Incluídas</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {activitiesQuery?.activities?.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma atividade disponível</p>
                ) : (
                  activitiesQuery?.activities?.map((activity) => (
                    <div key={activity._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`activity-${activity._id}`}
                        checked={formData.includedActivityIds.includes(activity._id)}
                        onChange={(e) => handleMultiSelectChange("includedActivityIds", activity._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`activity-${activity._id}`} className="text-sm">
                        {activity.name} - {formatPrice(activity.price)}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Restaurants */}
            <div className="space-y-2">
              <Label>Restaurantes Incluídos</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {restaurantsQuery?.restaurants?.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum restaurante disponível</p>
                ) : (
                  restaurantsQuery?.restaurants?.map((restaurant) => (
                    <div key={restaurant._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`restaurant-${restaurant._id}`}
                        checked={formData.includedRestaurantIds.includes(restaurant._id)}
                        onChange={(e) => handleMultiSelectChange("includedRestaurantIds", restaurant._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`restaurant-${restaurant._id}`} className="text-sm">
                        {restaurant.name} - {restaurant.priceRange}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Events */}
            <div className="space-y-2">
              <Label>Eventos Incluídos</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {eventsQuery?.events?.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum evento disponível</p>
                ) : (
                  eventsQuery?.events?.map((event) => (
                    <div key={event._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`event-${event._id}`}
                        checked={formData.includedEventIds.includes(event._id)}
                        onChange={(e) => handleMultiSelectChange("includedEventIds", event._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`event-${event._id}`} className="text-sm">
                        {event.name} - {formatPrice(event.price)}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Preço Base (R$)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange("basePrice", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Desconto (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange("discountPercentage", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {formData.discountPercentage > 0 && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Preço Original:</span>
                  <span>{formatPrice(formData.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span>-{formatPrice(formData.basePrice * formData.discountPercentage / 100)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Preço Final:</span>
                  <span>{formatPrice(formData.basePrice * (1 - formData.discountPercentage / 100))}</span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Availability */}
          <TabsContent value="availability" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableFromDate">Disponível A Partir De</Label>
                <Input
                  id="availableFromDate"
                  type="date"
                  value={formData.availableFromDate}
                  onChange={(e) => handleInputChange("availableFromDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableToDate">Disponível Até</Label>
                <Input
                  id="availableToDate"
                  type="date"
                  value={formData.availableToDate}
                  onChange={(e) => handleInputChange("availableToDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isActive">Pacote Ativo</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                  />
                  <span className="text-sm text-gray-600">
                    {formData.isActive ? "Visível para clientes" : "Oculto para clientes"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isFeatured">Pacote em Destaque</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
                  />
                  <span className="text-sm text-gray-600">
                    {formData.isFeatured ? "Mostrar na página inicial" : "Não destacar"}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : pkg ? "Atualizar Pacote" : "Criar Pacote"}
          </Button>
        </div>
      </form>
    </div>
  )
} 