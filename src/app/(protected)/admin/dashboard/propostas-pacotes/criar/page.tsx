"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Calendar, MapPin, Bed, Clock, User, DollarSign, ArrowLeft, Save, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";

interface PackageProposalForm {
  startDate: string;
  endDate: string;
  accommodation: string;
  accommodationDetails: string;
  packageDescription: string;
  departureLocation: string;
  company: string;
  nights: number;
  pricePerPerson: number;
  totalValue: number;
  guests: number;
  observations?: string;
}

export default function CriarPropostaPacotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PackageProposalForm>({
    defaultValues: {
      guests: 1,
      nights: 1,
      pricePerPerson: 0,
      totalValue: 0,
    },
  });

  const watchedFields = watch();

  // Calcular automaticamente o número de noites
  const calculateNights = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 1;
  };

  // Calcular valor total automaticamente
  const calculateTotal = (pricePerPerson: number, guests: number) => {
    return pricePerPerson * guests;
  };

  // Handlers para cálculos automáticos
  const handleDateChange = () => {
    if (watchedFields.startDate && watchedFields.endDate) {
      const nights = calculateNights(watchedFields.startDate, watchedFields.endDate);
      setValue("nights", nights);
    }
  };

  const handlePriceChange = () => {
    if (watchedFields.pricePerPerson && watchedFields.guests) {
      const total = calculateTotal(watchedFields.pricePerPerson, watchedFields.guests);
      setValue("totalValue", total);
    }
  };

  const onSubmit = async (data: PackageProposalForm) => {
    setLoading(true);
    try {
      // Aqui será implementada a lógica de criação da proposta
      console.log("Dados da proposta:", data);
      
      // Simulação de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Proposta de pacote criada com sucesso!");
      router.push("/admin/dashboard/propostas-pacotes");
    } catch (error) {
      console.error("Erro ao criar proposta:", error);
      toast.error("Erro ao criar proposta de pacote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/propostas-pacotes">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Proposta de Pacote</h1>
          <p className="text-slate-600">Crie uma nova proposta personalizada para o cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Informações do Período */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                Período da Viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                    Data de Saída *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate", {
                      required: "Data de saída é obrigatória",
                      onChange: handleDateChange,
                    })}
                    className="mt-1"
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                    Data de Retorno *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register("endDate", {
                      required: "Data de retorno é obrigatória",
                      onChange: handleDateChange,
                    })}
                    className="mt-1"
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Número de Noites
                </Label>
                <div className="bg-slate-50 rounded-lg p-3 mt-1">
                  <span className="text-lg font-semibold text-slate-900">
                    {watchedFields.nights || 0} noites
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="departureLocation" className="text-sm font-medium text-slate-700">
                    Local de Saída *
                  </Label>
                  <Input
                    id="departureLocation"
                    placeholder="Ex: São Paulo"
                    {...register("departureLocation", {
                      required: "Local de saída é obrigatório",
                    })}
                    className="mt-1"
                  />
                  {errors.departureLocation && (
                    <p className="text-sm text-red-600 mt-1">{errors.departureLocation.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                    Companhia Aérea
                  </Label>
                  <Input
                    id="company"
                    placeholder="Ex: LATAM, GOL"
                    {...register("company")}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Acomodação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bed className="h-5 w-5 text-green-600" />
                Acomodação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accommodation" className="text-sm font-medium text-slate-700">
                  Tipo de Acomodação *
                </Label>
                <Select onValueChange={(value) => setValue("accommodation", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo de acomodação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel-5-estrelas">Hotel 5 Estrelas</SelectItem>
                    <SelectItem value="hotel-4-estrelas">Hotel 4 Estrelas</SelectItem>
                    <SelectItem value="hotel-3-estrelas">Hotel 3 Estrelas</SelectItem>
                    <SelectItem value="pousada">Pousada</SelectItem>
                    <SelectItem value="resort">Resort</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                  </SelectContent>
                </Select>
                {errors.accommodation && (
                  <p className="text-sm text-red-600 mt-1">{errors.accommodation.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accommodationDetails" className="text-sm font-medium text-slate-700">
                  Detalhes da Acomodação *
                </Label>
                <Textarea
                  id="accommodationDetails"
                  placeholder="Descreva a acomodação: nome do hotel, localização, comodidades incluídas..."
                  {...register("accommodationDetails", {
                    required: "Detalhes da acomodação são obrigatórios",
                  })}
                  className="mt-1 min-h-[100px]"
                />
                {errors.accommodationDetails && (
                  <p className="text-sm text-red-600 mt-1">{errors.accommodationDetails.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="guests" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Número de Hóspedes *
                </Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  {...register("guests", {
                    required: "Número de hóspedes é obrigatório",
                    min: { value: 1, message: "Mínimo 1 hóspede" },
                    max: { value: 20, message: "Máximo 20 hóspedes" },
                    onChange: handlePriceChange,
                  })}
                  className="mt-1"
                />
                {errors.guests && (
                  <p className="text-sm text-red-600 mt-1">{errors.guests.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card Descrição do Pacote */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
                Descrição do Pacote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="packageDescription" className="text-sm font-medium text-slate-700">
                  Descrição Completa do Pacote *
                </Label>
                <Textarea
                  id="packageDescription"
                  placeholder="Descreva detalhadamente o pacote: destinos, passeios incluídos, refeições, transporte local, atividades..."
                  {...register("packageDescription", {
                    required: "Descrição do pacote é obrigatória",
                  })}
                  className="mt-1 min-h-[150px]"
                />
                {errors.packageDescription && (
                  <p className="text-sm text-red-600 mt-1">{errors.packageDescription.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card Valores */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="pricePerPerson" className="text-sm font-medium text-slate-700">
                    Preço por Pessoa (R$) *
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      R$
                    </span>
                    <Input
                      id="pricePerPerson"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...register("pricePerPerson", {
                        required: "Preço por pessoa é obrigatório",
                        min: { value: 0.01, message: "Preço deve ser maior que zero" },
                        onChange: handlePriceChange,
                      })}
                      className="pl-10"
                    />
                  </div>
                  {errors.pricePerPerson && (
                    <p className="text-sm text-red-600 mt-1">{errors.pricePerPerson.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Valor Total (R$)
                  </Label>
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 mt-1">
                    <span className="text-2xl font-bold text-emerald-700">
                      R$ {watchedFields.totalValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
                    </span>
                    <p className="text-sm text-emerald-600 mt-1">
                      {watchedFields.guests || 0} hóspede(s) × R$ {watchedFields.pricePerPerson?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="observations" className="text-sm font-medium text-slate-700">
                  Observações Adicionais
                </Label>
                <Textarea
                  id="observations"
                  placeholder="Informações extras, condições especiais, políticas de cancelamento..."
                  {...register("observations")}
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Proposta
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
