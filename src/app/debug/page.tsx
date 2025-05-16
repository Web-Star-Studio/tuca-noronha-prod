import { UserDebug } from "@/components/debug/UserDebug";

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Página de Diagnóstico</h1>
      <UserDebug />
      
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h2 className="text-lg font-medium mb-2">Instruções:</h2>
        <p className="mb-4">
          Esta página é uma ferramenta temporária para diagnóstico e correção de problemas de autenticação.
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Se você estiver vendo um erro de sincronização, clique no botão "Sincronizar Usuário".</li>
          <li>Se a sincronização for bem-sucedida, você verá uma mensagem de confirmação.</li>
          <li>Se continuar com problemas, entre em contato com o suporte técnico.</li>
        </ol>
      </div>
    </div>
  );
} 