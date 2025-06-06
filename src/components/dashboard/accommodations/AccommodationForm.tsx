"use client";

import { useForm } from "react-hook-form";
import { Accommodation } from "@/lib/services/accommodationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import Image from "next/image";

interface AccommodationFormProps {
  accommodation?: Accommodation | null;
  onSubmit: (data: Accommodation) => void;
  onCancel: () => void;
  loading: boolean;
}

export function AccommodationForm({
  accommodation,
  onSubmit,
  onCancel,
  loading,
}: AccommodationFormProps) {
  const isEditing = !!accommodation;

  // Estados para arrays
  const [amenities, setAmenities] = useState<string[]>(accommodation?.amenities || []);
  const [houseRules, setHouseRules] = useState<string[]>(accommodation?.houseRules || []);
  const [galleryImages, setGalleryImages] = useState<string[]>(accommodation?.galleryImages || []);
  const [currentTab, setCurrentTab] = useState("basic");
  
  // Estados para inputs temporários
  const [tempAmenity, setTempAmenity] = useState("");
  const [tempRule, setTempRule] = useState("");
  const [tempGalleryImage, setTempGalleryImage] = useState("");

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Accommodation>({
    defaultValues: accommodation || {
      name: "",
      slug: "",
      description: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        neighborhood: "",
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
      },
      phone: "",
      website: "",
      type: "apartment",
      pricing: {
        pricePerNight: 0,
        taxes: 0,
        cleaningFee: 0,
      },
      rooms: {
        bedrooms: 1,
        bathrooms: 1,
        beds: 1,
      },
      amenities: [],
      houseRules: [],
      policies: {
        checkIn: "15:00",
        checkOut: "11:00",
        cancellation: "Flexible",
      },
      mainImage: "",
      galleryImages: [],
      rating: {
        overall: 0,
        cleanliness: 0,
        communication: 0,
        checkIn: 0,
        accuracy: 0,
        location: 0,
        value: 0,
        totalReviews: 0,
      },
      instantBooking: true,
      minimumStay: 1,
      maximumGuests: 2,
      isActive: true,
      isFeatured: false,
    },
  });

  // Array manipulators
  const addAmenity = () => {
    if (tempAmenity && !amenities.includes(tempAmenity)) {
      const newAmenities = [...amenities, tempAmenity];
      setAmenities(newAmenities);
      setValue("amenities", newAmenities);
      setTempAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    const newAmenities = amenities.filter((a) => a !== amenity);
    setAmenities(newAmenities);
    setValue("amenities", newAmenities);
  };

  const addHouseRule = () => {
    if (tempRule && !houseRules.includes(tempRule)) {
      const newRules = [...houseRules, tempRule];
      setHouseRules(newRules);
      setValue("houseRules", newRules);
      setTempRule("");
    }
  };

  const removeHouseRule = (rule: string) => {
    const newRules = houseRules.filter((r) => r !== rule);
    setHouseRules(newRules);
    setValue("houseRules", newRules);
  };

  const addGalleryImage = () => {
    if (tempGalleryImage && !galleryImages.includes(tempGalleryImage)) {
      const newGalleryImages = [...galleryImages, tempGalleryImage];
      setGalleryImages(newGalleryImages);
      setValue("galleryImages", newGalleryImages);
      setTempGalleryImage("");
    }
  };

  const removeGalleryImage = (url: string) => {
    const newGalleryImages = galleryImages.filter((img) => img !== url);
    setGalleryImages(newGalleryImages);
    setValue("galleryImages", newGalleryImages);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[áàâãäå]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôõö]/g, "o")
      .replace(/[úùûü]/g, "u")
      .replace(/[ç]/g, "c")
      .replace(/[ñ]/g, "n")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .replace(/^-|-$/g, "");
  };

  // Watch name changes to auto-generate slug
  const watchedName = watch("name");
  useEffect(() => {
    if (watchedName && !isEditing) {
      setValue("slug", generateSlug(watchedName));
    }
  }, [watchedName, setValue, isEditing]);

  const processSubmit = (data: Accommodation) => {
    const processedData = {
      ...data,
      amenities,
      houseRules,
      galleryImages,
    };
    onSubmit(processedData);
  };

  const accommodationTypes = [
    "apartment", "house", "hotel", "room", "studio", 
    "villa", "cabin", "cottage", "loft", "other"
  ];

  const commonAmenities = [
    "Wi-Fi", "Ar-condicionado", "Aquecimento", "Cozinha", "Máquina de lavar",
    "Secadora", "TV", "Estacionamento", "Piscina", "Academia", "Elevador",
    "Varanda", "Jardim", "Churrasqueira", "Lareira", "Banheira de hidromassagem"
  ];

  const commonRules = [
    "Não é permitido fumar", "Não são permitidos animais de estimação",
    "Não são permitidas festas", "Check-in após 15h", "Check-out até 11h",
    "Silêncio após 22h", "Máximo de hóspedes respeitado"
  ];

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="location">Localização</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
        </TabsList>

        {/* Aba Básico */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Acomodação</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "Nome é obrigatório" })}
                    placeholder="Ex: Apartamento Aconchegante no Centro"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL (Slug)</Label>
                  <Input
                    id="slug"
                    {...register("slug", { required: "URL é obrigatória" })}
                    placeholder="apartamento-aconchegante-centro"
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...register("description", { required: "Descrição é obrigatória" })}
                  placeholder="Descreva sua acomodação..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Acomodação</Label>
                  <Select onValueChange={(value) => setValue("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {accommodationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "apartment" && "Apartamento"}
                          {type === "house" && "Casa"}
                          {type === "hotel" && "Hotel"}
                          {type === "room" && "Quarto"}
                          {type === "studio" && "Estúdio"}
                          {type === "villa" && "Vila"}
                          {type === "cabin" && "Cabana"}
                          {type === "cottage" && "Chalé"}
                          {type === "loft" && "Loft"}
                          {type === "other" && "Outro"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website (opcional)</Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Localização */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Endereço</Label>
                  <Input
                    id="street"
                    {...register("address.street", { required: "Endereço é obrigatório" })}
                    placeholder="Rua, número"
                  />
                  {errors.address?.street && (
                    <p className="text-sm text-red-600">{errors.address.street.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    {...register("address.neighborhood", { required: "Bairro é obrigatório" })}
                    placeholder="Centro"
                  />
                  {errors.address?.neighborhood && (
                    <p className="text-sm text-red-600">{errors.address.neighborhood.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    {...register("address.city", { required: "Cidade é obrigatória" })}
                    placeholder="São Paulo"
                  />
                  {errors.address?.city && (
                    <p className="text-sm text-red-600">{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    {...register("address.state", { required: "Estado é obrigatório" })}
                    placeholder="SP"
                  />
                  {errors.address?.state && (
                    <p className="text-sm text-red-600">{errors.address.state.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    {...register("address.zipCode", { required: "CEP é obrigatório" })}
                    placeholder="01000-000"
                  />
                  {errors.address?.zipCode && (
                    <p className="text-sm text-red-600">{errors.address.zipCode.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...register("address.coordinates.latitude", { valueAsNumber: true })}
                    placeholder="-23.550520"
                  />
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...register("address.coordinates.longitude", { valueAsNumber: true })}
                    placeholder="-46.633309"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Detalhes */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pricing */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Preços</h3>
                <div>
                  <Label htmlFor="pricePerNight">Preço por noite (R$)</Label>
                  <Input
                    id="pricePerNight"
                    type="number"
                    {...register("pricing.pricePerNight", { 
                      required: "Preço é obrigatório",
                      valueAsNumber: true 
                    })}
                    placeholder="150"
                  />
                  {errors.pricing?.pricePerNight && (
                    <p className="text-sm text-red-600">{errors.pricing.pricePerNight.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="taxes">Taxas (R$)</Label>
                  <Input
                    id="taxes"
                    type="number"
                    {...register("pricing.taxes", { valueAsNumber: true })}
                    placeholder="15"
                  />
                </div>

                <div>
                  <Label htmlFor="cleaningFee">Taxa de limpeza (R$)</Label>
                  <Input
                    id="cleaningFee"
                    type="number"
                    {...register("pricing.cleaningFee", { valueAsNumber: true })}
                    placeholder="50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rooms & Capacity */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Quartos e Capacidade</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Quartos</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      {...register("rooms.bedrooms", { 
                        required: "Obrigatório",
                        valueAsNumber: true 
                      })}
                      min={0}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Banheiros</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      {...register("rooms.bathrooms", { 
                        required: "Obrigatório",
                        valueAsNumber: true 
                      })}
                      min={0}
                    />
                  </div>

                  <div>
                    <Label htmlFor="beds">Camas</Label>
                    <Input
                      id="beds"
                      type="number"
                      {...register("rooms.beds", { 
                        required: "Obrigatório",
                        valueAsNumber: true 
                      })}
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maximumGuests">Máx. hóspedes</Label>
                    <Input
                      id="maximumGuests"
                      type="number"
                      {...register("maximumGuests", { 
                        required: "Obrigatório",
                        valueAsNumber: true 
                      })}
                      min={1}
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimumStay">Estadia mínima (noites)</Label>
                    <Input
                      id="minimumStay"
                      type="number"
                      {...register("minimumStay", { 
                        required: "Obrigatório",
                        valueAsNumber: true 
                      })}
                      min={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Amenities */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Comodidades</h3>
              
              <div className="flex gap-2">
                <Select value={tempAmenity} onValueChange={setTempAmenity}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma comodidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonAmenities.map((amenity) => (
                      <SelectItem key={amenity} value={amenity}>
                        {amenity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addAmenity}>
                  Adicionar
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Políticas */}
        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Políticas de Check-in/out</h3>
                
                <div>
                  <Label htmlFor="checkIn">Check-in</Label>
                  <Input
                    id="checkIn"
                    type="time"
                    {...register("policies.checkIn", { required: "Obrigatório" })}
                  />
                </div>

                <div>
                  <Label htmlFor="checkOut">Check-out</Label>
                  <Input
                    id="checkOut"
                    type="time"
                    {...register("policies.checkOut", { required: "Obrigatório" })}
                  />
                </div>

                <div>
                  <Label htmlFor="cancellation">Política de Cancelamento</Label>
                  <Select onValueChange={(value) => setValue("policies.cancellation", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a política" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flexible">Flexível</SelectItem>
                      <SelectItem value="Moderate">Moderada</SelectItem>
                      <SelectItem value="Strict">Rigorosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="instantBooking"
                    {...register("instantBooking")}
                  />
                  <Label htmlFor="instantBooking">Reserva instantânea</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Regras da Casa</h3>
                
                <div className="flex gap-2">
                  <Select value={tempRule} onValueChange={setTempRule}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma regra" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonRules.map((rule) => (
                        <SelectItem key={rule} value={rule}>
                          {rule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addHouseRule}>
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {houseRules.map((rule) => (
                    <div key={rule} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{rule}</span>
                      <button
                        type="button"
                        onClick={() => removeHouseRule(rule)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Status</h3>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    {...register("isActive")}
                  />
                  <Label htmlFor="isActive">Ativa</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    {...register("isFeatured")}
                  />
                  <Label htmlFor="isFeatured">Destacada</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Mídia */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Imagem Principal</h3>
              <div>
                <Label htmlFor="mainImage">URL da Imagem Principal</Label>
                <Input
                  id="mainImage"
                  {...register("mainImage", { required: "Imagem principal é obrigatória" })}
                  placeholder="https://..."
                />
                {errors.mainImage && (
                  <p className="text-sm text-red-600">{errors.mainImage.message}</p>
                )}
              </div>

              {watch("mainImage") && (
                <div className="relative w-32 h-24 bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={watch("mainImage") || ""}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Galeria de Imagens</h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder="URL da imagem"
                  value={tempGalleryImage}
                  onChange={(e) => setTempGalleryImage(e.target.value)}
                />
                <Button type="button" onClick={addGalleryImage}>
                  Adicionar
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full h-24 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(url)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEditing ? "Atualizar Acomodação" : "Criar Acomodação"}
        </Button>
      </div>
    </form>
  );
} 