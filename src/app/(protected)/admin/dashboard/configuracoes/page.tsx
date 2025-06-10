"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  Settings, 
  Globe, 
  Shield, 
  Bell,
  Database,
  Mail,
  Palette,
  Users,
  CreditCard,
  Lock,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Key
} from "lucide-react"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function ConfiguracoesPage() {
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Estados para as configurações
  const [settings, setSettings] = useState({
    // Configurações Gerais
    siteName: "Tuca Noronha",
    siteDescription: "Sua experiência completa em Fernando de Noronha",
    siteUrl: "https://tucanoronha.com.br",
    defaultLanguage: "pt-BR",
    timezone: "America/Recife",
    maintenanceMode: false,
    
    // Configurações de Segurança
    twoFactorRequired: false,
    sessionTimeout: 120, // minutos
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    
    // Configurações de Email
    emailProvider: "sendgrid",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: 587,
    smtpUser: "apikey",
    smtpPassword: "************",
    fromEmail: "noreply@tucanoronha.com.br",
    fromName: "Tuca Noronha",
    
    // Configurações de Pagamento
    stripePublicKey: "pk_test_...",
    stripeSecretKey: "sk_test_...",
    mercadoPagoAccessToken: "APP_USR_...",
    pixKey: "contato@tucanoronha.com.br",
    
    // Configurações de Notificações
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyNewBooking: true,
    notifyPaymentReceived: true,
    notifyNewUser: false,
    
    // APIs Externas
    googleMapsApiKey: "AIza...",
    whatsappApiKey: "...",
    
    // Configurações de Sistema
    backupFrequency: "daily",
    logRetentionDays: 90,
    maxFileUploadSize: 10, // MB
    allowedFileTypes: "jpg,jpeg,png,pdf,doc,docx"
  })

  const handleSave = async () => {
    setSaving(true)
    // Simular salvamento
    setTimeout(() => {
      setSaving(false)
      // Mostrar sucesso
    }, 2000)
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
            <p className="text-sm text-gray-600">
              Gerencie configurações globais da plataforma
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Configurações */}
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Informações do Site
                </CardTitle>
                <CardDescription>
                  Configurações básicas da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange("siteName", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descrição</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">URL do Site</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => handleSettingChange("siteUrl", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações Regionais
                </CardTitle>
                <CardDescription>
                  Idioma, fuso horário e localização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Idioma Padrão</Label>
                  <Select value={settings.defaultLanguage} onValueChange={(value) => handleSettingChange("defaultLanguage", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Recife">America/Recife (UTC-3)</SelectItem>
                      <SelectItem value="America/Sao_Paulo">America/São_Paulo (UTC-3)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-gray-500">
                      Bloqueia acesso ao site para usuários
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seguranca">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Autenticação
                </CardTitle>
                <CardDescription>
                  Configurações de segurança e autenticação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação 2FA Obrigatória</Label>
                    <p className="text-sm text-gray-500">
                      Exige 2FA para todos os usuários
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorRequired}
                    onCheckedChange={(checked) => handleSettingChange("twoFactorRequired", checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Comprimento Mínimo da Senha</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleSettingChange("passwordMinLength", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sistema
                </CardTitle>
                <CardDescription>
                  Configurações de backup e logs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Frequência de Backup</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange("backupFrequency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logRetentionDays">Retenção de Logs (dias)</Label>
                  <Input
                    id="logRetentionDays"
                    type="number"
                    value={settings.logRetentionDays}
                    onChange={(e) => handleSettingChange("logRetentionDays", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxFileUploadSize">Tamanho Máximo de Upload (MB)</Label>
                  <Input
                    id="maxFileUploadSize"
                    type="number"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => handleSettingChange("maxFileUploadSize", parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
              <CardDescription>
                Configure o serviço de envio de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailProvider">Provedor de Email</Label>
                  <Select value={settings.emailProvider} onValueChange={(value) => handleSettingChange("emailProvider", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="smtp">SMTP Customizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email Remetente</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.fromEmail}
                    onChange={(e) => handleSettingChange("fromEmail", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nome Remetente</Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => handleSettingChange("fromName", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Host SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => handleSettingChange("smtpHost", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta SMTP</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => handleSettingChange("smtpPort", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Senha SMTP</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showApiKey ? "text" : "password"}
                      value={settings.smtpPassword}
                      onChange={(e) => handleSettingChange("smtpPassword", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Testar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe
                </CardTitle>
                <CardDescription>
                  Configurações do gateway Stripe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripePublicKey">Chave Pública</Label>
                  <Input
                    id="stripePublicKey"
                    value={settings.stripePublicKey}
                    onChange={(e) => handleSettingChange("stripePublicKey", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Chave Secreta</Label>
                  <div className="relative">
                    <Input
                      id="stripeSecretKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.stripeSecretKey}
                      onChange={(e) => handleSettingChange("stripeSecretKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Mercado Pago & PIX
                </CardTitle>
                <CardDescription>
                  Configurações para pagamentos nacionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mercadoPagoAccessToken">Access Token MP</Label>
                  <div className="relative">
                    <Input
                      id="mercadoPagoAccessToken"
                      type={showApiKey ? "text" : "password"}
                      value={settings.mercadoPagoAccessToken}
                      onChange={(e) => handleSettingChange("mercadoPagoAccessToken", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    value={settings.pixKey}
                    onChange={(e) => handleSettingChange("pixKey", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificações
              </CardTitle>
              <CardDescription>
                Configure como e quando enviar notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canais de Notificação</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-gray-500">
                      Enviar notificações via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por SMS</Label>
                    <p className="text-sm text-gray-500">
                      Enviar notificações via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Notificações push para apps
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tipos de Notificação</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nova Reserva</Label>
                    <p className="text-sm text-gray-500">
                      Notificar quando nova reserva for criada
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyNewBooking}
                    onCheckedChange={(checked) => handleSettingChange("notifyNewBooking", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagamento Recebido</Label>
                    <p className="text-sm text-gray-500">
                      Notificar quando pagamento for confirmado
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyPaymentReceived}
                    onCheckedChange={(checked) => handleSettingChange("notifyPaymentReceived", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novo Usuário</Label>
                    <p className="text-sm text-gray-500">
                      Notificar quando novo usuário se registrar
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyNewUser}
                    onCheckedChange={(checked) => handleSettingChange("notifyNewUser", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  APIs Externas
                </CardTitle>
                <CardDescription>
                  Chaves de APIs de serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="googleMapsApiKey">Google Maps API Key</Label>
                  <div className="relative">
                    <Input
                      id="googleMapsApiKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.googleMapsApiKey}
                      onChange={(e) => handleSettingChange("googleMapsApiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsappApiKey">WhatsApp API Key</Label>
                  <div className="relative">
                    <Input
                      id="whatsappApiKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.whatsappApiKey}
                      onChange={(e) => handleSettingChange("whatsappApiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Status dos Serviços
                </CardTitle>
                <CardDescription>
                  Estado atual das integrações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stripe</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Google Maps</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Limitado
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">WhatsApp API</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Inativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 