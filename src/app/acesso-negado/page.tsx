"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Suspense } from "react";

function AccessDeniedContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            Acesso Negado
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Você não tem permissão para acessar esta página ou o conteúdo solicitado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Isso pode acontecer por alguns motivos:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Você não está autenticado</li>
              <li>• Você não tem as permissões necessárias</li>
              <li>• O conteúdo não existe mais</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                Voltar para a Home
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/sign-in">
                Fazer Login
              </Link>
            </Button>
            
            <Button variant="ghost" asChild className="w-full">
              <Link href="/ajuda">
                Central de Ajuda
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  );
} 