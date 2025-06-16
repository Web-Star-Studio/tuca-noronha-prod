"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Calendar, Compass, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { use } from "react";

export default function HostingDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);

  return (
    <>
      {/* Hero Section */}
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Hospedagem Indisponível
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                O módulo de hospedagens está temporariamente indisponível
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Breadcrumb navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para página inicial
          </Link>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-8 shadow-lg">
            <CardContent className="space-y-6">
              <div className="flex justify-center mb-6">
                <Home className="h-16 w-16 text-blue-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Hospedagem Temporariamente Indisponível
              </h2>
              
              <p className="text-lg text-gray-600 mb-4">
                A hospedagem <strong>"{params.slug}"</strong> que você está procurando 
                não pode ser exibida no momento.
              </p>
              
              <p className="text-gray-600 mb-8">
                Estamos trabalhando para melhorar nossa plataforma de hospedagens. 
                Enquanto isso, confira nossas outras opções de serviços disponíveis.
              </p>

              {/* Alternative Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Link href="/atividades">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200">
                    <Compass className="h-6 w-6" />
                    <span className="text-sm font-medium">Atividades</span>
                  </Button>
                </Link>

                <Link href="/eventos">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm font-medium">Eventos</span>
                  </Button>
                </Link>

                <Link href="/restaurantes">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200">
                    <UtensilsCrossed className="h-6 w-6" />
                    <span className="text-sm font-medium">Restaurantes</span>
                  </Button>
                </Link>

                <Link href="/">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200">
                    <Home className="h-6 w-6" />
                    <span className="text-sm font-medium">Página Inicial</span>
                  </Button>
                </Link>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Em breve:</strong> Voltaremos com uma experiência ainda melhor 
                  para encontrar e reservar as melhores hospedagens em Fernando de Noronha.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}