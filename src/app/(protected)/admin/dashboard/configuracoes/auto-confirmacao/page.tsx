"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  Settings, 
  Save,
  Plus
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface AutoConfirmationFormData {
  enabled: boolean;
  name: string;
  priority: number;
  conditions: {
    timeRestrictions: {
      enableTimeRestrictions: boolean;
      allowedDaysOfWeek: number[];
      allowedHours: {
        start: string;
        end: string;
      };
      timezone: string;
    };
    amountThresholds: {
      enableAmountThresholds: boolean;
      minAmount?: number;
      maxAmount?: number;
    };
    customerTypeFilters: {
      enableCustomerFilters: boolean;
      allowedCustomerTypes: string[];
      minBookingHistory?: number;
      blacklistedCustomers: string[];
    };
    bookingConditions: {
      enableBookingConditions: boolean;
      maxGuestsCount?: number;
      minAdvanceBooking?: number;
      maxAdvanceBooking?: number;
      allowedPaymentMethods: string[];
    };
    availabilityConditions: {
      enableAvailabilityConditions: boolean;
      requireAvailabilityCheck: boolean;
      maxOccupancyPercentage?: number;
      bufferTime?: number;
    };
  };
  notifications: {
    notifyCustomer: boolean;
    notifyPartner: boolean;
    notifyEmployees: boolean;
    customMessage?: string;
    emailTemplate?: string;
  };
  overrideSettings: {
    allowManualOverride: boolean;
    overrideRequiresApproval: boolean;
    overrideApprovers: string[];
  };
}

const ASSET_TYPES = [
  { value: "activities", label: "Atividades" },
  { value: "events", label: "Eventos" },
  { value: "restaurants", label: "Restaurantes" },
  { value: "vehicles", label: "Veículos" },
  { value: "accommodations", label: "Hospedagens" }
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" }
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "card", label: "Cartão" },
  { value: "pix", label: "PIX" }
];

const CUSTOMER_TYPES = [
  { value: "new", label: "Novo Cliente" },
  { value: "returning", label: "Cliente Recorrente" },
  { value: "vip", label: "Cliente VIP" },
  { value: "corporate", label: "Corporativo" }
];

export default function AutoConfirmacaoPage() {
  const {} = useCurrentUser();
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<AutoConfirmationFormData>({
    enabled: true,
    name: "",
    priority: 1,
    conditions: {
      timeRestrictions: {
        enableTimeRestrictions: false,
        allowedDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        allowedHours: {
          start: "00:00",
          end: "23:59"
        },
        timezone: "America/Sao_Paulo"
      },
      amountThresholds: {
        enableAmountThresholds: false,
        minAmount: 0,
        maxAmount: 10000
      },
      customerTypeFilters: {
        enableCustomerFilters: false,
        allowedCustomerTypes: ["new", "returning", "vip", "corporate"],
        minBookingHistory: 0,
        blacklistedCustomers: []
      },
      bookingConditions: {
        enableBookingConditions: false,
        maxGuestsCount: 20,
        minAdvanceBooking: 0,
        maxAdvanceBooking: 365,
        allowedPaymentMethods: ["cash", "transfer", "card", "pix"]
      },
      availabilityConditions: {
        enableAvailabilityConditions: false,
        requireAvailabilityCheck: true,
        maxOccupancyPercentage: 80,
        bufferTime: 0
      }
    },
    notifications: {
      notifyCustomer: true,
      notifyPartner: true,
      notifyEmployees: false,
      customMessage: "",
      emailTemplate: ""
    },
    overrideSettings: {
      allowManualOverride: true,
      overrideRequiresApproval: false,
      overrideApprovers: []
    }
  });
  
  // Mutations
  const createAutoConfirmationSettings = useMutation(
    api.domains.adminReservations.mutations.createAutoConfirmationSettings
  );
  
  // Query for available assets based on type
  const assetsQuery = useQuery(
    selectedAssetType ? 
      api.domains.shared.queries.getAssetsByType : 
      "skip",
    selectedAssetType ? { assetType: selectedAssetType as any } : undefined
  );
  
  const handleSave = async () => {
    if (!selectedAssetId || !selectedAssetType || !formData.name) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    setIsSaving(true);
    
    try {
      await createAutoConfirmationSettings({
        assetId: selectedAssetId,
        assetType: selectedAssetType as any,
        ...formData
      });
      
      toast.success("Configurações de auto-confirmação criadas com sucesso!");
      
      // Reset form
      setSelectedAssetType("");
      setSelectedAssetId("");
      setIsCreating(false);
    } catch {
      console.error("Error saving auto-confirmation settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Auto-Confirmação</h1>
          <p className="text-muted-foreground">
            Configure regras automáticas para confirmação de reservas
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Configuração
          </Button>
        )}
      </div>
      
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova Configuração de Auto-Confirmação</CardTitle>
            <CardDescription>
              Defina as condições para confirmação automática de reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Asset Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Asset</Label>
                  <Select
                    value={selectedAssetType}
                    onValueChange={setSelectedAssetType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Asset Específico</Label>
                  <Select
                    value={selectedAssetId}
                    onValueChange={setSelectedAssetId}
                    disabled={!selectedAssetType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetsQuery?.map((asset: any) => (
                        <SelectItem key={asset._id} value={asset._id}>
                          {asset.name || asset.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Nome da Configuração</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    name: e.target.value
                  })}
                  placeholder="Ex: Auto-confirmação para reservas pequenas"
                />
              </div>
              
              <div>
                <Label>Prioridade</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.priority]}
                    onValueChange={([value]) => setFormData({
                      ...formData,
                      priority: value
                    })}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">
                    {formData.priority}
                  </span>
                </div>
              </div>
              
              {/* Conditions Tabs */}
              <Tabs defaultValue="time" className="mt-6">
                <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  <TabsTrigger value="time">Horário</TabsTrigger>
                  <TabsTrigger value="amount">Valor</TabsTrigger>
                  <TabsTrigger value="customer">Cliente</TabsTrigger>
                  <TabsTrigger value="booking">Reserva</TabsTrigger>
                  <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
                </TabsList>
                
                {/* Time Restrictions Tab */}
                <TabsContent value="time" className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Restrições de Horário</h3>
                      <p className="text-sm text-muted-foreground">
                        Defina quando a auto-confirmação está ativa
                      </p>
                    </div>
                    <Switch
                      checked={formData.conditions.timeRestrictions.enableTimeRestrictions}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          timeRestrictions: {
                            ...formData.conditions.timeRestrictions,
                            enableTimeRestrictions: checked
                          }
                        }
                      })}
                    />
                  </div>
                  
                  {formData.conditions.timeRestrictions.enableTimeRestrictions && (
                    <>
                      <div>
                        <Label>Dias da Semana Permitidos</Label>
                        <div className="flex gap-2 mt-2">
                          {DAYS_OF_WEEK.map(day => (
                            <Button
                              key={day.value}
                              variant={formData.conditions.timeRestrictions.allowedDaysOfWeek.includes(day.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const days = formData.conditions.timeRestrictions.allowedDaysOfWeek;
                                if (days.includes(day.value)) {
                                  setFormData({
                                    ...formData,
                                    conditions: {
                                      ...formData.conditions,
                                      timeRestrictions: {
                                        ...formData.conditions.timeRestrictions,
                                        allowedDaysOfWeek: days.filter(d => d !== day.value)
                                      }
                                    }
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    conditions: {
                                      ...formData.conditions,
                                      timeRestrictions: {
                                        ...formData.conditions.timeRestrictions,
                                        allowedDaysOfWeek: [...days, day.value]
                                      }
                                    }
                                  });
                                }
                              }}
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Horário Inicial</Label>
                          <Input
                            type="time"
                            value={formData.conditions.timeRestrictions.allowedHours.start}
                            onChange={(e) => setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                timeRestrictions: {
                                  ...formData.conditions.timeRestrictions,
                                  allowedHours: {
                                    ...formData.conditions.timeRestrictions.allowedHours,
                                    start: e.target.value
                                  }
                                }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Horário Final</Label>
                          <Input
                            type="time"
                            value={formData.conditions.timeRestrictions.allowedHours.end}
                            onChange={(e) => setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                timeRestrictions: {
                                  ...formData.conditions.timeRestrictions,
                                  allowedHours: {
                                    ...formData.conditions.timeRestrictions.allowedHours,
                                    end: e.target.value
                                  }
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                {/* Amount Thresholds Tab */}
                <TabsContent value="amount" className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Limites de Valor</h3>
                      <p className="text-sm text-muted-foreground">
                        Defina os limites de valor para auto-confirmação
                      </p>
                    </div>
                    <Switch
                      checked={formData.conditions.amountThresholds.enableAmountThresholds}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          amountThresholds: {
                            ...formData.conditions.amountThresholds,
                            enableAmountThresholds: checked
                          }
                        }
                      })}
                    />
                  </div>
                  
                  {formData.conditions.amountThresholds.enableAmountThresholds && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Valor Mínimo (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.conditions.amountThresholds.minAmount}
                          onChange={(e) => setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              amountThresholds: {
                                ...formData.conditions.amountThresholds,
                                minAmount: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Valor Máximo (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.conditions.amountThresholds.maxAmount}
                          onChange={(e) => setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              amountThresholds: {
                                ...formData.conditions.amountThresholds,
                                maxAmount: parseFloat(e.target.value) || 10000
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Customer Type Filters Tab */}
                <TabsContent value="customer" className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Filtros de Cliente</h3>
                      <p className="text-sm text-muted-foreground">
                        Defina quais tipos de clientes podem ter auto-confirmação
                      </p>
                    </div>
                    <Switch
                      checked={formData.conditions.customerTypeFilters.enableCustomerFilters}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          customerTypeFilters: {
                            ...formData.conditions.customerTypeFilters,
                            enableCustomerFilters: checked
                          }
                        }
                      })}
                    />
                  </div>
                  
                  {formData.conditions.customerTypeFilters.enableCustomerFilters && (
                    <>
                      <div>
                        <Label>Tipos de Cliente Permitidos</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {CUSTOMER_TYPES.map(type => (
                            <Button
                              key={type.value}
                              variant={formData.conditions.customerTypeFilters.allowedCustomerTypes.includes(type.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const types = formData.conditions.customerTypeFilters.allowedCustomerTypes;
                                if (types.includes(type.value)) {
                                  setFormData({
                                    ...formData,
                                    conditions: {
                                      ...formData.conditions,
                                      customerTypeFilters: {
                                        ...formData.conditions.customerTypeFilters,
                                        allowedCustomerTypes: types.filter(t => t !== type.value)
                                      }
                                    }
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    conditions: {
                                      ...formData.conditions,
                                      customerTypeFilters: {
                                        ...formData.conditions.customerTypeFilters,
                                        allowedCustomerTypes: [...types, type.value]
                                      }
                                    }
                                  });
                                }
                              }}
                            >
                              {type.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Histórico Mínimo de Reservas</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.conditions.customerTypeFilters.minBookingHistory}
                          onChange={(e) => setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              customerTypeFilters: {
                                ...formData.conditions.customerTypeFilters,
                                minBookingHistory: parseInt(e.target.value) || 0
                              }
                            }
                          })}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
                
                {/* Booking Conditions Tab */}
                <TabsContent value="booking" className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Condições da Reserva</h3>
                      <p className="text-sm text-muted-foreground">
                        Defina condições específicas da reserva
                      </p>
                    </div>
                    <Switch
                      checked={formData.conditions.bookingConditions.enableBookingConditions}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          bookingConditions: {
                            ...formData.conditions.bookingConditions,
                            enableBookingConditions: checked
                          }
                        }
                      })}
                    />
                  </div>
                  
                  {formData.conditions.bookingConditions.enableBookingConditions && (
                    <>
                      <div>
                        <Label>Número Máximo de Pessoas</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.conditions.bookingConditions.maxGuestsCount}
                          onChange={(e) => setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              bookingConditions: {
                                ...formData.conditions.bookingConditions,
                                maxGuestsCount: parseInt(e.target.value) || 1
                              }
                            }
                          })}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Antecedência Mínima (dias)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.conditions.bookingConditions.minAdvanceBooking}
                            onChange={(e) => setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                bookingConditions: {
                                  ...formData.conditions.bookingConditions,
                                  minAdvanceBooking: parseInt(e.target.value) || 0
                                }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Antecedência Máxima (dias)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.conditions.bookingConditions.maxAdvanceBooking}
                            onChange={(e) => setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                bookingConditions: {
                                  ...formData.conditions.bookingConditions,
                                  maxAdvanceBooking: parseInt(e.target.value) || 365
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Métodos de Pagamento Permitidos</Label>
                        <div className="flex gap-2 mt-2">
                          {PAYMENT_METHODS.map(method => (
                            <Button
                              key={method.value}
                              variant={formData.conditions.bookingConditions.allowedPaymentMethods.includes(method.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const methods = formData.conditions.bookingConditions.allowedPaymentMethods;
                                if (methods.includes(method.value)) {
                                  setFormData({
                                    ...formData,
                                    conditions: {
                                      ...formData.conditions,
                                      bookingConditions: {
                                        ...formData.conditions.bookingConditions,
                                        allowedPaymentMethods: methods.filter(m => m !== method.value)
                                      }
                                    }
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    conditions: {
                                      ...formData.conditions,
                                      bookingConditions: {
                                        ...formData.conditions.bookingConditions,
                                        allowedPaymentMethods: [...methods, method.value]
                                      }
                                    }
                                  });
                                }
                              }}
                            >
                              {method.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                {/* Availability Conditions Tab */}
                <TabsContent value="availability" className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Condições de Disponibilidade</h3>
                      <p className="text-sm text-muted-foreground">
                        Defina regras de disponibilidade para auto-confirmação
                      </p>
                    </div>
                    <Switch
                      checked={formData.conditions.availabilityConditions.enableAvailabilityConditions}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          availabilityConditions: {
                            ...formData.conditions.availabilityConditions,
                            enableAvailabilityConditions: checked
                          }
                        }
                      })}
                    />
                  </div>
                  
                  {formData.conditions.availabilityConditions.enableAvailabilityConditions && (
                    <>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.conditions.availabilityConditions.requireAvailabilityCheck}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              availabilityConditions: {
                                ...formData.conditions.availabilityConditions,
                                requireAvailabilityCheck: checked
                              }
                            }
                          })}
                        />
                        <Label>Exigir Verificação de Disponibilidade</Label>
                      </div>
                      
                      <div>
                        <Label>Ocupação Máxima Permitida (%)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[formData.conditions.availabilityConditions.maxOccupancyPercentage || 80]}
                            onValueChange={([value]) => setFormData({
                              ...formData,
                              conditions: {
                                ...formData.conditions,
                                availabilityConditions: {
                                  ...formData.conditions.availabilityConditions,
                                  maxOccupancyPercentage: value
                                }
                              }
                            })}
                            min={0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <span className="w-12 text-center font-medium">
                            {formData.conditions.availabilityConditions.maxOccupancyPercentage}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Tempo de Buffer (minutos)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.conditions.availabilityConditions.bufferTime}
                          onChange={(e) => setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              availabilityConditions: {
                                ...formData.conditions.availabilityConditions,
                                bufferTime: parseInt(e.target.value) || 0
                              }
                            }
                          })}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
              
              {/* Notifications Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações de Notificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.notifications.notifyCustomer}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          notifyCustomer: checked
                        }
                      })}
                    />
                    <Label>Notificar Cliente</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.notifications.notifyPartner}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          notifyPartner: checked
                        }
                      })}
                    />
                    <Label>Notificar Parceiro</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.notifications.notifyEmployees}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          notifyEmployees: checked
                        }
                      })}
                    />
                    <Label>Notificar Funcionários</Label>
                  </div>
                </CardContent>
              </Card>
              
              {/* Override Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações de Override</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.overrideSettings.allowManualOverride}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        overrideSettings: {
                          ...formData.overrideSettings,
                          allowManualOverride: checked
                        }
                      })}
                    />
                    <Label>Permitir Override Manual</Label>
                  </div>
                  
                  {formData.overrideSettings.allowManualOverride && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.overrideSettings.overrideRequiresApproval}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          overrideSettings: {
                            ...formData.overrideSettings,
                            overrideRequiresApproval: checked
                          }
                        })}
                      />
                      <Label>Override Requer Aprovação</Label>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !selectedAssetId || !selectedAssetType || !formData.name}
                >
                  {isSaving ? "Salvando..." : "Salvar Configuração"}
                  {!isSaving && <Save className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              Nenhuma configuração criada
            </h3>
            <p className="text-muted-foreground mb-4">
              Crie configurações de auto-confirmação para automatizar o processo de aprovação de reservas
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Configuração
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
