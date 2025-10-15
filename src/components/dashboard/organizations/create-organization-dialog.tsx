"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Store, Building2, Car, Activity, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"

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

interface CreateOrganizationDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function CreateOrganizationDialog({ children, onSuccess }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
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
  const { user } = useCurrentUser()

  // Verificação de acesso - apenas partners e masters podem criar organizações
  if (!user || (user.role !== "partner" && user.role !== "master")) {
    return null; // Não renderiza o componente se o usuário não tem permissão
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.type) {
      toast.error("Nome e tipo são obrigatórios")
      return
    }

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

      toast.success("Organização criada com sucesso!")
      setFormData({
        name: "",
        description: "",
        type: "",
        email: "",
        phone: "",
        website: "",
      })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao criar organização:", error)
      toast.error("Erro ao criar organização. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedType = organizationTypes.find(type => type.value === formData.type)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Organização
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Organização</DialogTitle>
            <DialogDescription>
              Crie um novo empreendimento para gerenciar seus ativos e colaboradores.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Restaurante do Mar"
                required
              />
            </div>

            <div className="grid gap-2">
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
                        <div className="flex items-center gap-2">
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

            {selectedType && (
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={`Descreva seu ${selectedType.label.toLowerCase()}`}
                  rows={3}
                />
              </div>
            )}

            <div className="grid gap-3">
              <Label>Informações de Contato (Opcional)</Label>
              <div className="grid gap-2">
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  type="email"
                />
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  type="tel"
                />
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://meusite.com"
                  type="url"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Organização"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 