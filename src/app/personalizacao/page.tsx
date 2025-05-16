'use client';

import NoronhaTravelChatbot from "../../components/NoronhaTravelChatbot";
import { useConvexPreferences } from "@/lib/hooks/useConvexPreferences";
import { toast } from "sonner";

export default function PersonalizationPage() {
  const { saveUserPreferences, isLoading, error, preferences } = useConvexPreferences();

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 flex justify-center items-center">
      <div className="w-full max-w-4xl px-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <NoronhaTravelChatbot 
          initialData={isLoading ? undefined : preferences}
          onComplete={async (data) => {
            try {
              const result = await saveUserPreferences(data);
              
              if (result) {
                toast.success("Preferências salvas com sucesso!");
                toast.success("Suas recomendações estão prontas!", {
                  description: "Criamos sugestões personalizadas com base nas suas preferências."
                });
              }
            } catch (err) {
              toast.error("Erro ao salvar suas preferências");
              console.error("Erro ao salvar preferências:", err);
            }
          }}
        />
      </div>
    </main>
  );
} 