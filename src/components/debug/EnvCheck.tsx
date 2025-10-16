"use client";

import { useEffect, useState } from "react";

export function EnvCheck() {
  const [publicKey, setPublicKey] = useState<string | undefined>();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    setPublicKey(key);
    console.log("[ENV CHECK] NEXT_PUBLIC_MP_PUBLIC_KEY:", key ? "✓ Configurada" : "✗ Não encontrada");
    console.log("[ENV CHECK] Valor (primeiros 20 chars):", key?.substring(0, 20));
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Verificação de Variáveis de Ambiente</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>NEXT_PUBLIC_MP_PUBLIC_KEY:</strong>{" "}
          {publicKey ? (
            <span className="text-green-600">✓ Configurada ({publicKey.substring(0, 20)}...)</span>
          ) : (
            <span className="text-red-600">✗ NÃO ENCONTRADA</span>
          )}
        </div>
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>⚠️ Se não encontrada:</strong>
          <ol className="list-decimal ml-4 mt-1">
            <li>Verifique se a variável está na Vercel</li>
            <li>Faça <strong>Redeploy</strong> do projeto</li>
            <li>Aguarde o deploy completar</li>
            <li>Recarregue esta página</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
