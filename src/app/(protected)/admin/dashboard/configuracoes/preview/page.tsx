"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  MessageCircle, 
  Building, 
  Palette, 
  Shield,
  Eye,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { DashboardPageHeader } from "../../components";
import { useSystemSettings, useWhatsAppLink } from "@/lib/hooks/useSystemSettings";
import { HelpSection, GlobalContactButton } from "@/components/contact";

export default function ConfiguracoesPreviewPage() {
  const currentUser = useCurrentUser();
  const settings = useSystemSettings();
  const { generateWhatsAppLink } = useWhatsAppLink();
  
  // Verificar se é admin master
  if (!currentUser.user || currentUser.user.role !== "master") {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
            <p className="text-gray-600">Apenas administradores master podem acessar as configurações do sistema.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title="Preview das Configurações"
        description="Visualize como as configurações estão sendo aplicadas na plataforma"
        icon={Eye}
      />

      {/* Status das Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">WhatsApp</p>
                <p className="text-xs text-gray-500">Configurado</p>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-xs text-gray-500">Configurado</p>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Telefone</p>
                <p className="text-xs text-gray-500">Configurado</p>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresa</p>
                <p className="text-xs text-gray-500">Configurado</p>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações Ativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de Comunicação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Configurações de Comunicação
            </CardTitle>
            <CardDescription>
              Informações de contato usadas em toda a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">WhatsApp</span>
                </div>
                <Badge variant="secondary">{settings.whatsappNumber}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Email</span>
                </div>
                <Badge variant="secondary">{settings.supportEmail}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Telefone</span>
                </div>
                <Badge variant="secondary">{settings.supportPhone}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Dados da empresa usados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Nome da Empresa</span>
                <Badge variant="secondary">{settings.companyName}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Nome do Negócio</span>
                <Badge variant="secondary">{settings.businessName}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testes de Componentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Teste dos Componentes de Contato
          </CardTitle>
          <CardDescription>
            Visualize como os componentes de contato aparecem para os usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Botão de Contato Global (Dropdown)</h4>
              <GlobalContactButton 
                variant="outline"
                customMessage="Esta é uma mensagem de teste das configurações"
                showDropdown={true}
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Botão WhatsApp Direto</h4>
              <GlobalContactButton 
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50"
                customMessage="Esta é uma mensagem de teste das configurações"
                showDropdown={false}
              />
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Seção de Ajuda Completa</h4>
            <div className="max-w-md">
              <HelpSection 
                customMessage="Esta é uma mensagem de teste das configurações do sistema"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links Úteis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Links de Teste
          </CardTitle>
          <CardDescription>
            Teste os links de contato gerados pelas configurações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                const url = generateWhatsAppLink("Mensagem de teste das configurações");
                window.open(url, '_blank');
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Testar WhatsApp
              <ExternalLink className="h-3 w-3" />
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                window.location.href = `mailto:${settings.supportEmail}`;
              }}
            >
              <Mail className="h-4 w-4" />
              Testar Email
              <ExternalLink className="h-3 w-3" />
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                const cleanPhone = settings.supportPhone.replace(/\D/g, '');
                window.location.href = `tel:${cleanPhone}`;
              }}
            >
              <Phone className="h-4 w-4" />
              Testar Telefone
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 