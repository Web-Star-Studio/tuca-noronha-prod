"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export default function ReviewModerationSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Carregar configurações atuais
  const settings = useQuery(api.domains.reviews.queries.getModerationSettings, {});
  
  // Mutations
  const updateSettings = useMutation(api["domains/reviews/mutations"].updateModerationSettings);
  const initializeSettings = useMutation(api["domains/reviews/mutations"].initializeDefaultModerationSettings);

  // Estados locais para o formulário - Reviews sempre aprovadas automaticamente
  const [minimumRating, setMinimumRating] = useState(settings?.minimumRating || "");
  const [bannedWords, setBannedWords] = useState(
    settings?.bannedWords?.join(", ") || ""
  );
  const [requireVerification, setRequireVerification] = useState(
    settings?.requireVerification || false
  );

  // Atualizar estados quando as configurações carregarem
  useEffect(() => {
    if (settings && settings.exists) {
      // autoApprove sempre true, não precisa ser carregado
      setMinimumRating(settings.minimumRating || "");
      setBannedWords(settings.bannedWords?.join(", ") || "");
      setRequireVerification(settings.requireVerification);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const bannedWordsArray = bannedWords
        .split(",")
        .map((word) => word.trim())
        .filter((word) => word.length > 0);

      await updateSettings({
        autoApprove: true, // Sempre true
        minimumRating: minimumRating ? Number(minimumRating) : undefined,
        bannedWords: bannedWordsArray,
        requireVerification,
      });

      toast.success("Configurações de moderação atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeSettings = async () => {
    setIsLoading(true);
    try {
      await initializeSettings({});
      toast.success("Configurações padrão inicializadas!");
    } catch (error) {
      toast.error("Erro ao inicializar configurações");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Configurações de Moderação de Reviews
          </h1>
          <p className="text-muted-foreground">
            Configure como as reviews são moderadas no sistema
          </p>
        </div>
        
        {!settings.exists && (
          <Button onClick={handleInitializeSettings} disabled={isLoading}>
            <Settings className="h-4 w-4 mr-2" />
            Inicializar Configurações
          </Button>
        )}
      </div>

      {!settings.exists ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  Configurações não encontradas
                </h3>
                <p className="text-sm text-yellow-700">
                  Clique em &quot;Inicializar Configurações&quot; para criar as configurações padrão de moderação.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Status Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Status Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ATIVADA
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Aprovação Automática
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {minimumRating || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rating Mínimo
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {bannedWords.split(",").filter(w => w.trim()).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Palavras Banidas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {requireVerification ? "SIM" : "NÃO"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Verificação Obrigatória
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informação sobre aprovação automática */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-800">
                    Reviews são aprovadas automaticamente
                  </h3>
                  <p className="text-sm text-green-700">
                    Todas as reviews dos usuários são aceitas automaticamente. O master admin pode responder ou deletar reviews em /admin/reviews/.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Opcionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Palavras Banidas */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">
                    Palavras Banidas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Reviews contendo essas palavras precisarão de moderação manual
                  </p>
                </div>
                <Textarea
                  placeholder="spam, golpe, fraude, horrível (separadas por vírgula)"
                  value={bannedWords}
                  onChange={(e) => setBannedWords(e.target.value)}
                  rows={3}
                />
                {bannedWords && (
                  <div className="flex flex-wrap gap-2">
                    {bannedWords
                      .split(",")
                      .map((word) => word.trim())
                      .filter((word) => word)
                      .map((word, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {word}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => {
                              const words = bannedWords.split(",").map(w => w.trim());
                              words.splice(words.indexOf(word), 1);
                              setBannedWords(words.join(", "));
                            }}
                          />
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                // autoApprove é sempre true, não precisa resetar
                setMinimumRating(settings.minimumRating || "");
                setBannedWords(settings.bannedWords?.join(", ") || "");
                setRequireVerification(settings.requireVerification);
              }}
            >
              Resetar
            </Button>
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 