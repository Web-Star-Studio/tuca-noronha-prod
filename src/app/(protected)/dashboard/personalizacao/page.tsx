"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cardStyles } from "@/lib/ui-config";
import NoronhaTravelChatbot from "@/components/NoronhaTravelChatbot";
import { toast } from "sonner";

// Define the chatbot data interface
interface ChatbotFormData {
  tripDuration: string;
  tripDate: string;
  companions: string;
  interests: string[];
  budget: number;
  preferences: {
    accommodation: string;
    dining: string[];
    activities: string[];
  };
  specialRequirements: string;
}

export default function DashboardPersonalizationPage() {
  const [userData, setUserData] = useState<Partial<ChatbotFormData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aqui você carregaria os dados do usuário do Convex
    // Simulando carregamento de dados
    const loadUserData = async () => {
      try {
        // Substituir por chamada real à API Convex
        // const userData = await queryUserPreferences();
        
        // Simulando dados para desenvolvimento
        setTimeout(() => {
          setUserData({
            tripDuration: "5 dias",
            companions: "Casal",
            interests: ["praia", "mergulho", "fotografia"],
            budget: 8000,
            preferences: {
              accommodation: "pousada",
              dining: ["frutos_mar", "regional"],
              activities: ["trilhas_guiadas", "passeio_barco"]
            }
          });
          setLoading(false);
        }, 800);
      } catch {
        console.error("Erro ao carregar dados de personalização:", error);
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleUpdateComplete = (data: ChatbotFormData) => {
    // Aqui você salvaria as atualizações no Convex
    console.log("Preferências atualizadas:", data);
    // Atualizar localmente
    setUserData(data);
    // Feedback ao usuário
    toast.success("Suas preferências foram atualizadas com sucesso!");
  };

  return (
    <div className="container py-6">
      <Card className={`${cardStyles.base} mb-8`}>
        <CardHeader>
          <CardTitle className="text-2xl">Personalização de Viagem</CardTitle>
          <CardDescription>
            Converse com nosso assistente virtual e personalize sua experiência em Fernando de Noronha
          </CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse text-center">
            <div className="h-6 w-48 bg-muted rounded mx-auto mb-4" />
            <div className="h-4 w-64 bg-muted rounded mx-auto" />
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <NoronhaTravelChatbot 
            initialData={userData || undefined} 
            onComplete={handleUpdateComplete} 
          />
        </div>
      )}
    </div>
  );
} 