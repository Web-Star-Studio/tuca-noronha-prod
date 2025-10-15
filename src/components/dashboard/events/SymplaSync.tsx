"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Cloud, Loader2, AlertCircle, Check, HelpCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SymplaSync() {
  const [token, setToken] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useCurrentUser();
  
  const syncFromSympla = useAction(api.domains.events.actions.syncFromSympla);
  
  const handleSync = async () => {
    if (!token.trim()) {
      toast.error("Por favor, insira seu token de segurança do Sympla");
      return;
    }
    
    if (!user || !user._id) {
      toast.error("Usuário não identificado. Por favor, faça login novamente.");
      return;
    }
    
    try {
      setIsSyncing(true);
      
      const result = await syncFromSympla({
        symplaToken: token,
        partnerId: user._id
      });
      
      if (result.success) {
        toast.success(
          `Sincronização concluída! ${result.imported} eventos importados, ${result.created} criados, ${result.updated} atualizados.`
        );
        setDialogOpen(false);
      } else {
        toast.error(`Erro na sincronização: ${result.error}`);
      }
    } catch (error) {
      console.error("Error syncing with Sympla:", error);
      toast.error("Ocorreu um erro ao sincronizar com o Sympla");
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white border-blue-200 hover:border-blue-300 shadow-sm"
        >
          <Cloud className="h-4 w-4 mr-2 text-blue-600" />
          Sincronizar com Sympla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            Sincronizar Eventos do Sympla
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  Esta ferramenta importa seus eventos do Sympla para o sistema, permitindo que você aproveite a venda de ingressos pelo Sympla enquanto exibe os eventos em seu site.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Importe seus eventos diretamente da sua conta no Sympla. É necessário ter um token de API válido.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token" className="text-sm font-medium">
              Token de Segurança do Sympla
            </Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Insira seu token de API do Sympla"
              className="bg-white"
              type="password"
            />
            <p className="text-xs text-gray-500">
              Encontre seu token no <a href="https://www.sympla.com.br/minhas-configuracoes/feramentas/token" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">painel do Sympla</a> em Minhas Configurações {'>'} Ferramentas {'>'} Token.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 border border-blue-100">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Importante:</p>
                <p className="mb-2">Esta sincronização irá:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Importar todos os eventos ativos da sua conta Sympla</li>
                  <li>Criar links diretos para vendas de ingressos no Sympla</li>
                  <li>Atualizar eventos existentes se já importados anteriormente</li>
                </ul>
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-2 flex items-center"
                >
                  {showDetails ? "Ocultar detalhes" : "Ver mais detalhes"}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </button>
              </div>
            </div>
            
            {showDetails && (
              <div className="mt-3 border-t border-blue-200 pt-3 text-blue-700">
                <p className="font-medium mb-1">Dados importados:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Nome, descrição e detalhes do evento</li>
                  <li>Data, hora e localização</li>
                  <li>Informações sobre o organizador</li>
                  <li>Preços e links para compra de ingressos</li>
                  <li>Status do evento (publicado/cancelado)</li>
                </ul>
                <p className="mt-2 text-xs">
                  <span className="font-medium">Nota:</span> Os ingressos serão vendidos através do Sympla, não haverá gerenciamento de ingressos em nossa plataforma.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            disabled={isSyncing}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing || !token.trim()}
            className="flex items-center"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Sincronizar Eventos
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 