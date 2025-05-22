import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import { useCreateVehicle, useUpdateVehicle, useVehicle } from "@/lib/services/vehicleService";
import { Id } from "../../../../convex/_generated/dataModel";

type VehicleFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  editMode: Id<"vehicles"> | null;
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
    year: new Date().getFullYear(),
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
        year: new Date().getFullYear(),
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
    
    // Validation
    if (!vehicleData.name || !vehicleData.brand || !vehicleData.model || !vehicleData.category || !vehicleData.pricePerDay) {
      toast.error("Preencha todos os campos obrigatórios");
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
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Veículo*</Label>
            <Input
              id="name"
              name="name"
              value={vehicleData.name}
              onChange={handleChange}
              placeholder="Ex: Toyota Corolla XEi"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Marca*</Label>
              <Input
                id="brand"
                name="brand"
                value={vehicleData.brand}
                onChange={handleChange}
                placeholder="Ex: Toyota"
                required
              />
            </div>
            <div>
              <Label htmlFor="model">Modelo*</Label>
              <Input
                id="model"
                name="model"
                value={vehicleData.model}
                onChange={handleChange}
                placeholder="Ex: Corolla"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria*</Label>
              <Select 
                value={vehicleData.category} 
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger id="category">
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
              <Label htmlFor="year">Ano*</Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={vehicleData.year}
                onChange={handleNumberChange}
                min={2000}
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licensePlate">Placa*</Label>
              <Input
                id="licensePlate"
                name="licensePlate"
                value={vehicleData.licensePlate}
                onChange={handleChange}
                placeholder="Ex: ABC1234"
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Cor*</Label>
              <Input
                id="color"
                name="color"
                value={vehicleData.color}
                onChange={handleChange}
                placeholder="Ex: Prata"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seats">Lugares*</Label>
              <Input
                id="seats"
                name="seats"
                type="number"
                value={vehicleData.seats}
                onChange={handleNumberChange}
                min={2}
                max={9}
                required
              />
            </div>
            <div>
              <Label htmlFor="pricePerDay">Preço por dia (R$)*</Label>
              <Input
                id="pricePerDay"
                name="pricePerDay"
                type="number"
                value={vehicleData.pricePerDay}
                onChange={handleNumberChange}
                min={0}
                step={10}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fuelType">Combustível*</Label>
              <Select 
                value={vehicleData.fuelType} 
                onValueChange={(value) => handleSelectChange("fuelType", value)}
              >
                <SelectTrigger id="fuelType">
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
              <Label htmlFor="transmission">Transmissão*</Label>
              <Select 
                value={vehicleData.transmission} 
                onValueChange={(value) => handleSelectChange("transmission", value)}
              >
                <SelectTrigger id="transmission">
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
            <Label htmlFor="status">Status*</Label>
            <Select 
              value={vehicleData.status} 
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger id="status">
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
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={vehicleData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">Informe a URL de uma imagem do veículo (ideal: 800x600px)</p>
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={vehicleData.description}
              onChange={handleChange}
              placeholder="Descreva as características do veículo..."
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-2 block">Características e Acessórios</Label>
            <div className="grid grid-cols-2 gap-2">
              {commonFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`feature-${feature}`}
                    checked={vehicleData.features.includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
                  />
                  <label
                    htmlFor={`feature-${feature}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {feature}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {editMode ? "Atualizar" : "Adicionar"} Veículo
        </Button>
      </DialogFooter>
    </form>
  );
} 