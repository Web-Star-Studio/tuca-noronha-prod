'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Edit, Save, AlertTriangle, Check, RefreshCw, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NoronhaTravelChatbot from '@/components/NoronhaTravelChatbot';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useConvexPreferences } from '@/lib/hooks/useConvexPreferences';
import { TravelPreferences } from '@/lib/hooks/useConvexPreferences';

export default function PreferencesSection() {
  const { user } = useUser();
  const { 
    preferences, 
    isLoading, 
    error, 
    saveUserPreferences, 
    removeUserPreferences 
  } = useConvexPreferences();
  
  const [showChatbot, setShowChatbot] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);

  // Update the state based on loaded preferences
  useEffect(() => {
    if (preferences) {
      setHasPreferences(true);
    } else {
      setHasPreferences(false);
    }
  }, [preferences]);

  const handlePreferenceUpdate = async (key: string, value: any) => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      
      // Create a deep copy of preferences
      const updatedPreferences = JSON.parse(JSON.stringify(preferences));
      
      // Handle nested keys like 'preferences.accommodation'
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.');
        updatedPreferences[parentKey][childKey] = value;
      } else {
        updatedPreferences[key] = value;
      }
      
      await saveUserPreferences(updatedPreferences);
      toast.success('Preferência atualizada');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Erro ao atualizar preferência');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatbotComplete = async (data: TravelPreferences) => {
    try {
      setIsSaving(true);
      await saveUserPreferences(data);
      setShowChatbot(false);
      toast.success('Preferências salvas com sucesso!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPreferences = async () => {
    const shouldReset = confirm('Tem certeza que deseja resetar todas as suas preferências?');
    
    if (shouldReset) {
      try {
        setIsSaving(true);
        await removeUserPreferences();
        toast.success('Preferências removidas com sucesso');
        setHasPreferences(false);
      } catch (error) {
        console.error('Error removing preferences:', error);
        toast.error('Erro ao remover preferências');
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-3 text-lg">Carregando preferências...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Minhas Preferências</h2>
        
        <div className="flex gap-2">
          {hasPreferences && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPreferences}
              disabled={isSaving}
            >
              Resetar Preferências
            </Button>
          )}
          
          <Button
            variant={hasPreferences ? "outline" : "default"}
            onClick={() => setShowChatbot(!showChatbot)}
            className="flex items-center gap-1.5"
            disabled={isSaving}
          >
            {hasPreferences ? (
              <>
                <Edit className="h-4 w-4" />
                {showChatbot ? "Esconder Editor" : "Editar Preferências"}
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                Definir Preferências
              </>
            )}
          </Button>
        </div>
      </div>

      {!hasPreferences && !showChatbot && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-8">
              <User className="h-12 w-12 text-primary/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sem Preferências Definidas</h3>
              <p className="text-gray-500 max-w-md mb-4">
                Defina suas preferências para recebermos recomendações personalizadas 
                para sua viagem a Fernando de Noronha.
              </p>
              <Button onClick={() => setShowChatbot(true)}>
                Definir Minhas Preferências
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasPreferences && !showChatbot && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/20 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Check className="h-5 w-5 text-primary" />
                Suas Preferências Atuais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Duração da Viagem</h4>
                    <p className="font-medium">
                      {preferences?.tripDuration === '3-4' && '3 a 4 dias'}
                      {preferences?.tripDuration === '5-7' && '5 a 7 dias'}
                      {preferences?.tripDuration === '8-10' && '8 a 10 dias'}
                      {preferences?.tripDuration === '10+' && 'Mais de 10 dias'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Período</h4>
                    <p className="font-medium">
                      {preferences?.tripDate === 'dez-mar' && 'Verão (dez-mar)'}
                      {preferences?.tripDate === 'abr-jul' && 'Outono/Inverno (abr-jul)'}
                      {preferences?.tripDate === 'ago-nov' && 'Primavera (ago-nov)'}
                      {preferences?.tripDate === 'proximos3' && 'Próximos 3 meses'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Acompanhantes</h4>
                    <p className="font-medium">
                      {preferences?.companions === 'sozinho' && 'Viajando sozinho'}
                      {preferences?.companions === 'casal' && 'Casal'}
                      {preferences?.companions === 'familia' && 'Família com crianças'}
                      {preferences?.companions === 'amigos' && 'Grupo de amigos'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Orçamento</h4>
                    <p className="font-medium">
                      {preferences?.budget && new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(preferences.budget)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Tipo de Hospedagem</h4>
                    <p className="font-medium">
                      {preferences?.preferences?.accommodation === 'pousada' && 'Pousada aconchegante'}
                      {preferences?.preferences?.accommodation === 'resort' && 'Resort com mais estrutura'}
                      {preferences?.preferences?.accommodation === 'casa' && 'Casa/Apartamento inteiro'}
                      {preferences?.preferences?.accommodation === 'camping' && 'Camping/Opção econômica'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Interesses</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.interests && preferences.interests.map(interest => {
                      const label = 
                        interest === 'praia' ? 'Praias' :
                        interest === 'mergulho' ? 'Mergulho' :
                        interest === 'snorkel' ? 'Snorkeling' :
                        interest === 'trilhas' ? 'Trilhas' :
                        interest === 'fotografia' ? 'Fotografia' :
                        interest === 'passeio_barco' ? 'Passeio de Barco' :
                        interest === 'por_do_sol' ? 'Pôr do Sol' :
                        interest === 'vida_noturna' ? 'Vida Noturna' : 
                        interest;
                      
                      return (
                        <div 
                          key={interest} 
                          className="bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-sm"
                        >
                          {label}
                        </div>
                      );
                    })}
                    {(!preferences?.interests || preferences.interests.length === 0) && (
                      <p className="text-gray-400 text-sm">Nenhum interesse selecionado</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Preferências Gastronômicas</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.preferences?.dining && preferences.preferences.dining.map(item => {
                      const label = 
                        item === 'frutos_mar' ? 'Frutos do Mar' :
                        item === 'regional' ? 'Comida Regional' :
                        item === 'vegetariana' ? 'Opções Vegetarianas' :
                        item === 'gourmet' ? 'Alta Gastronomia' :
                        item === 'economica' ? 'Opções Econômicas' : 
                        item;
                      
                      return (
                        <div 
                          key={item} 
                          className="bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-3 py-1 text-sm"
                        >
                          {label}
                        </div>
                      );
                    })}
                    {(!preferences?.preferences?.dining || preferences.preferences.dining.length === 0) && (
                      <p className="text-gray-400 text-sm">Nenhuma preferência gastronômica selecionada</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Atividades Preferidas</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.preferences?.activities && preferences.preferences.activities.map(activity => {
                      const label = 
                        activity === 'trilhas_guiadas' ? 'Trilhas Guiadas' :
                        activity === 'passeio_barco' ? 'Passeio de Barco' :
                        activity === 'mergulho_avancado' ? 'Mergulho Avançado' :
                        activity === 'tour_historico' ? 'Tour Histórico' :
                        activity === 'observacao_fauna' ? 'Observação de Fauna' :
                        activity === 'por_do_sol_baia' ? 'Pôr do Sol na Baía' : 
                        activity;
                      
                      return (
                        <div 
                          key={activity} 
                          className="bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-sm"
                        >
                          {label}
                        </div>
                      );
                    })}
                    {(!preferences?.preferences?.activities || preferences.preferences.activities.length === 0) && (
                      <p className="text-gray-400 text-sm">Nenhuma atividade selecionada</p>
                    )}
                  </div>
                </div>
                
                {preferences?.specialRequirements && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Requisitos Especiais</h4>
                    <p className="bg-gray-50 p-3 rounded border text-gray-700">
                      {preferences.specialRequirements}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showChatbot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <NoronhaTravelChatbot 
            userName={user?.firstName || "Visitante"}
            initialData={preferences || undefined}
            onComplete={handleChatbotComplete}
          />
        </motion.div>
      )}
    </div>
  );
}
