"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CitySelector } from "@/components/ui/city-selector";
import { Calendar, Users, MapPin, DollarSign, Clock, Send, CheckCircle, Heart } from "lucide-react";
import { 
  COMPANIONS_OPTIONS,
  BUDGET_FLEXIBILITY_OPTIONS,
  ACCOMMODATION_TYPE_OPTIONS,
  ACTIVITY_OPTIONS,
  TRANSPORTATION_OPTIONS,
  type PackageRequestFormData 
} from "../../../convex/domains/packages/types";
import { ParticipantSelector } from "@/components/ui/participant-selector";

interface PackageRequestFormProps {
  onSuccess?: (requestNumber: string) => void;
}

export default function PackageRequestForm({ onSuccess }: PackageRequestFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const createRequest = useMutation(api.packages.createPackageRequest);

  const [formData, setFormData] = useState<PackageRequestFormData>({
    customerInfo: {
      name: "",
      email: "",
      phone: "",
      age: undefined,
      occupation: "",
    },
    tripDetails: {
      destination: "Fernando de Noronha",
      startDate: "",
      endDate: "",
      duration: 0,
      adults: 2,
      children: 0,
      groupSize: 2,
      companions: "",
      budget: 0,
      budgetFlexibility: "",
      includesAirfare: false,
    },
    preferences: {
      accommodationType: [],
      activities: [],
      transportation: [],
      foodPreferences: [],
      accessibility: [],
    },
    specialRequirements: "",
    previousExperience: "",
    expectedHighlights: "",
  });

  const updateFormData = (section: keyof PackageRequestFormData, field: string, value: any) => {
    setFormData(prev => {
      const nextSection = {
        ...(prev[section] as any),
        [field]: value,
      };

      if (section === "tripDetails" && (field === "groupSize" || field === "adults" || field === "children")) {
        const currentAdults = prev.tripDetails.adults || 0;
        const currentChildren = prev.tripDetails.children || 0;
        const nextAdults = field === "adults" ? Number(value) : currentAdults;
        const nextChildren = field === "children" ? Number(value) : currentChildren;
        const nextGroupSize = field === "groupSize"
          ? Math.max(Number(value) || 0, 0)
          : Math.max(nextAdults + nextChildren, 0);

        if (field !== "groupSize") {
          nextSection.groupSize = nextGroupSize;
          nextSection.adults = field === "adults" ? nextAdults : Math.min(nextAdults, nextGroupSize);
          nextSection.children = field === "children" ? nextChildren : Math.max(nextGroupSize - (nextSection.adults || 0), 0);
        } else {
          const adjustedAdults = Math.min(nextSection.adults ?? currentAdults, nextGroupSize);
          nextSection.adults = adjustedAdults;
          nextSection.children = Math.max(nextGroupSize - adjustedAdults, 0);
        }
      }

      const nextState: PackageRequestFormData = {
        ...prev,
        [section]: nextSection as any,
      };
      return nextState;
    });
  };

  const toggleArrayValue = (section: "preferences", field: string, value: string) => {
    setFormData(prev => {
      const currentArray = (prev[section] as any)[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item: string) => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  // Helper function to parse date strings without timezone issues
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const calculateDuration = () => {
    if (formData.tripDetails.startDate && formData.tripDetails.endDate) {
      const start = parseLocalDate(formData.tripDetails.startDate);
      const end = parseLocalDate(formData.tripDetails.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      updateFormData("tripDetails", "duration", diffDays);
    }
  };

  React.useEffect(() => {
    calculateDuration();
  }, [formData.tripDetails.startDate, formData.tripDetails.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload: PackageRequestFormData = {
        ...formData,
        tripDetails: {
          ...formData.tripDetails,
          groupSize: formData.tripDetails.adults + formData.tripDetails.children,
        },
      };

      const result = await createRequest(payload);
      setRequestNumber(result.requestNumber);
      setIsSubmitted(true);
      onSuccess?.(result.requestNumber);
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      alert("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">
              Solicitação Enviada com Sucesso!
            </h2>
            <p className="text-gray-600">
              Sua solicitação foi recebida e está sendo analisada por nossa equipe.
            </p>
            <div className="bg-green-50 p-4 rounded-lg border">
              <p className="font-semibold">Número da Solicitação:</p>
              <p className="text-xl font-mono text-green-700">{requestNumber}</p>
              <p className="text-sm text-gray-600 mt-2">
                Guarde este número para acompanhar o status da sua solicitação.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Entraremos em contato em até 24 horas com uma proposta personalizada!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Enhanced Progress Indicator */}
      <div className="relative">
        <div className="flex justify-center space-x-8 mb-12">
          {[
            { step: 1, label: "Pessoal", icon: Users },
            { step: 2, label: "Viagem", icon: MapPin },
            { step: 3, label: "Preferências", icon: Heart },
            { step: 4, label: "Finalizar", icon: Send }
          ].map(({ step: stepNum, label, icon: Icon }) => (
            <div key={stepNum} className="flex flex-col items-center">
              <div
                className={`relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg transition-all duration-300 ${
                  stepNum <= step
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white scale-110"
                    : "bg-white border-2 border-gray-200 text-gray-400"
                }`}
              >
                <Icon className="w-6 h-6" />
                {stepNum < step && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <span className={`mt-3 text-sm font-medium ${
                stepNum <= step ? "text-blue-600" : "text-gray-400"
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Progress Line */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Information */}
        {step === 1 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 mt-1">
                    Conte-nos um pouco sobre você para personalizarmos sua experiência ✨
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.customerInfo.name}
                    onChange={(e) => updateFormData("customerInfo", "name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customerInfo.email}
                    onChange={(e) => updateFormData("customerInfo", "email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.customerInfo.phone}
                    onChange={(e) => updateFormData("customerInfo", "phone", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.customerInfo.age || ""}
                    onChange={(e) => updateFormData("customerInfo", "age", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="occupation">Profissão</Label>
                <Input
                  id="occupation"
                  value={formData.customerInfo.occupation}
                  onChange={(e) => updateFormData("customerInfo", "occupation", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Trip Details */}
        {step === 2 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/30">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Detalhes da Viagem
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 mt-1">
                    Planeje os detalhes da sua viagem dos sonhos 🗺️
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    📅 Data de Início *
                  </Label>
                  <div className="relative">
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.tripDetails.startDate}
                      onChange={(e) => updateFormData("tripDetails", "startDate", e.target.value)}
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-emerald-400 rounded-xl transition-colors"
                      required
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    🏁 Data de Fim *
                  </Label>
                  <div className="relative">
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.tripDetails.endDate}
                      onChange={(e) => updateFormData("tripDetails", "endDate", e.target.value)}
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-emerald-400 rounded-xl transition-colors"
                      required
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {formData.tripDetails.duration > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-800">
                        Duração da viagem
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        {formData.tripDetails.duration} {formData.tripDetails.duration === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    👥 Número de Participantes *
                  </Label>
                  <ParticipantSelector
                    adults={formData.tripDetails.adults}
                    childrenCount={formData.tripDetails.children}
                    onAdultsChange={(value) => {
                      updateFormData("tripDetails", "adults", value);
                      updateFormData("tripDetails", "groupSize", value + (formData.tripDetails.children || 0));
                    }}
                    onChildrenChange={(value) => {
                      updateFormData("tripDetails", "children", value);
                      updateFormData("tripDetails", "groupSize", (formData.tripDetails.adults || 0) + value);
                    }}
                    minAdults={1}
                    maxAdults={20}
                    maxChildren={10}
                    minTotal={1}
                    maxTotal={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companions" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    💫 Tipo de Companhia *
                  </Label>
                  <select
                    id="companions"
                    className="w-full h-12 p-4 border-2 border-gray-200 focus:border-emerald-400 rounded-xl transition-colors bg-white"
                    value={formData.tripDetails.companions}
                    onChange={(e) => updateFormData("tripDetails", "companions", e.target.value)}
                    required
                  >
                    <option value="">Selecione o tipo...</option>
                    {COMPANIONS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Incluir Passagem Aérea */}
              <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-6 rounded-xl border-2 border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">✈️ Passagem Aérea</h3>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="includesAirfare"
                          value="true"
                          checked={formData.tripDetails.includesAirfare === true}
                          onChange={() => updateFormData("tripDetails", "includesAirfare", true)}
                          className="h-5 w-5 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-base font-medium text-gray-700">Com Aéreo</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="includesAirfare"
                          value="false"
                          checked={formData.tripDetails.includesAirfare === false}
                          onChange={() => updateFormData("tripDetails", "includesAirfare", false)}
                          className="h-5 w-5 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-base font-medium text-gray-700">Sem Aéreo</span>
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      💡 Informe se deseja incluir passagens aéreas no seu pacote de viagem
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    💰 Orçamento Aproximado *
                  </Label>
                  <div className="relative">
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="100"
                      value={formData.tripDetails.budget}
                      onChange={(e) => updateFormData("tripDetails", "budget", parseFloat(e.target.value))}
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-emerald-400 rounded-xl transition-colors"
                      placeholder="Ex: 5000"
                      required
                    />
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">💡 Valor em reais por pessoa</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetFlexibility" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    📊 Flexibilidade no Orçamento *
                  </Label>
                  <select
                    id="budgetFlexibility"
                    className="w-full h-12 p-4 border-2 border-gray-200 focus:border-emerald-400 rounded-xl transition-colors bg-white"
                    value={formData.tripDetails.budgetFlexibility}
                    onChange={(e) => updateFormData("tripDetails", "budgetFlexibility", e.target.value)}
                    required
                  >
                    <option value="">Selecione a flexibilidade...</option>
                    {BUDGET_FLEXIBILITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Viagem</CardTitle>
              <CardDescription>
                Selecione suas preferências para criarmos o pacote perfeito para você.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accommodation Type */}
              <div>
                <Label className="text-base font-semibold">Tipos de Hospedagem</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ACCOMMODATION_TYPE_OPTIONS.map(option => (
                    <Badge
                      key={option.value}
                      variant={formData.preferences.accommodationType.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue("preferences", "accommodationType", option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div>
                <Label className="text-base font-semibold">Atividades de Interesse</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ACTIVITY_OPTIONS.map(option => (
                    <Badge
                      key={option.value}
                      variant={formData.preferences.activities.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue("preferences", "activities", option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Transportation */}
              <div>
                <Label className="text-base font-semibold">Meios de Transporte</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TRANSPORTATION_OPTIONS.map(option => (
                    <Badge
                      key={option.value}
                      variant={formData.preferences.transportation.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue("preferences", "transportation", option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Additional Information */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
              <CardDescription>
                Conte-nos mais sobre suas expectativas e necessidades especiais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="specialRequirements">Necessidades Especiais ou Acessibilidade</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  placeholder="Ex: Cadeira de rodas, dieta específica, alergia alimentar..."
                />
              </div>

              <div>
                <Label htmlFor="previousExperience">Já visitou este destino antes?</Label>
                <Textarea
                  id="previousExperience"
                  value={formData.previousExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousExperience: e.target.value }))}
                  placeholder="Conte-nos sobre experiências anteriores no destino..."
                />
              </div>

              <div>
                <Label htmlFor="expectedHighlights">O que mais espera desta viagem?</Label>
                <Textarea
                  id="expectedHighlights"
                  value={formData.expectedHighlights}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedHighlights: e.target.value }))}
                  placeholder="Descreva o que mais deseja fazer ou ver durante a viagem..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Navigation Buttons */}
        <div className="flex justify-between items-center pt-8">
          {step > 1 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 h-12 px-6 border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-200"
            >
              ← Anterior
            </Button>
          ) : (
            <div />
          )}
          
          {step < 4 ? (
            <Button 
              type="button" 
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 h-12 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Próximo →
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2 h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
} 
