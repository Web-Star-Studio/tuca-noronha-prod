"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Activity, Calendar, Utensils, Car } from "lucide-react";

export default function AccommodationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent pb-1">
            Hospedagens
          </h1>
          <p className="text-gray-600">
            O módulo de hospedagens está temporariamente indisponível.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card className="p-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <Home className="h-16 w-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
            Módulo Temporariamente Indisponível
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-lg text-gray-600 mb-8">
            Estamos trabalhando para melhorar nossa plataforma de gestão de hospedagens. 
            Enquanto isso, você pode gerenciar outros tipos de assets disponíveis.
          </p>

          {/* Alternative Management Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Link href="/admin/dashboard/atividades">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200">
                <Activity className="h-6 w-6" />
                <span className="text-sm font-medium">Atividades</span>
              </Button>
            </Link>

            <Link href="/admin/dashboard/eventos">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-white">
                <Calendar className="h-6 w-6" />
                <span className="text-sm font-medium">Eventos</span>
              </Button>
            </Link>

            <Link href="/admin/dashboard/restaurantes">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200">
                <Utensils className="h-6 w-6" />
                <span className="text-sm font-medium">Restaurantes</span>
              </Button>
            </Link>

            <Link href="/admin/dashboard/vehicles">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200">
                <Car className="h-6 w-6" />
                <span className="text-sm font-medium">Veículos</span>
              </Button>
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Em breve:</strong> Voltaremos com ferramentas ainda melhores 
              para gerenciar hospedagens e acomodações na plataforma.
            </p>
          </div>

          <div className="mt-6">
            <Link href="/admin/dashboard">
              <Button variant="outline" className="w-full md:w-auto">
                Voltar ao Dashboard Principal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 