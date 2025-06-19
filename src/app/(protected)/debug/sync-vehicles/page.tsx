"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SyncVehiclesPage() {
  const [result, setResult] = useState<{ synced: number; errors: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const syncVehicles = useMutation(api.domains.vehicles.mutations.syncVehiclesWithOrganizations);
  
  const handleSync = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const syncResult = await syncVehicles({});
      setResult(syncResult);
      
      if (syncResult.synced > 0) {
        toast.success(`${syncResult.synced} veículos sincronizados com sucesso!`);
      }
      
      if (syncResult.errors.length > 0) {
        toast.warning(`${syncResult.errors.length} erros encontrados durante a sincronização`);
      }
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast.error("Erro ao executar sincronização");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sincronização de Veículos</h1>
        <p className="text-gray-600 mt-2">
          Esta ferramenta sincroniza veículos existentes com a tabela partnerAssets para corrigir problemas de visualização no dashboard de reservas.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Sincronizar Veículos com Organizações
          </CardTitle>
          <CardDescription>
            Esta operação irá verificar todos os veículos existentes e associá-los às organizações corretas na tabela partnerAssets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSync} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              "Executar Sincronização"
            )}
          </Button>
          
          {result && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sincronização concluída:</strong> {result.synced} veículos foram sincronizados com sucesso.
                </AlertDescription>
              </Alert>
              
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erros encontrados:</strong>
                    <ul className="mt-2 list-disc list-inside">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. Verifica todos os veículos existentes na base de dados</p>
          <p>2. Para cada veículo, verifica se já existe uma entrada na tabela partnerAssets</p>
          <p>3. Se não existe, busca a organização do tipo "rental_service" do proprietário</p>
          <p>4. Cria a associação na tabela partnerAssets</p>
          <p>5. Retorna o número de veículos sincronizados e eventuais erros</p>
        </CardContent>
      </Card>
    </div>
  );
} 