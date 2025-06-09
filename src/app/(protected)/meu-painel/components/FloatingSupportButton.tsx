"use client";

import React, { useState } from 'react';
import { MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { buttonStyles, cardStyles, formStyles } from "@/lib/ui-config";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SupportCategory = "duvida" | "problema" | "sugestao" | "cancelamento" | "outro";

const FloatingSupportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'duvida' as SupportCategory,
    message: '',
    contactEmail: '',
    isUrgent: false,
  });

  const createSupportMessage = useMutation(api["domains/support/mutations"].createSupportMessage);

  const resetForm = () => {
    setFormData({
      subject: '',
      category: 'duvida' as SupportCategory,
      message: '',
      contactEmail: '',
      isUrgent: false,
    });
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
        category: formData.category,
        message: formData.message,
        contactEmail: formData.contactEmail,
        isUrgent: formData.isUrgent,
      });

      toast.success("Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.");
      setIsOpen(false);
      resetForm();
    } catch (error) {
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

  return (
    <div className="fixed bottom-8 right-8 z-40">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button 
            className={`${buttonStyles.variant.gradient} ${buttonStyles.size.lg} rounded-full flex items-center shadow-lg`}
            onClick={() => setIsOpen(true)}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Suporte
          </Button>
        </DrawerTrigger>
        <DrawerContent className={`${cardStyles.base} max-w-md mx-auto`}>
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-primary" />
              Como podemos ajudar?
            </DrawerTitle>
            <DrawerDescription>
              Envie sua mensagem e nossa equipe responderá o mais breve possível.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-subject">Assunto*</Label>
                <Input 
                  id="support-subject" 
                  placeholder="Resumo do seu problema ou dúvida"
                  value={formData.subject}
                  onChange={(e) => updateFormData('subject', e.target.value)}
                  className={formStyles.input.base}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  {formData.subject.length}/100 caracteres
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="support-category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: SupportCategory) => updateFormData('category', value)}
                >
                  <SelectTrigger id="support-category" className={formStyles.select.trigger}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className={formStyles.select.content}>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="problema">Problema</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="cancelamento">Cancelamento</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="support-message">Mensagem*</Label>
                <Textarea 
                  id="support-message" 
                  placeholder="Descreva em detalhes como podemos ajudar..."
                  value={formData.message}
                  onChange={(e) => updateFormData('message', e.target.value)}
                  className={formStyles.textarea.base}
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500">
                  {formData.message.length}/1000 caracteres
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="support-email">Email para contato*</Label>
                <Input 
                  id="support-email" 
                  placeholder="seu-email@exemplo.com"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateFormData('contactEmail', e.target.value)}
                  className={formStyles.input.base}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="support-urgent" 
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) => updateFormData('isUrgent', checked)}
                />
                <Label htmlFor="support-urgent">É urgente</Label>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button 
              className={buttonStyles.variant.gradient}
              disabled={isSending || !formData.subject.trim() || !formData.message.trim() || !formData.contactEmail.trim()}
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
              ) : "Enviar mensagem"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default FloatingSupportButton; 