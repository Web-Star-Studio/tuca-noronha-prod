import { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

type SupportCategory = "duvida" | "problema" | "sugestao" | "cancelamento" | "outro";

interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
}

const steps: FormStep[] = [
  {
    id: 'category',
    title: 'Tipo de Solicitação',
    description: 'Escolha a categoria que melhor descreve sua necessidade',
    fields: ['category']
  },
  {
    id: 'details',
    title: 'Detalhes',
    description: 'Nos conte mais sobre como podemos ajudar',
    fields: ['subject', 'message', 'isUrgent']
  },
  {
    id: 'contact',
    title: 'Contato',
    description: 'Como podemos entrar em contato com você',
    fields: ['contactEmail']
  }
];

export const useSupportModal = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '' as SupportCategory | '',
    message: '',
    contactEmail: '',
    isUrgent: false,
  });

  const createSupportMessage = useMutation(api.domains.support.mutations.createSupportMessage);

  const resetForm = () => {
    setFormData({
      subject: '',
      category: '',
      message: '',
      contactEmail: '',
      isUrgent: false,
    });
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    // Validações básicas
    if (!formData.subject.trim()) {
      toast.error("Assunto é obrigatório");
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error("Mensagem é obrigatória");
      return;
    }
    
    if (!formData.contactEmail.trim()) {
      toast.error("Email para contato é obrigatório");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      toast.error("Email inválido");
      return;
    }

    setIsSending(true);

    try {
      await createSupportMessage({
        subject: formData.subject,
        category: formData.category as SupportCategory,
        message: formData.message,
        contactEmail: formData.contactEmail,
        isUrgent: formData.isUrgent,
      });

      toast.success("Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.");
      resetForm();
    } catch {
      console.error("Erro ao enviar mensagem de suporte:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    const currentStepData = steps[currentStep];
    return currentStepData.fields.every(field => {
      if (field === 'category') return formData.category !== '';
      return formData[field as keyof typeof formData] !== '';
    });
  };

  return {
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
  };
}; 