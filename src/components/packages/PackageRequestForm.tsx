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
import { Calendar, Users, MapPin, DollarSign, Clock, Send, CheckCircle } from "lucide-react";
import { 
  COMPANIONS_OPTIONS,
  BUDGET_FLEXIBILITY_OPTIONS,
  ACCOMMODATION_TYPE_OPTIONS,
  ACTIVITY_OPTIONS,
  TRANSPORTATION_OPTIONS,
  FOOD_PREFERENCES_OPTIONS,
  type PackageRequestFormData 
} from "../../../convex/domains/packages/types";

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
      destination: "",
      startDate: "",
      endDate: "",
      duration: 0,
      groupSize: 1,
      companions: "",
      budget: 0,
      budgetFlexibility: "",
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
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
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

  const calculateDuration = () => {
    if (formData.tripDetails.startDate && formData.tripDetails.endDate) {
      const start = new Date(formData.tripDetails.startDate);
      const end = new Date(formData.tripDetails.endDate);
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
      const result = await createRequest(formData);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex justify-center space-x-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${
              i <= step
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {i}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Conte-nos um pouco sobre você para personalizarmos sua experiência.
              </CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalhes da Viagem
              </CardTitle>
              <CardDescription>
                Planeje os detalhes da sua viagem dos sonhos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="destination">Destino *</Label>
                <Input
                  id="destination"
                  value={formData.tripDetails.destination}
                  onChange={(e) => updateFormData("tripDetails", "destination", e.target.value)}
                  placeholder="Ex: Fernando de Noronha, Chapada Diamantina..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.tripDetails.startDate}
                    onChange={(e) => updateFormData("tripDetails", "startDate", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.tripDetails.endDate}
                    onChange={(e) => updateFormData("tripDetails", "endDate", e.target.value)}
                    required
                  />
                </div>
              </div>

              {formData.tripDetails.duration > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Duração: {formData.tripDetails.duration} dias
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="groupSize">Número de Pessoas *</Label>
                  <Input
                    id="groupSize"
                    type="number"
                    min="1"
                    value={formData.tripDetails.groupSize}
                    onChange={(e) => updateFormData("tripDetails", "groupSize", parseInt(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="companions">Tipo de Companhia *</Label>
                  <select
                    id="companions"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.tripDetails.companions}
                    onChange={(e) => updateFormData("tripDetails", "companions", e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {COMPANIONS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Orçamento Aproximado (R$) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    value={formData.tripDetails.budget}
                    onChange={(e) => updateFormData("tripDetails", "budget", parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="budgetFlexibility">Flexibilidade no Orçamento *</Label>
                  <select
                    id="budgetFlexibility"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.tripDetails.budgetFlexibility}
                    onChange={(e) => updateFormData("tripDetails", "budgetFlexibility", e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
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

              {/* Food Preferences */}
              <div>
                <Label className="text-base font-semibold">Preferências Gastronômicas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FOOD_PREFERENCES_OPTIONS.map(option => (
                    <Badge
                      key={option.value}
                      variant={formData.preferences.foodPreferences.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue("preferences", "foodPreferences", option.value)}
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

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Anterior
            </Button>
          )}
          
          {step < 4 ? (
            <Button type="button" onClick={() => setStep(step + 1)} className="ml-auto">
              Próximo
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isLoading}
              className="ml-auto flex items-center gap-2"
            >
              {isLoading ? (
                "Enviando..."
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