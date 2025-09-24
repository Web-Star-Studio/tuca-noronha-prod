"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
          title: "Email de teste enviado",
          description: "Verifique sua caixa de entrada. O envio pode levar alguns minutos.",
        });
        setIsOpen(false);
        setTestEmail("");
      } else {
        toast({
          title: "Falha no envio",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro inesperado",
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
      <DialogContent className="sm:max-w-[420px]">
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
              placeholder="nome@empresa.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
              disabled={isLoading}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">Antes de enviar</p>
            <ul className="mt-2 space-y-1">
              <li>Confirme a ortografia do endereço informado.</li>
              <li>Verifique a caixa de spam caso não veja a mensagem em alguns minutos.</li>
              <li>Em desenvolvimento, consulte o console para pré-visualizar links.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
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
                Enviando
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar teste
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
