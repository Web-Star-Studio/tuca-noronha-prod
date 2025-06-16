'use client';

import PersonalizationChatbot from "../../components/PersonalizationChatbot";
import { useConvexPreferences } from "@/lib/hooks/useConvexPreferences";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function PersonalizationPage() {
  const { saveUserPreferences, isLoading, error, preferences } = useConvexPreferences();
  const router = useRouter();
  const { user } = useUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 py-12 px-4">
      <div className="w-full max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 max-w-2xl mx-auto">
            <p className="text-sm font-medium">⚠️ {error}</p>
          </div>
        )}
        
        <PersonalizationChatbot 
          userName={user?.firstName || "Visitante"}
          initialData={isLoading ? undefined : preferences}
          onComplete={async (data) => {
            try {
              const result = await saveUserPreferences(data);
              
              if (result) {
                toast.success("🎯 Perfil criado com sucesso!", {
                  description: "Suas recomendações inteligentes estão sendo preparadas..."
                });
                
                // Aguardar um pouco para mostrar a mensagem
                setTimeout(() => {
                  toast.success("✨ Recomendações IA prontas!", {
                    description: "Redirecionando para seu painel personalizado...",
                    duration: 3000
                  });
                  
                  // Redirecionar para a seção de recomendações
                  setTimeout(() => {
                    router.push("/meu-painel?section=recomendacoes");
                  }, 1500);
                }, 1000);
              }
            } catch (err) {
              toast.error("❌ Erro ao salvar preferências", {
                description: "Tente novamente em alguns instantes."
              });
              console.error("Erro ao salvar preferências:", err);
            }
          }}
        />
      </div>
    </main>
  );
} 