"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Package, User, FileText, CreditCard, CheckCircle } from "lucide-react";
import { AssetSelectionStep } from "./reservation-steps/AssetSelectionStep";
import { TravelerSelectionStep } from "./reservation-steps/TravelerSelectionStep";
import { ReservationDetailsStep } from "./reservation-steps/ReservationDetailsStep";
import { PaymentConfigurationStep } from "./reservation-steps/PaymentConfigurationStep";
import { ConfirmationStep } from "./reservation-steps/ConfirmationStep";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export interface AdminReservationData {
  // Asset Information
  assetId: string;
  assetType: "activities" | "events" | "restaurants" | "vehicles" | "accommodations";
  assetTitle: string;
  
  // Traveler Information
  travelerId: Id<"users">;
  travelerName: string;
  travelerEmail: string;
  
  // Reservation Details
  reservationData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerDocument?: string;
    specialRequests?: string;
    // Asset-specific fields will be added dynamically
    [key: string]: any;
  };
  
  // Payment Configuration
  paymentMethod: "cash" | "transfer" | "card" | "deferred";
  paymentStatus: "pending" | "cash" | "transfer" | "deferred";
  totalAmount: number;
  
  // Admin Configuration
  createdMethod: "admin_direct" | "phone_booking" | "walk_in";
  autoConfirm: boolean;
  sendNotifications: boolean;
  notes?: string;
}

const STEPS = [
  { id: "asset", title: "Selecionar Ativo", description: "Escolha o serviço", icon: Package },
  { id: "traveler", title: "Selecionar Viajante", description: "Identifique o cliente", icon: User },
  { id: "details", title: "Detalhes da Reserva", description: "Preencha as informações", icon: FileText },
  { id: "payment", title: "Pagamento", description: "Configure a cobrança", icon: CreditCard },
  { id: "confirmation", title: "Confirmação", description: "Revise e finalize", icon: CheckCircle }
] as const;


function StepIndicator({ 
  currentStep, 
  setCurrentStep 
}: { 
  currentStep: number, 
  setCurrentStep: (step: number) => void 
}) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-6">
        {STEPS.map((step, stepIdx) => (
          <li key={step.id}>
            <div
              onClick={() => {
                if (stepIdx < currentStep) {
                  setCurrentStep(stepIdx);
                }
              }}
              className={cn(
                "group flex items-start w-full",
                stepIdx < currentStep ? "cursor-pointer hover:opacity-75 transition-opacity" : "cursor-default"
              )}
            >
              <span className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full">
                {stepIdx < currentStep ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <step.icon className={cn(
                    "h-8 w-8",
                    stepIdx === currentStep ? "text-primary" : "text-gray-400"
                  )} />
                )}
              </span>
              <div className="ml-4 flex min-w-0 flex-col">
                <p className={cn(
                  "text-base font-semibold",
                   stepIdx === currentStep ? "text-primary" : "text-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}


export function AdminReservationCreationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [reservationData, setReservationData] = useState<Partial<AdminReservationData>>({
     autoConfirm: true,
     sendNotifications: true,
     createdMethod: 'admin_direct',
     paymentMethod: 'deferred',
     paymentStatus: 'pending'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const createReservation = useMutation(api.domains.adminReservations.mutations.createAdminReservation);
  
  const steps = [
    { title: 'Seleção de Serviço', component: AssetSelectionStep },
    { title: 'Dados do Cliente', component: TravelerSelectionStep },
    { title: 'Detalhes da Reserva', component: ReservationDetailsStep },
    { title: 'Pagamento', component: PaymentConfigurationStep },
    { title: 'Revisão', component: ConfirmationStep },
  ];

  const handleNext = (data: Partial<AdminReservationData>) => {
    setReservationData(prev => ({ ...prev, ...data }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (finalData: AdminReservationData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare reservationData with only the fields expected by the mutation
      const { customerName, customerEmail, customerPhone, customerDocument, ...assetSpecificData } = finalData.reservationData;
      
      // Convert dates to timestamps in assetSpecific data
      const processedAssetSpecific = Object.keys(assetSpecificData).reduce((acc, key) => {
        const value = assetSpecificData[key];
        if (value instanceof Date) {
          acc[key] = value.getTime();
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      const reservationData = {
        specialRequests: finalData.reservationData.specialRequests,
        ...processedAssetSpecific
      };
      
      const result = await createReservation({
        assetType: finalData.assetType,
        assetId: finalData.assetId,
        travelerId: finalData.travelerId,
        customerName: finalData.customerName,
        customerEmail: finalData.customerEmail,
        customerPhone: finalData.customerPhone,
        customerDocument: finalData.customerDocument,
        reservationDate: finalData.reservationDate,
        totalAmount: finalData.totalAmount,
        paymentStatus: finalData.paymentStatus,
        paymentMethod: finalData.paymentMethod,
        createdMethod: finalData.createdMethod || 'admin_direct',
        notes: finalData.notes,
        autoConfirm: finalData.autoConfirm,
        sendNotifications: finalData.sendNotifications,
        reservationData: reservationData,
      });

      toast({
        title: "Reserva criada com sucesso!",
        description: result.confirmationCode 
          ? `Código de confirmação: ${result.confirmationCode}`
          : "A reserva foi criada e está aguardando confirmação.",
      });

      // If payment is required and method is card, inform about the payment link
      if (result.requiresPayment && result.paymentMethod === 'card') {
        toast({
          title: "Link de pagamento enviado",
          description: "Um email com o link de pagamento foi enviado ao cliente.",
          duration: 5000,
        });
      }

      // Reset form
      setReservationData({
        autoConfirm: true,
        sendNotifications: true,
        createdMethod: 'admin_direct',
        paymentMethod: 'deferred',
        paymentStatus: 'pending'
      });
      setCurrentStep(0);
      
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      toast({
        title: "Erro ao criar reserva",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Nova Reserva Administrativa</h2>
        <p className="mt-2 text-gray-600">
          Crie reservas diretamente para seus clientes
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${index < currentStep ? 'bg-green-500 text-white' : 
                  index === currentStep ? 'bg-blue-500 text-white' : 
                  'bg-gray-200 text-gray-600'}
              `}>
                {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <p key={index} className={`text-xs ${
              index === currentStep ? 'font-semibold text-blue-600' : 'text-gray-500'
            }`}>
              {step.title}
            </p>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <CurrentStepComponent
        data={reservationData}
        onNext={handleNext}
        onComplete={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}