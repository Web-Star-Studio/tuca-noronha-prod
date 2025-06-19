import { useState, useEffect } from "react";
import Image from "next/image";
import { MediaSelector } from "@/components/dashboard/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Car, Settings, ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import { useCreateVehicle, useUpdateVehicle, useVehicle } from "@/lib/services/vehicleService";
import { Id } from "@/../convex/_generated/dataModel";

type VehicleFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  editMode: Id<"vehicles"> | null;
};

// Get current year safely
const getCurrentYear = () => {
  const now = new Date();
  return now.getFullYear();
};

export default function VehicleForm({ onSubmit, onCancel, editMode }: VehicleFormProps) {
  // Get vehicle data if in edit mode
  const { vehicle, isLoading: isLoadingVehicle } = useVehicle(editMode);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  
  // Form state
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
    pricePerDay: 0,
    description: "",
    features: [] as string[],
    imageUrl: "",
    status: "available"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Load vehicle data when in edit mode
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
        pricePerDay: vehicle.pricePerDay,
        description: vehicle.description || "",
        features: vehicle.features,
        imageUrl: vehicle.imageUrl || "",
        status: vehicle.status
      });
    } else if (!editMode) {
      // Reset form when adding new vehicle
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
        pricePerDay: 0,
        description: "",
        features: [],
        imageUrl: "",
        status: "available"
      });
    }
  }, [vehicle, editMode]);

  // Form input handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleFeatureToggle = (feature: string) => {
    setVehicleData((prev) => {
      const features = prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature];
      return { ...prev, features };
    });
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: Check which fields are missing
    const missingFields: string[] = [];
    if (!vehicleData.name) missingFields.push("name");
    if (!vehicleData.brand) missingFields.push("brand");
    if (!vehicleData.model) missingFields.push("model");
    if (!vehicleData.category) missingFields.push("category");
    if (!vehicleData.licensePlate) missingFields.push("licensePlate");
    if (!vehicleData.color) missingFields.push("color");
    if (!vehicleData.fuelType) missingFields.push("fuelType");
    if (!vehicleData.transmission) missingFields.push("transmission");
    if (vehicleData.pricePerDay <= 0) missingFields.push("pricePerDay");
    
    // Validation
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      console.log("Vehicle data:", vehicleData);
      toast.error(`Preencha todos os campos obrigatórios. Campos faltando: ${missingFields.join(", ")}`);
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

  // Common vehicle features for the checkboxes
  const commonFeatures = [
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
    "GPS"
  ];

  // Show loading state while fetching vehicle data in edit mode
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome do Veículo*</Label>
              <Input
                id="name"
                name="name"
                value={vehicleData.name}
                onChange={handleChange}
                placeholder="Ex: Toyota Corolla XEi"
                className="bg-muted/30 border-0 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand" className="text-sm font-medium text-gray-700">Marca*</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={vehicleData.brand}
                  onChange={handleChange}
                  placeholder="Ex: Toyota"
                  className="bg-muted/30 border-0 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model" className="text-sm font-medium text-gray-700">Modelo*</Label>
                <Input
                  id="model"
                  name="model"
                  value={vehicleData.model}
                  onChange={handleChange}
                  placeholder="Ex: Corolla"
                  className="bg-muted/30 border-0 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Categoria*</Label>
                <Select 
                  value={vehicleData.category} 
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="category" className="bg-muted/30 border-0">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Econômico</SelectItem>
                    <SelectItem value="compact">Compacto</SelectItem>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="luxury">Luxo</SelectItem>
                    <SelectItem value="minivan">Minivan</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year" className="text-sm font-medium text-gray-700">Ano*</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={vehicleData.year}
                  onChange={handleNumberChange}
                  min={2000}
                  max={getCurrentYear() + 1}
                  className="bg-muted/30 border-0 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licensePlate" className="text-sm font-medium text-gray-700">Placa*</Label>
                <Input
                  id="licensePlate"
                  name="licensePlate"
                  value={vehicleData.licensePlate}
                  onChange={handleChange}
                  placeholder="Ex: ABC1234"
                  className="bg-muted/30 border-0 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <Label htmlFor="color" className="text-sm font-medium text-gray-700">Cor*</Label>
                <Input
                  id="color"
                  name="color"
                  value={vehicleData.color}
                  onChange={handleChange}
                  placeholder="Ex: Prata"
                  className="bg-muted/30 border-0 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seats" className="text-sm font-medium text-gray-700">Lugares*</Label>
                <Input
                  id="seats"
                  name="seats"
                  type="number"
                  value={vehicleData.seats}
                  onChange={handleNumberChange}
                  min={2}
                  max={9}
                  className="bg-muted/30 border-0 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pricePerDay" className="text-sm font-medium text-gray-700">Preço por dia (R$)*</Label>
                <Input
                  id="pricePerDay"
                  name="pricePerDay"
                  type="number"
                  value={vehicleData.pricePerDay}
                  onChange={handleNumberChange}
                  min={0}
                  step={10}
                  className="bg-muted/30 border-0 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Especificações Técnicas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Especificações Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fuelType" className="text-sm font-medium text-gray-700">Combustível*</Label>
                <Select 
                  value={vehicleData.fuelType} 
                  onValueChange={(value) => handleSelectChange("fuelType", value)}
                >
                  <SelectTrigger id="fuelType" className="bg-muted/30 border-0">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gasolina">Gasolina</SelectItem>
                    <SelectItem value="Etanol">Etanol</SelectItem>
                    <SelectItem value="Flex">Flex</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transmission" className="text-sm font-medium text-gray-700">Transmissão*</Label>
                <Select 
                  value={vehicleData.transmission} 
                  onValueChange={(value) => handleSelectChange("transmission", value)}
                >
                  <SelectTrigger id="transmission" className="bg-muted/30 border-0">
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
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status*</Label>
              <Select 
                value={vehicleData.status} 
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="status" className="bg-muted/30 border-0">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="rented">Alugado</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Características e Acessórios</Label>
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto bg-muted/20 rounded-lg p-4">
                {commonFeatures.map((feature) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`feature-${feature}`}
                      checked={vehicleData.features.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                      className="border-gray-300"
                    />
                    <label
                      htmlFor={`feature-${feature}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imagem e Descrição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5" />
              Imagem do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                readOnly
                value={vehicleData.imageUrl ? "Imagem selecionada" : ""}
                placeholder="Nenhuma imagem selecionada"
                className="flex-1 bg-muted/30 border-0"
              />
              <Button 
                type="button" 
                onClick={() => setMediaPickerOpen(true)}
                variant="outline"
                className="shrink-0"
              >
                Selecionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Selecione uma imagem da biblioteca de mídias (ideal: 800x600px)</p>
            
            {vehicleData.imageUrl && (
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={vehicleData.imageUrl}
                  alt={vehicleData.name || "Veículo"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <MediaSelector
              open={mediaPickerOpen}
              onOpenChange={setMediaPickerOpen}
              initialSelected={vehicleData.imageUrl ? [vehicleData.imageUrl] : []}
              onSelect={([url]) => setVehicleData(prev => ({ ...prev, imageUrl: url }))}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Descrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Descrição do veículo</Label>
              <Textarea
                id="description"
                name="description"
                value={vehicleData.description}
                onChange={handleChange}
                placeholder="Descreva as características principais do veículo, condições especiais, ou informações importantes para os clientes..."
                rows={8}
                className="bg-muted/30 border-0 focus:bg-white transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">Esta descrição será exibida na página do veículo para os clientes.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter className="gap-3">
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