"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2 } from "lucide-react";

export function EmailTestDialog() {
  const [testEmail, setTestEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const testEmailService = useAction(api.domains.email.actions.testEmailService);
  const { toast } = useToast();

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um email válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await testEmailService({ testEmail });
      
      if (result.success) {
        toast({
          title: "✅ Email de teste enviado!",
          description: "Verifique sua caixa de entrada (pode levar alguns minutos)",
        });
        setIsOpen(false);
        setTestEmail("");
      } else {
        toast({
          title: "❌ Falha no envio",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "💥 Erro inesperado",
        description: "Não foi possível enviar o email de teste",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="w-4 h-4 mr-2" />
          Testar Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Teste do Sistema de Emails
          </DialogTitle>
          <DialogDescription>
            Envie um email de teste para verificar se o sistema está funcionando corretamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="test-email">Email de destino</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="seu-email@exemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
              disabled={isLoading}
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Dicas:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Verifique também a pasta de spam</li>
              <li>Em desenvolvimento, use o console para ver URLs de preview</li>
              <li>Emails podem levar alguns minutos para chegar</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSendTest}
            disabled={isLoading || !testEmail}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Teste
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 