"use client";

import React from "react";
import PackageRequestForm from "@/components/packages/PackageRequestForm";

export default function SolicitarPacotePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Solicite Seu Pacote Personalizado
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conte-nos sobre a viagem dos seus sonhos e nossa equipe criará uma proposta 
            exclusiva e personalizada para você. É rápido, fácil e sem compromisso!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 max-w-6xl mx-auto">
          <PackageRequestForm 
            onSuccess={(requestNumber) => {
              // Opcional: redirecionar ou mostrar mensagem adicional
              console.log("Solicitação criada:", requestNumber);
            }}
          />
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="text-lg font-semibold mb-2">Preencha o Formulário</h3>
              <p className="text-gray-600">
                Conte-nos sobre suas preferências, orçamento e expectativas para a viagem.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="text-lg font-semibold mb-2">Receba Nossa Proposta</h3>
              <p className="text-gray-600">
                Nossa equipe analisará sua solicitação e criará uma proposta personalizada.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="text-lg font-semibold mb-2">Confirme Sua Viagem</h3>
              <p className="text-gray-600">
                Aprove a proposta e deixe conosco todos os detalhes da sua viagem perfeita.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 