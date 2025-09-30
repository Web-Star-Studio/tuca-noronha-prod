"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOnboarding } from "@/hooks/useOnboarding"
import { Loader2, UserCheck, Calendar, Phone, User, ArrowLeft, CheckCircle, CreditCard } from "lucide-react"

interface OnboardingData {
  fullName: string
  dateOfBirth: string
  phoneNumber: string
  cpf?: string
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const { 
    isCompleted, 
    isTraveler, 
    userRole,
    completeOnboarding,
    redirectToHome 
  } = useOnboarding()

  const [formData, setFormData] = useState<OnboardingData>({
    fullName: "",
    dateOfBirth: "",
    phoneNumber: "",
    cpf: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<OnboardingData>>({})

  // Verificar se o usuário já completou o onboarding
  useEffect(() => {
    if (isCompleted) {
      redirectToHome()
    }
  }, [isCompleted, redirectToHome])

  // Verificar se é um traveler
  useEffect(() => {
    if (userRole && !isTraveler) {
      redirectToHome()
    }
  }, [userRole, isTraveler, redirectToHome])

  // Pré-popular com dados do Clerk
  useEffect(() => {
    if (user && isLoaded) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }))
    }
  }, [user, isLoaded])

  const validateForm = (): boolean => {
    const newErrors: Partial<OnboardingData> = {}

    // Validar nome completo
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório"
    } else if (formData.fullName.trim().split(" ").length < 2) {
      newErrors.fullName = "Digite seu nome completo (nome e sobrenome)"
    }

    // Validar data de nascimento
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Data de nascimento é obrigatória"
    } else {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (birthDate > today) {
        newErrors.dateOfBirth = "Data de nascimento não pode ser no futuro"
      } else if (age < 13) {
        newErrors.dateOfBirth = "Você deve ter pelo menos 13 anos"
      } else if (age > 120) {
        newErrors.dateOfBirth = "Data de nascimento inválida"
      }
    }

    // Validar telefone
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Telefone é obrigatório"
    } else {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Formato: (XX) XXXXX-XXXX"
      }
    }

    // Validar CPF (opcional, mas se fornecido, deve estar no formato correto)
    if (formData.cpf && formData.cpf.trim()) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
      if (!cpfRegex.test(formData.cpf)) {
        newErrors.cpf = "Formato: XXX.XXX.XXX-XX"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não for número
    const onlyNumbers = value.replace(/\D/g, "")
    
    // Limita a 11 dígitos
    const limited = onlyNumbers.slice(0, 11)
    
    // Aplica a máscara
    if (limited.length <= 2) {
      return limited
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    } else if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({ ...prev, phoneNumber: formatted }))
    
    // Limpar erro se existir
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }))
    }
  }

  const formatCPF = (value: string): string => {
    // Remove tudo que não for número
    const onlyNumbers = value.replace(/\D/g, "")
    
    // Limita a 11 dígitos
    const limited = onlyNumbers.slice(0, 11)
    
    // Aplica a máscara
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}.${limited.slice(3)}`
    } else if (limited.length <= 9) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
    } else {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
    }
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setFormData(prev => ({ ...prev, cpf: formatted }))
    
    // Limpar erro se existir
    if (errors.cpf) {
      setErrors(prev => ({ ...prev, cpf: undefined }))
    }
  }

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro específico
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await completeOnboarding(formData)

      if (result.success) {
        redirectToHome()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-2">
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Complete seu perfil</CardTitle>
            <CardDescription>
              Para começar a usar o Tuca Noronha, precisamos de algumas informações básicas
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ex: João Silva Santos"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              {/* CPF (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="cpf" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  CPF (opcional)
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf || ""}
                  onChange={handleCPFChange}
                  className={errors.cpf ? "border-red-500" : ""}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-600">{errors.cpf}</p>
                )}
                <p className="text-xs text-gray-500">
                  Recomendado para facilitar reservas e pagamentos
                </p>
              </div>

              {/* Botões */}
              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completando perfil...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completar Perfil
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={redirectToHome}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Fazer depois
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informação adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Seus dados são protegidos e utilizados apenas para melhorar sua experiência
          </p>
        </div>
      </div>
    </div>
  )
} 