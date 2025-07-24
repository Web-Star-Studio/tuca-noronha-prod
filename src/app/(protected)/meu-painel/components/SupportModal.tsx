"use client";

import React from 'react';
import { MessageCircle, HelpCircle, X, Clock, Mail, Tag, AlertTriangle, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { buttonStyles, cardStyles, formStyles, transitionEffects } from "@/lib/ui-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useSupportModal } from '../hooks/useSupportModal';

type SupportCategory = "duvida" | "problema" | "sugestao" | "cancelamento" | "outro";

const categoryIcons = {
  duvida: HelpCircle,
  problema: AlertTriangle,
  sugestao: Star,
  cancelamento: X,
  outro: MessageCircle
};

const categoryColors = {
  duvida: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
  problema: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
  sugestao: "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
  cancelamento: "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100",
  outro: "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
};

const categoryDescriptions = {
  duvida: "Precisa de esclarecimentos ou orientações",
  problema: "Encontrou um erro ou algo não está funcionando",
  sugestao: "Tem uma ideia para melhorar nossa plataforma",
  cancelamento: "Precisa cancelar uma reserva ou serviço",
  outro: "Outro tipo de solicitação"
};

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const {
    currentStep,
    isSending,
    formData,
    steps,
    handleSubmit,
    updateFormData,
    nextStep,
    prevStep,
    canProceedToNextStep,
    resetForm
  } = useSupportModal();

  // Override close handler to use parent's onClose
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderProgressBar = () => (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
            ${index <= currentStep 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {index < currentStep ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`
              w-16 h-0.5 mx-2 transition-all duration-300
              ${index < currentStep ? 'bg-primary' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const renderCategoryStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(categoryDescriptions).map(([key, description]) => {
          const IconComponent = categoryIcons[key as SupportCategory];
          return (
            <button
              key={key}
              onClick={() => {
                updateFormData('category', key);
                setTimeout(nextStep, 200);
              }}
              className={`
                w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${formData.category === key 
                  ? categoryColors[key as SupportCategory] + ' border-opacity-100' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-1">
                    {key === 'duvida' && 'Dúvida'}
                    {key === 'problema' && 'Problema'}
                    {key === 'sugestao' && 'Sugestão'}
                    {key === 'cancelamento' && 'Cancelamento'}
                    {key === 'outro' && 'Outro'}
                  </div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="support-subject" className="text-sm font-medium">
          Assunto <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="support-subject" 
          placeholder="Resumo do seu problema ou dúvida"
          value={formData.subject}
          onChange={(e) => updateFormData('subject', e.target.value)}
          className={formStyles.input.base}
          maxLength={100}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {formData.subject.length}/100 caracteres
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="support-message" className="text-sm font-medium">
          Mensagem <span className="text-red-500">*</span>
        </Label>
        <Textarea 
          id="support-message" 
          placeholder="Descreva em detalhes como podemos ajudar..."
          value={formData.message}
          onChange={(e) => updateFormData('message', e.target.value)}
          className={formStyles.textarea.base}
          rows={4}
          maxLength={1000}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {formData.message.length}/1000 caracteres
          </p>
        </div>
      </div>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Switch 
            id="support-urgent" 
            checked={formData.isUrgent}
            onCheckedChange={(checked) => updateFormData('isUrgent', checked)}
          />
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <Label htmlFor="support-urgent" className="text-sm font-medium text-orange-800">
              Marcar como urgente
            </Label>
          </div>
        </div>
        <p className="text-xs text-orange-700 mt-2 ml-6">
          Solicitações urgentes são priorizadas e respondidas em até 2 horas
        </p>
      </div>
    </div>
  );

  const renderContactStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="support-email" className="text-sm font-medium">
          Email para contato <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="support-email" 
          placeholder="seu-email@exemplo.com"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => updateFormData('contactEmail', e.target.value)}
          className={formStyles.input.base}
        />
        <p className="text-xs text-gray-500">
          Enviaremos nossa resposta para este email
        </p>
      </div>

      {/* Resumo da solicitação */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Resumo da sua solicitação:</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-600" />
            <span className="font-medium">Categoria:</span>
            <Badge variant="outline" className="text-xs">
              {formData.category === 'duvida' && 'Dúvida'}
              {formData.category === 'problema' && 'Problema'}
              {formData.category === 'sugestao' && 'Sugestão'}
              {formData.category === 'cancelamento' && 'Cancelamento'}
              {formData.category === 'outro' && 'Outro'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-gray-600" />
            <span className="font-medium">Assunto:</span>
            <span className="text-gray-700">{formData.subject}</span>
          </div>
          
          {formData.isUrgent && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">Urgente</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Tempo de resposta</h4>
            <p className="text-sm text-blue-800">
              {formData.isUrgent 
                ? "Responderemos em até 2 horas em dias úteis"
                : "Responderemos em até 24 horas em dias úteis"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderCategoryStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderContactStep();
      default:
        return renderCategoryStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${cardStyles.base} max-w-lg mx-auto max-h-[90vh] flex flex-col ${transitionEffects.appear.fadeInUp}`}>
        <DialogHeader className="text-center pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex-shrink-0">
          {renderProgressBar()}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto py-2">
          {renderCurrentStep()}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t flex-shrink-0 bg-white">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex items-center gap-2"
            >
              Cancelar
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                className={buttonStyles.variant.gradient}
                disabled={!canProceedToNextStep()}
                onClick={nextStep}
              >
                Próximo
              </Button>
            ) : (
              <Button 
                className={buttonStyles.variant.gradient}
                disabled={isSending || !canProceedToNextStep()}
                onClick={handleSubmit}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <title>Carregando</title>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </>
                ) : "Enviar Solicitação"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 