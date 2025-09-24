"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DebugTaxasPage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const partners = useQuery(api.domains.partners.queries.listPartners, {});
  const users = useQuery(api.domains.users.queries.getAll, {});
  const createTestPartner = useMutation(api.domains.partners.mutations.createTestPartner);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filtrar apenas usuários com role partner
  const partnerUsers = users?.filter(u => u.role === "partner");

  const handleCreateTestPartner = async (userId: string, name: string, email: string) => {
    setIsCreating(true);
    try {
      await createTestPartner({
        userId: userId as any,
        name,
        email,
        feePercentage: 15, // Taxa padrão de 15%
      });
      toast({
        title: "Partner de teste criado",
        description: "O partner foi criado com sucesso para testes.",
      });
    } catch {
      toast({
        title: "Erro ao criar partner",
        description: "Não foi possível criar o partner de teste.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Debug - Sistema de Taxas</h1>
          <p className="text-muted-foreground">Verificação de dados do sistema</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/admin/dashboard/configuracoes/taxas"}
        >
          Voltar para Taxas
        </Button>
      </div>

      {/* Informações do Usuário Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Usuário Atual</CardTitle>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <p>Carregando...</p>
          ) : user ? (
            <div className="space-y-2">
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> <Badge>{user.role}</Badge></p>
              <p><strong>ID:</strong> <code className="text-xs">{user._id}</code></p>
              <p><strong>Clerk ID:</strong> <code className="text-xs">{user.clerkId}</code></p>
            </div>
          ) : (
            <p className="text-red-500">Usuário não encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Status da Query de Partners */}
      <Card>
        <CardHeader>
          <CardTitle>Partners (tabela partners)</CardTitle>
        </CardHeader>
        <CardContent>
          {partners === undefined ? (
            <p>Carregando...</p>
          ) : partners === null ? (
            <p className="text-red-500">Erro ao carregar partners</p>
          ) : (
            <div className="space-y-4">
              <p><strong>Total de partners:</strong> {partners.length}</p>
              
              {partners.length > 0 ? (
                <div className="space-y-4">
                  {partners.map((partner) => (
                    <div key={partner._id} className="border rounded p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={partner.isActive ? "default" : "secondary"}>
                          {partner.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">{partner.onboardingStatus}</Badge>
                      </div>
                      <p><strong>Partner ID:</strong> <code className="text-xs">{partner._id}</code></p>
                      <p><strong>User ID:</strong> <code className="text-xs">{partner.userId}</code></p>
                      <p><strong>Taxa:</strong> {partner.feePercentage}%</p>
                      <p><strong>Conta de pagamentos:</strong> <span className="text-xs text-muted-foreground">configuração assistida</span></p>
                      {partner.user && (
                        <div className="pl-4 border-l-2">
                          <p><strong>Nome:</strong> {partner.user.name}</p>
                          <p><strong>Email:</strong> {partner.user.email}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum partner encontrado na tabela partners. Isso pode acontecer se:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Nenhum partner finalizou a habilitação de pagamentos ainda</li>
                      <li>Os partners existentes não foram migrados para o novo sistema</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuários com Role Partner */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários com Role Partner (tabela users)</CardTitle>
        </CardHeader>
        <CardContent>
          {users === undefined ? (
            <p>Carregando...</p>
          ) : users === null ? (
            <p className="text-red-500">Erro ao carregar usuários</p>
          ) : (
            <div className="space-y-4">
              <p><strong>Total de usuários com role partner:</strong> {partnerUsers?.length || 0}</p>
              
              {partnerUsers && partnerUsers.length > 0 ? (
                <div className="space-y-4">
                  {partnerUsers.map((user) => (
                    <div key={user._id} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p><strong>Nome:</strong> {user.name}</p>
                          <p><strong>Email:</strong> {user.email}</p>
                          <p><strong>User ID:</strong> <code className="text-xs">{user._id}</code></p>
                          <Badge>{user.role}</Badge>
                        </div>
                        {user.role === "partner" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateTestPartner(user._id, user.name || "Partner Teste", user.email || "")}
                            disabled={isCreating || partners?.some(p => p.userId === user._id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {partners?.some(p => p.userId === user._id) ? "Já tem Partner" : "Criar Partner"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum usuário com role &quot;partner&quot; encontrado.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>O que fazer?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Para que parceiros apareçam na lista de taxas, eles precisam:
              <ol className="list-decimal pl-6 mt-2">
                <li>Ter um usuário com role &quot;partner&quot; na tabela users</li>
                <li>Finalizar a habilitação de pagamentos junto ao time financeiro (ou ter um registro na tabela partners)</li>
                <li>Ter um registro correspondente na tabela partners</li>
              </ol>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Próximos passos:</h3>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Se não há usuários partner, crie um usuário e defina seu role como &quot;partner&quot;</li>
              <li>Se há usuários partner mas não há registros na tabela partners, clique em &quot;Criar Partner&quot; ao lado do usuário</li>
              <li>Volte para a página de taxas para ver os partners listados</li>
            </ol>
          </div>

          <Alert className="border-orange-200 bg-orange-50">
            <InfoIcon className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Nota:</strong> Os botões &quot;Criar Partner&quot; criam registros de teste apenas para desenvolvimento. 
              Em produção, os partners devem ter a habilitação de recebimentos concluída com a equipe financeira.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 
