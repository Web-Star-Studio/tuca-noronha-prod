"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { formStyles, buttonStyles, cardStyles, transitionEffects } from "@/lib/ui-config";

// Categories for recommendations
const CATEGORIES = [
  { id: "tech", label: "Tecnologia" },
  { id: "finance", label: "Finanças" },
  { id: "health", label: "Saúde e Bem-estar" },
  { id: "education", label: "Educação" },
  { id: "entertainment", label: "Entretenimento" },
  { id: "travel", label: "Viagens" },
  { id: "food", label: "Gastronomia" },
  { id: "sports", label: "Esportes" },
];

interface ContentPreferences {
  readingLevel: string;
  contentLength: number;
  contentFormat: string;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  frequency: string;
}

interface FeedCustomization {
  categories: string[];
  priorityTopics: string;
  excludedTopics: string;
}

interface PrivacySettings {
  allowDataCollection: boolean;
  shareDataForImprovement: boolean;
}

export interface FormData {
  name: string;
  age: string;
  interests: string[];
  contentPreferences: ContentPreferences;
  notificationPreferences: NotificationPreferences;
  feedCustomization: FeedCustomization;
  privacySettings: PrivacySettings;
}

export function PersonalizationForm({ userId, initialData, onComplete }: {
  userId?: string;
  initialData?: FormData;
  onComplete?: (data: FormData) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialData || {
    name: "",
    age: "",
    interests: [],
    contentPreferences: {
      readingLevel: "medium",
      contentLength: 50,
      contentFormat: "mixed",
    },
    notificationPreferences: {
      email: true,
      push: true,
      frequency: "daily",
    },
    feedCustomization: {
      categories: [],
      priorityTopics: "",
      excludedTopics: "",
    },
    privacySettings: {
      allowDataCollection: true,
      shareDataForImprovement: false,
    }
  });

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedFormData = <K extends keyof FormData, S extends keyof FormData[K]>(
    parentField: K, 
    field: S, 
    value: FormData[K][S]
  ) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value,
      },
    }));
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData((prev: FormData) => {
      const interests = [...prev.interests];
      if (interests.includes(interestId)) {
        return { ...prev, interests: interests.filter((id) => id !== interestId) };
      }
      return { ...prev, interests: [...interests, interestId] };
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev: FormData) => {
      const categories = [...prev.feedCustomization.categories];
      if (categories.includes(categoryId)) {
        return { 
          ...prev, 
          feedCustomization: {
            ...prev.feedCustomization,
            categories: categories.filter((id) => id !== categoryId)
          } 
        };
      }
      return { 
        ...prev, 
        feedCustomization: {
          ...prev.feedCustomization,
          categories: [...categories, categoryId]
        } 
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Here you would submit to your Convex database
      // const result = await mutate(...);
      
      if (onComplete) {
        onComplete(formData);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error submitting personalization data:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className={`${cardStyles.base} ${cardStyles.hover.lift}`}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Personalize sua Experiência</CardTitle>
          <CardDescription>
            Ajude-nos a entender suas preferências para recomendações personalizadas com IA
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <Tabs value={`step-${step}`} className="w-full">
            {/* Step 1: Basic Info */}
            <TabsContent value="step-1" className={transitionEffects.appear.fadeIn}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name" 
                    className={formStyles.input.base}
                    placeholder="Seu nome completo" 
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input 
                    id="age" 
                    type="number" 
                    className={formStyles.input.base}
                    placeholder="Sua idade" 
                    value={formData.age}
                    onChange={(e) => updateFormData("age", e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Seus Interesses</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`interest-${category.id}`} 
                          checked={formData.interests.includes(category.id)}
                          onCheckedChange={() => handleInterestToggle(category.id)}
                        />
                        <Label htmlFor={`interest-${category.id}`} className="cursor-pointer">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Step 2: Content Preferences */}
            <TabsContent value="step-2" className={transitionEffects.appear.fadeIn}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Nível de Leitura Preferido</Label>
                  <RadioGroup 
                    value={formData.contentPreferences.readingLevel}
                    onValueChange={(value) => updateNestedFormData("contentPreferences", "readingLevel", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="simple" id="reading-simple" />
                      <Label htmlFor="reading-simple">Simples e objetivo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="reading-medium" />
                      <Label htmlFor="reading-medium">Moderadamente detalhado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="detailed" id="reading-detailed" />
                      <Label htmlFor="reading-detailed">Detalhado e aprofundado</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Tamanho do Conteúdo</Label>
                    <span className="text-muted-foreground text-sm">
                      {formData.contentPreferences.contentLength}%
                    </span>
                  </div>
                  <Slider 
                    value={[formData.contentPreferences.contentLength]} 
                    min={0} 
                    max={100} 
                    step={10}
                    onValueChange={(values) => updateNestedFormData("contentPreferences", "contentLength", values[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Resumido</span>
                    <span>Completo</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-format">Formato de Conteúdo Preferido</Label>
                  <Select 
                    value={formData.contentPreferences.contentFormat}
                    onValueChange={(value) => updateNestedFormData("contentPreferences", "contentFormat", value)}
                  >
                    <SelectTrigger id="content-format" className={formStyles.select.trigger}>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent className={formStyles.select.content}>
                      <SelectItem value="text">Principalmente texto</SelectItem>
                      <SelectItem value="visual">Principalmente visual</SelectItem>
                      <SelectItem value="mixed">Mistura balanceada</SelectItem>
                      <SelectItem value="interactive">Interativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Step 3: Feed Customization */}
            <TabsContent value="step-3" className={transitionEffects.appear.fadeIn}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Categorias para seu Feed</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category.id}`} 
                          checked={formData.feedCustomization.categories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label htmlFor={`category-${category.id}`} className="cursor-pointer">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority-topics">Tópicos Prioritários</Label>
                  <Textarea 
                    id="priority-topics" 
                    className={formStyles.textarea.base}
                    placeholder="Digite tópicos específicos que você quer ver com mais frequência (separados por vírgula)" 
                    value={formData.feedCustomization.priorityTopics}
                    onChange={(e) => updateNestedFormData("feedCustomization", "priorityTopics", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excluded-topics">Tópicos a Excluir</Label>
                  <Textarea 
                    id="excluded-topics" 
                    className={formStyles.textarea.base}
                    placeholder="Digite tópicos que você prefere não ver (separados por vírgula)" 
                    value={formData.feedCustomization.excludedTopics}
                    onChange={(e) => updateNestedFormData("feedCustomization", "excludedTopics", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Step 4: Notification & Privacy */}
            <TabsContent value="step-4" className={transitionEffects.appear.fadeIn}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Preferências de Notificação</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-email" className="cursor-pointer">Receber notificações por e-mail</Label>
                    <Switch 
                      id="notify-email" 
                      className={formStyles.switch.base}
                      checked={formData.notificationPreferences.email}
                      onCheckedChange={(checked) => updateNestedFormData("notificationPreferences", "email", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-push" className="cursor-pointer">Receber notificações push</Label>
                    <Switch 
                      id="notify-push" 
                      className={formStyles.switch.base}
                      checked={formData.notificationPreferences.push}
                      onCheckedChange={(checked) => updateNestedFormData("notificationPreferences", "push", checked)}
                    />
                  </div>

                  <div className="pt-2">
                    <Label htmlFor="notification-frequency">Frequência de Notificações</Label>
                    <Select 
                      value={formData.notificationPreferences.frequency}
                      onValueChange={(value) => updateNestedFormData("notificationPreferences", "frequency", value)}
                      disabled={!formData.notificationPreferences.email && !formData.notificationPreferences.push}
                    >
                      <SelectTrigger id="notification-frequency" className={formStyles.select.trigger}>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent className={formStyles.select.content}>
                        <SelectItem value="realtime">Tempo real</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                        <SelectItem value="weekly">Semanalmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Label>Configurações de Privacidade</Label>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-data" className="cursor-pointer">Permitir coleta de dados para personalização</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nos permite usar seu histórico de interações para melhorar recomendações
                      </p>
                    </div>
                    <Switch 
                      id="allow-data" 
                      className={formStyles.switch.base}
                      checked={formData.privacySettings.allowDataCollection}
                      onCheckedChange={(checked) => updateNestedFormData("privacySettings", "allowDataCollection", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="share-data" className="cursor-pointer">Compartilhar dados para melhoria do sistema</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ajuda a melhorar nosso sistema de IA para todos os usuários
                      </p>
                    </div>
                    <Switch 
                      id="share-data" 
                      className={formStyles.switch.base}
                      checked={formData.privacySettings.shareDataForImprovement}
                      onCheckedChange={(checked) => updateNestedFormData("privacySettings", "shareDataForImprovement", checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className={`${cardStyles.footer.separated} flex justify-between`}>
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={prevStep}
              className={buttonStyles.variant.outline}
            >
              Voltar
            </Button>
          ) : (
            <div />
          )}
          
          {step < 4 ? (
            <Button
              onClick={nextStep}
              className={buttonStyles.variant.default}
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className={buttonStyles.variant.gradient}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Concluir Personalização"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 