"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  MessageCircle, 
  Building, 
  Palette, 
  Shield,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function ConfiguracoesPage() {
  const currentUser = useCurrentUser();
  
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

  // Estados para diferentes configurações
  const [communicationSettings, setCommunicationSettings] = useState({
    whatsappNumber: "",
    businessName: "",
    supportEmail: "",
    supportPhone: "",
  });

  const [businessSettings, setBusinessSettings] = useState({
    companyName: "",
    cnpj: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const [uiSettings, setUiSettings] = useState({
    primaryColor: "",
    footerText: "",
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maxBookingDaysAdvance: 365,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const publicSettings = useQuery(api.domains.systemSettings.queries.getPublicSettings);
  const allSettings = useQuery(api.domains.systemSettings.queries.getAllSettings);

  // Mutations
  const updateSetting = useMutation(api.domains.systemSettings.mutations.updateSetting);
  const createSetting = useMutation(api.domains.systemSettings.mutations.createSetting);
  const initializeSettings = useMutation(api.domains.systemSettings.mutations.initializeDefaultSettings);
  const toggleMaintenance = useMutation(api.domains.systemSettings.mutations.toggleMaintenanceMode);

  // Carregar configurações quando disponíveis
  useState(() => {
    if (publicSettings) {
      setCommunicationSettings({
        whatsappNumber: publicSettings.whatsapp.adminNumber,
        businessName: publicSettings.whatsapp.businessName,
        supportEmail: publicSettings.support.email,
        supportPhone: publicSettings.support.phone,
      });

      setBusinessSettings({
        companyName: publicSettings.business.companyName,
        cnpj: "", // Não é público
        address: publicSettings.business.address,
      });

      setUiSettings({
        primaryColor: publicSettings.ui.primaryColor,
        footerText: publicSettings.ui.footerText,
      });
    }
  });

  const handleSaveCommunication = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateSetting({
          key: "whatsapp.admin_number",
          value: communicationSettings.whatsappNumber,
          type: "string",
        }),
        updateSetting({
          key: "whatsapp.business_name",
          value: communicationSettings.businessName,
          type: "string",
        }),
        updateSetting({
          key: "support.email",
          value: communicationSettings.supportEmail,
          type: "string",
        }),
        updateSetting({
          key: "support.phone",
          value: communicationSettings.supportPhone,
          type: "string",
        }),
      ]);
      
      toast.success("Configurações de comunicação atualizadas!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateSetting({
          key: "business.company_name",
          value: businessSettings.companyName,
          type: "string",
        }),
        updateSetting({
          key: "business.address",
          value: businessSettings.address,
          type: "object",
        }),
      ]);
      
      toast.success("Configurações da empresa atualizadas!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUI = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateSetting({
          key: "ui.primary_color",
          value: uiSettings.primaryColor,
          type: "string",
        }),
        updateSetting({
          key: "ui.footer_text",
          value: uiSettings.footerText,
          type: "string",
        }),
      ]);
      
      toast.success("Configurações de interface atualizadas!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMaintenanceMode = async () => {
    try {
      await toggleMaintenance({ enabled: !systemSettings.maintenanceMode });
      setSystemSettings(prev => ({ 
        ...prev, 
        maintenanceMode: !prev.maintenanceMode 
      }));
      toast.success(`Modo de manutenção ${!systemSettings.maintenanceMode ? "ativado" : "desativado"}!`);
    } catch (error) {
      toast.error("Erro ao alterar modo de manutenção");
      console.error(error);
    }
  };

  const handleInitializeSettings = async () => {
    try {
      await initializeSettings();
      toast.success("Configurações padrão inicializadas!");
    } catch (error) {
      toast.error("Erro ao inicializar configurações");
      console.error(error);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configurações do Sistema
          </h1>
          <p className="text-gray-600">
            Gerencie as configurações globais da plataforma
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Sistema Operacional</p>
                <p className="text-sm text-gray-600">Todas as configurações ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Modo de Manutenção</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={handleToggleMaintenanceMode}
                    size="sm"
                  />
                  <span className="text-sm text-gray-600">
                    {systemSettings.maintenanceMode ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Configurações</p>
                <p className="text-sm text-gray-600">
                  {allSettings?.length || 0} configurações ativas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Tabs defaultValue="communication" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="communication" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Comunicação
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-2">
            <Palette className="h-4 w-4" />
            Interface
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Shield className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Comunicação */}
        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Configurações de Comunicação
              </CardTitle>
              <CardDescription>
                Configure os canais de comunicação da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">Número do WhatsApp Admin</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <Input
                      id="whatsapp-number"
                      value={communicationSettings.whatsappNumber}
                      onChange={(e) => {
                        setCommunicationSettings(prev => ({ 
                          ...prev, 
                          whatsappNumber: e.target.value 
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="+5581999999999"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Número usado nos botões de WhatsApp em toda a plataforma
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-name">Nome do Negócio</Label>
                  <Input
                    id="business-name"
                    value={communicationSettings.businessName}
                    onChange={(e) => {
                      setCommunicationSettings(prev => ({ 
                        ...prev, 
                        businessName: e.target.value 
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="Turismo Noronha"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Email de Suporte</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="support-email"
                      type="email"
                      value={communicationSettings.supportEmail}
                      onChange={(e) => {
                        setCommunicationSettings(prev => ({ 
                          ...prev, 
                          supportEmail: e.target.value 
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="contato@turismonoronha.com.br"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-phone">Telefone de Suporte</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <Input
                      id="support-phone"
                      value={communicationSettings.supportPhone}
                      onChange={(e) => {
                        setCommunicationSettings(prev => ({ 
                          ...prev, 
                          supportPhone: e.target.value 
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="+5581987654321"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveCommunication}
                  disabled={isLoading || !hasChanges}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Comunicação
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Empresa */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Configure as informações básicas da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={businessSettings.companyName}
                    onChange={(e) => {
                      setBusinessSettings(prev => ({ 
                        ...prev, 
                        companyName: e.target.value 
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="Turismo Noronha Ltda"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={businessSettings.cnpj}
                    onChange={(e) => {
                      setBusinessSettings(prev => ({ 
                        ...prev, 
                        cnpj: e.target.value 
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Endereço</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={businessSettings.address.street}
                      onChange={(e) => {
                        setBusinessSettings(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, street: e.target.value }
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="Rua Principal, 123"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={businessSettings.address.city}
                      onChange={(e) => {
                        setBusinessSettings(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, city: e.target.value }
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="Fernando de Noronha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={businessSettings.address.state}
                      onChange={(e) => {
                        setBusinessSettings(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, state: e.target.value }
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="PE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={businessSettings.address.zipCode}
                      onChange={(e) => {
                        setBusinessSettings(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, zipCode: e.target.value }
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="53990-000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveBusiness}
                  disabled={isLoading || !hasChanges}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interface */}
        <TabsContent value="ui">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configurações de Interface
              </CardTitle>
              <CardDescription>
                Personalize a aparência da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: uiSettings.primaryColor }}
                    />
                    <Input
                      id="primary-color"
                      value={uiSettings.primaryColor}
                      onChange={(e) => {
                        setUiSettings(prev => ({ 
                          ...prev, 
                          primaryColor: e.target.value 
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="#0066CC"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Texto do Rodapé</Label>
                <Textarea
                  id="footer-text"
                  value={uiSettings.footerText}
                  onChange={(e) => {
                    setUiSettings(prev => ({ 
                      ...prev, 
                      footerText: e.target.value 
                    }));
                    setHasChanges(true);
                  }}
                  placeholder="© 2024 Turismo Noronha. Todos os direitos reservados."
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveUI}
                  disabled={isLoading || !hasChanges}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Interface
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configure aspectos técnicos da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">Modo de Manutenção</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Quando ativo, apenas administradores podem acessar a plataforma.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Switch
                          checked={systemSettings.maintenanceMode}
                          onCheckedChange={handleToggleMaintenanceMode}
                        />
                        <span className="text-sm font-medium text-amber-900">
                          {systemSettings.maintenanceMode ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {(!allSettings || allSettings.length === 0) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Inicializar Configurações</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Nenhuma configuração foi encontrada. Clique para inicializar as configurações padrão.
                        </p>
                        <Button
                          onClick={handleInitializeSettings}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                        >
                          Inicializar Configurações
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 