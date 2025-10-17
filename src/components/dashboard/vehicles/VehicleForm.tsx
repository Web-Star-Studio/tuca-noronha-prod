import { useState, useEffect } from "react";
import { MediaSelector } from "@/components/dashboard/media";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import { useCreateVehicle, useUpdateVehicle, useVehicle } from "@/lib/services/vehicleService";
import { Id } from "@/../convex/_generated/dataModel";
import { SmartMedia } from "@/components/ui/smart-media";
import { parseMediaEntry } from "@/lib/media";
import { cn } from "@/lib/utils";
import { getCategoryBasePrice } from "@/lib/constants/vehicleCategories";

type VehicleFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  editMode: Id<"vehicles"> | null;
};

const getCurrentYear = () => {
  const now = new Date();
  return now.getFullYear();
};

const FEATURE_OPTIONS = [
  "Ar-condicionado",
  "Direção hidráulica",
  "Airbag",
  "ABS",
  "Vidros elétricos",
  "Travas elétricas",
  "Sensor de estacionamento",
  "Câmera de ré",
  "Bluetooth",
  "Wi-Fi",
  "GPS",
];

export default function VehicleForm({ onSubmit, onCancel, editMode }: VehicleFormProps) {
  const { vehicle, isLoading: isLoadingVehicle } = useVehicle(editMode);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  
  const [activeTab, setActiveTab] = useState("basic");
  const [vehicleData, setVehicleData] = useState({
    name: "",
    brand: "",
    model: "",
    category: "",
    year: getCurrentYear(),
    licensePlate: "",
    color: "",
    seats: 5,
    fuelType: "",
    transmission: "",
    estimatedPricePerDay: 0,
    netRate: 0,
    adminRating: undefined,
    description: "",
    features: [] as string[],
    imageUrl: "",
    status: "available"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const mainImageEntry = parseMediaEntry(vehicleData.imageUrl ?? "");
  const hasMainImage = Boolean(mainImageEntry.url && mainImageEntry.url.trim() !== "");
  const isEditing = Boolean(editMode);

  useEffect(() => {
    if (vehicle && editMode) {
      setVehicleData({
        name: vehicle.name,
        brand: vehicle.brand,
        model: vehicle.model,
        category: vehicle.category,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        color: vehicle.color,
        seats: vehicle.seats,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        estimatedPricePerDay: vehicle.estimatedPricePerDay,
        netRate: vehicle.netRate ?? vehicle.estimatedPricePerDay,
        adminRating: vehicle.adminRating,
        description: vehicle.description || "",
        features: vehicle.features,
        imageUrl: vehicle.imageUrl || "",
        status: vehicle.status
      });
    } else if (!editMode) {
      setVehicleData({
        name: "",
        brand: "",
        model: "",
        category: "",
        year: getCurrentYear(),
        licensePlate: "",
        color: "",
        seats: 5,
        fuelType: "",
        transmission: "",
        estimatedPricePerDay: 0,
        netRate: 0,
        description: "",
        features: [],
        imageUrl: "",
        status: "available"
      });
    }
  }, [vehicle, editMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setVehicleData((prev) => {
      const updated = { ...prev, [name]: value };
      
      if (name === "category" && prev.estimatedPricePerDay === 0) {
        const basePrice = getCategoryBasePrice(value);
        if (basePrice > 0) {
          updated.estimatedPricePerDay = basePrice;
          updated.netRate = basePrice;
          toast.info(`Preço base sugerido: R$ ${basePrice.toFixed(2)}/dia`);
        }
      }
      
      return updated;
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleAdminRatingChange = (value: string) => {
    setVehicleData((prev) => ({
      ...prev,
      adminRating: value === "0" ? undefined : Number(value),
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setVehicleData((prev) => {
      const features = prev.features.includes(feature)
        ? prev.features.filter((item) => item !== feature)
        : [...prev.features, feature];
      return { ...prev, features };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields: string[] = [];
    if (!vehicleData.name) missingFields.push("name");
    if (!vehicleData.brand) missingFields.push("brand");
    if (!vehicleData.model) missingFields.push("model");
    if (!vehicleData.category) missingFields.push("category");
    if (!vehicleData.licensePlate) missingFields.push("licensePlate");
    if (!vehicleData.color) missingFields.push("color");
    if (!vehicleData.fuelType) missingFields.push("fuelType");
    if (!vehicleData.transmission) missingFields.push("transmission");
    if (vehicleData.estimatedPricePerDay <= 0) missingFields.push("estimatedPricePerDay");
    if (vehicleData.netRate === undefined || vehicleData.netRate < 0) missingFields.push("netRate");
    
    if (missingFields.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios. Campos faltando: ${missingFields.join(", ")}`);
      return;
    }

    if (vehicleData.netRate > vehicleData.estimatedPricePerDay) {
      toast.error("A tarifa net deve ser menor ou igual ao preço estimado por dia");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editMode) {
        await updateVehicle(editMode, vehicleData);
        toast.success("Veículo atualizado com sucesso");
      } else {
        await createVehicle(vehicleData);
        toast.success("Veículo adicionado com sucesso");
      }
      
      onSubmit();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar veículo";
      console.error(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (editMode && isLoadingVehicle) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando dados do veículo...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white/80 backdrop-blur-sm border-none shadow-sm w-full grid grid-cols-4 sticky top-0 z-10">
          <TabsTrigger value="basic" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            1. Básico
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            2. Detalhes
          </TabsTrigger>
          <TabsTrigger value="media" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            3. Mídia
          </TabsTrigger>
          <TabsTrigger value="additional" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            4. Adicionais
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Informações Básicas */}
        <TabsContent value="basic" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome do Veículo*</Label>
              <Input
                id="name"
                name="name"
                value={vehicleData.name}
                onChange={handleChange}
                placeholder="Ex: Toyota Corolla XEi"
                className="mt-1.5 bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="brand" className="text-sm font-medium">Marca*</Label>
              <Input
                id="brand"
                name="brand"
                value={vehicleData.brand}
                onChange={handleChange}
                placeholder="Ex: Toyota"
                className="mt-1.5 bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="model" className="text-sm font-medium">Modelo*</Label>
              <Input
                id="model"
                name="model"
                value={vehicleData.model}
                onChange={handleChange}
                placeholder="Ex: Corolla"
                className="mt-1.5 bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium">Categoria*</Label>
              <Select 
                value={vehicleData.category} 
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger className="mt-1.5 bg-white shadow-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike-eletrica">Bike Elétrica</SelectItem>
                  <SelectItem value="moto-xre-190">Moto XRE 190</SelectItem>
                  <SelectItem value="buggy">Buggy</SelectItem>
                  <SelectItem value="uno-gol">Uno/Gol</SelectItem>
                  <SelectItem value="jimny-4x4">Jimny 4X4</SelectItem>
                  <SelectItem value="oroch">Oroch</SelectItem>
                  <SelectItem value="duster">Duster</SelectItem>
                  <SelectItem value="jeep-renegade-diesel-4x4">Jeep Renegade Diesel 4X4</SelectItem>
                  <SelectItem value="l200-triton-diesel-4x4">L200 Triton Diesel 4X4</SelectItem>
                  <SelectItem value="sprinter-17-1">Sprinter 17 +1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year" className="text-sm font-medium">Ano*</Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={vehicleData.year}
                onChange={handleNumberChange}
                min={2000}
                max={getCurrentYear() + 1}
                className="mt-1.5 bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="licensePlate" className="text-sm font-medium">Placa*</Label>
              <Input
                id="licensePlate"
                name="licensePlate"
                value={vehicleData.licensePlate}
                onChange={handleChange}
                placeholder="Ex: ABC1234"
                className="mt-1.5 bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="color" className="text-sm font-medium">Cor*</Label>
              <Input
                id="color"
                name="color"
                value={vehicleData.color}
                onChange={handleChange}
                placeholder="Ex: Prata"
                className="mt-1.5 bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="seats" className="text-sm font-medium">Lugares*</Label>
              <Input
                id="seats"
                name="seats"
                type="number"
                value={vehicleData.seats}
                onChange={handleNumberChange}
                min={2}
                max={9}
                className="mt-1.5 bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">Status*</Label>
              <Select 
                value={vehicleData.status} 
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className="mt-1.5 bg-white shadow-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="rented">Alugado</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Detalhes Técnicos e Preços */}
        <TabsContent value="details" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="fuelType" className="text-sm font-medium">Combustível*</Label>
              <Select
                value={vehicleData.fuelType}
                onValueChange={(value) => handleSelectChange("fuelType", value)}
              >
                <SelectTrigger className="mt-1.5 bg-white shadow-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Álcool">Álcool</SelectItem>
                  <SelectItem value="Flex">Flex</SelectItem>
                  <SelectItem value="Elétrico">Elétrico</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transmission" className="text-sm font-medium">Transmissão*</Label>
              <Select
                value={vehicleData.transmission}
                onValueChange={(value) => handleSelectChange("transmission", value)}
              >
                <SelectTrigger className="mt-1.5 bg-white shadow-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automático">Automático</SelectItem>
                  <SelectItem value="CVT">CVT</SelectItem>
                  <SelectItem value="Semi-automático">Semi-automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedPricePerDay" className="text-sm font-medium">
                Valor Base Estimado (por dia) (R$)*
              </Label>
              <Input
                id="estimatedPricePerDay"
                name="estimatedPricePerDay"
                type="number"
                value={vehicleData.estimatedPricePerDay}
                onChange={handleNumberChange}
                min={0}
                step={0.01}
                placeholder="Ex: 150.50"
                className="mt-1.5 bg-white shadow-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Este é um valor de referência. O valor real será definido ao confirmar cada reserva.
              </p>
            </div>

            <div>
              <Label htmlFor="netRate" className="text-sm font-medium">Tarifa net (R$)*</Label>
              <Input
                id="netRate"
                name="netRate"
                type="number"
                value={vehicleData.netRate ?? 0}
                onChange={handleNumberChange}
                min={0}
                step={0.01}
                placeholder="Ex: 135.75"
                className="mt-1.5 bg-white shadow-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Valor líquido combinado para repasse ao fornecedor.
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="adminRating" className="text-sm font-medium">Classificação interna</Label>
              <Select
                value={vehicleData.adminRating !== undefined ? vehicleData.adminRating.toString() : "0"}
                onValueChange={handleAdminRatingChange}
              >
                <SelectTrigger className="mt-1.5 bg-white shadow-sm">
                  <SelectValue placeholder="Selecione a classificação (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nenhuma classificação</SelectItem>
                  <SelectItem value="1">⭐ 1 Estrela</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 Estrelas</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 Estrelas</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 Estrelas</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Estrelas</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Utilize para priorizar veículos na vitrine e apoiar a curadoria interna.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Mídia e Imagens */}
        <TabsContent value="media" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                readOnly
                value={vehicleData.imageUrl ? "Imagem selecionada" : ""}
                placeholder="Nenhuma imagem selecionada"
                className="flex-1 bg-white shadow-sm"
              />
              <Button 
                type="button" 
                onClick={() => setMediaPickerOpen(true)}
                variant="outline"
                className="shrink-0"
              >
                Selecionar Imagem
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Selecione uma imagem da biblioteca de mídias (ideal: 800x600px)</p>
            
            {hasMainImage && (
              <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
                <SmartMedia
                  entry={mainImageEntry}
                  alt={vehicleData.name || "Veículo"}
                  className="h-full w-full object-cover"
                  imageProps={{ fill: true }}
                  videoProps={{ controls: true, preload: "metadata" }}
                />
              </div>
            )}
            
            <MediaSelector
              open={mediaPickerOpen}
              onOpenChange={setMediaPickerOpen}
              initialSelected={vehicleData.imageUrl ? [vehicleData.imageUrl] : []}
              onSelect={([url]) => setVehicleData(prev => ({ ...prev, imageUrl: url }))}
            />
          </div>
        </TabsContent>

        {/* Tab 4: Adicionais (Descrição e Características) */}
        <TabsContent value="additional" className="space-y-6 p-4 bg-white/60 rounded-lg shadow-sm">
          <div className="space-y-6">
            <div>
              <Label htmlFor="description" className="text-sm font-medium">Descrição do veículo</Label>
              <Textarea
                id="description"
                name="description"
                value={vehicleData.description}
                onChange={handleChange}
                placeholder="Descreva as características principais do veículo, condições especiais, ou informações importantes para os clientes..."
                rows={6}
                className="mt-1.5 bg-white shadow-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">Esta descrição será exibida na página do veículo para os clientes.</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Características e acessórios</Label>
              <p className="mt-1 text-xs text-slate-500">
                Destaque diferenciais que ajudam o viajante a comparar opções semelhantes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((feature) => {
                  const isActive = vehicleData.features.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => handleFeatureToggle(feature)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                        isActive
                          ? "border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"
                      )}
                    >
                      {feature}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:justify-end">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {editMode ? "Atualizar" : "Adicionar"} Veículo
        </Button>
      </DialogFooter>
    </form>
  );
}
