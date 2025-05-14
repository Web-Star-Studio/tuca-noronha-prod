"use client";

import { useForm } from "react-hook-form";
import { Restaurant } from "@/lib/services/restaurantService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import Image from "next/image";

export type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export type WeekdayHours = Record<WeekDay, string[]>;

interface RestaurantFormProps {
  restaurant?: Restaurant | null;
  onSubmit: (data: Restaurant) => void;
  onCancel: () => void;
  loading: boolean;
}

export function RestaurantForm({
  restaurant,
  onSubmit,
  onCancel,
  loading,
}: RestaurantFormProps) {
  const isEditing = !!restaurant;

  // Estados para arrays e objetos complexos
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(restaurant?.cuisine || []);
  const [features, setFeatures] = useState<string[]>(restaurant?.features || []);
  const [tags, setTags] = useState<string[]>(restaurant?.tags || []);
  const [paymentOptions, setPaymentOptions] = useState<string[]>(restaurant?.paymentOptions || []);
  const [galleryImages, setGalleryImages] = useState<string[]>(restaurant?.galleryImages || []);
  const [menuImages, setMenuImages] = useState<string[]>(restaurant?.menuImages || []);
  const [currentTab, setCurrentTab] = useState("basic");
  
  // Estados para inputs temporários
  const [tempCuisine, setTempCuisine] = useState("");
  const [tempFeature, setTempFeature] = useState("");
  const [tempTag, setTempTag] = useState("");
  const [tempPayment, setTempPayment] = useState("");
  const [tempGalleryImage, setTempGalleryImage] = useState("");
  const [tempMenuImage, setTempMenuImage] = useState("");

  // Horários de funcionamento
  const defaultHours = useMemo(() => ({
    Monday: [] as string[],
    Tuesday: [] as string[],
    Wednesday: [] as string[],
    Thursday: [] as string[],
    Friday: [] as string[],
    Saturday: [] as string[],
    Sunday: [] as string[],
  }), []);

  const [hours, setHours] = useState(restaurant?.hours || defaultHours);
  
  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Restaurant>({
    defaultValues: restaurant || {
      name: "",
      slug: "",
      description: "",
      description_long: "",
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
      cuisine: [],
      priceRange: "$$",
      diningStyle: "Casual",
      features: [],
      dressCode: "",
      paymentOptions: [],
      parkingDetails: "",
      mainImage: "",
      galleryImages: [],
      menuImages: [],
      rating: {
        overall: 0,
        food: 0,
        service: 0,
        ambience: 0,
        value: 0,
        noiseLevel: "Quiet",
        totalReviews: 0,
      },
      acceptsReservations: true,
      maximumPartySize: 8,
      tags: [],
      executiveChef: "",
      privatePartyInfo: "",
      isActive: true,
      isFeatured: false,
    },
  });

  // Arrays e objetos manipuladores
  const addCuisineType = () => {
    if (tempCuisine && !cuisineTypes.includes(tempCuisine)) {
      const newCuisineTypes = [...cuisineTypes, tempCuisine];
      setCuisineTypes(newCuisineTypes);
      setValue("cuisine", newCuisineTypes);
      setTempCuisine("");
    }
  };

  const removeCuisineType = (type: string) => {
    const newCuisineTypes = cuisineTypes.filter((t) => t !== type);
    setCuisineTypes(newCuisineTypes);
    setValue("cuisine", newCuisineTypes);
  };

  const addFeature = () => {
    if (tempFeature && !features.includes(tempFeature)) {
      const newFeatures = [...features, tempFeature];
      setFeatures(newFeatures);
      setValue("features", newFeatures);
      setTempFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    const newFeatures = features.filter((f) => f !== feature);
    setFeatures(newFeatures);
    setValue("features", newFeatures);
  };

  const addTag = () => {
    if (tempTag && !tags.includes(tempTag)) {
      const newTags = [...tags, tempTag];
      setTags(newTags);
      setValue("tags", newTags);
      setTempTag("");
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const addPaymentOption = () => {
    if (tempPayment && !paymentOptions.includes(tempPayment)) {
      const newPaymentOptions = [...paymentOptions, tempPayment];
      setPaymentOptions(newPaymentOptions);
      setValue("paymentOptions", newPaymentOptions);
      setTempPayment("");
    }
  };

  const removePaymentOption = (option: string) => {
    const newPaymentOptions = paymentOptions.filter((o) => o !== option);
    setPaymentOptions(newPaymentOptions);
    setValue("paymentOptions", newPaymentOptions);
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

  const addMenuImage = () => {
    if (tempMenuImage && !menuImages.includes(tempMenuImage)) {
      const newMenuImages = [...menuImages, tempMenuImage];
      setMenuImages(newMenuImages);
      setValue("menuImages", newMenuImages);
      setTempMenuImage("");
    }
  };

  const removeMenuImage = (url: string) => {
    const newMenuImages = menuImages.filter((img) => img !== url);
    setMenuImages(newMenuImages);
    setValue("menuImages", newMenuImages);
  };

  // Função para atualizar horários
  const updateHours = (day: keyof typeof hours, type: "open" | "close", index: number, value: string) => {
    const newHours = { ...hours };
    
    // Certificar-se de que o array de horários do dia existe
    if (!newHours[day][index]) {
      newHours[day][index] = "";
    }
    
    // Formato "HH:MM-HH:MM"
    const hourParts = newHours[day][index]?.split("-") || ["", ""];
    
    if (type === "open") {
      hourParts[0] = value;
    } else {
      hourParts[1] = value;
    }
    
    // Atualizar o valor do horário
    newHours[day][index] = hourParts.join("-");
    
    setHours(newHours);
    setValue("hours", newHours);
  };

  // Adicionar período de horário para um dia
  const addHourPeriod = (day: keyof typeof hours) => {
    const newHours = { ...hours };
    newHours[day].push("00:00-00:00");
    setHours(newHours);
    setValue("hours", newHours);
  };

  // Remover período de horário
  const removeHourPeriod = (day: keyof typeof hours, index: number) => {
    const newHours = { ...hours };
    newHours[day].splice(index, 1);
    setHours(newHours);
    setValue("hours", newHours);
  };

  // Função para gerar slug automaticamente
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, "a")
      .replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i")
      .replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u")
      .replace(/[ç]/g, "c")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Watch para nome do restaurante para gerar slug automaticamente
  const watchName = watch("name");

  useEffect(() => {
    if (watchName && !isEditing) {
      setValue("slug", generateSlug(watchName));
    }
  }, [watchName, setValue, isEditing]);

  // Atualizar estados quando mudar o restaurante
  useEffect(() => {
    if (restaurant) {
      setCuisineTypes(restaurant.cuisine || []);
      setFeatures(restaurant.features || []);
      setTags(restaurant.tags || []);
      setPaymentOptions(restaurant.paymentOptions || []);
      setGalleryImages(restaurant.galleryImages || []);
      setMenuImages(restaurant.menuImages || []);
      setHours(restaurant.hours || defaultHours);
    }
  }, [restaurant, defaultHours]);

  // Handler de submissão
  const processSubmit = (data: Restaurant) => {
    // Garantir que todas as listas estão incluídas
    const completeData = {
      ...data,
      cuisine: cuisineTypes,
      features: features,
      tags: tags,
      paymentOptions: paymentOptions,
      galleryImages: galleryImages,
      menuImages: menuImages,
      hours: hours,
    };

    // Chamar a função onSubmit com os dados completos
    onSubmit(completeData);
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
        </TabsList>

        {/* Tab de informações básicas */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Restaurante *</Label>
              <Input
                id="name"
                placeholder="Ex: Cantinho Gourmet"
                {...register("name", { required: "Nome é obrigatório" })}
                error={errors.name?.message}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                placeholder="Ex: cantinho-gourmet"
                {...register("slug", { required: "Slug é obrigatório" })}
                error={errors.slug?.message}
              />
              {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Curta *</Label>
            <Textarea
              id="description"
              placeholder="Breve descrição do restaurante"
              {...register("description", { required: "Descrição é obrigatória" })}
              error={errors.description?.message}
              rows={2}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_long">Descrição Completa *</Label>
            <Textarea
              id="description_long"
              placeholder="Descrição detalhada do restaurante"
              {...register("description_long", { required: "Descrição completa é obrigatória" })}
              error={errors.description_long?.message}
              rows={4}
            />
            {errors.description_long && <p className="text-sm text-red-500">{errors.description_long.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priceRange">Faixa de Preço *</Label>
              <Select
                defaultValue={restaurant?.priceRange || "$$"}
                onValueChange={(value) => setValue("priceRange", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a faixa de preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ (Econômico)</SelectItem>
                  <SelectItem value="$$">$$ (Moderado)</SelectItem>
                  <SelectItem value="$$$">$$$ (Caro)</SelectItem>
                  <SelectItem value="$$$$">$$$$ (Luxo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diningStyle">Estilo de Serviço *</Label>
              <Select
                defaultValue={restaurant?.diningStyle || "Casual"}
                onValueChange={(value) => setValue("diningStyle", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Casual Elegante">Casual Elegante</SelectItem>
                  <SelectItem value="Fine Dining">Fine Dining</SelectItem>
                  <SelectItem value="Bistro">Bistro</SelectItem>
                  <SelectItem value="Self-Service">Self-Service</SelectItem>
                  <SelectItem value="Fast-Casual">Fast-Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipos de Cozinha *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Italiana"
                value={tempCuisine}
                onChange={(e) => setTempCuisine(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addCuisineType} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {cuisineTypes.map((type, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {type}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeCuisineType(type)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            {!cuisineTypes.length && (
              <p className="text-sm text-amber-600">Adicione pelo menos um tipo de cozinha</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="Ex: +55 21 99999-9999"
                  {...register("phone", { required: "Telefone é obrigatório" })}
                  error={errors.phone?.message}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="Ex: https://www.restaurante.com"
                  {...register("website")}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mainImage">Imagem Principal *</Label>
            <Input
              id="mainImage"
              placeholder="URL da imagem principal"
              {...register("mainImage", { required: "Imagem principal é obrigatória" })}
              error={errors.mainImage?.message}
            />
            {errors.mainImage && <p className="text-sm text-red-500">{errors.mainImage.message}</p>}
            {watch("mainImage") && (
              <div className="mt-2 relative h-40 w-full overflow-hidden rounded-md">
                <Image 
                  src={watch("mainImage")} 
                  alt="Preview" 
                  className="object-cover"
                  fill
                  sizes="100vw"
                  onError={() => {
                    // Na eventualidade de um erro, não podemos modificar o src com Image
                    // O fallback é implementado pelo componente de erro do Next.js
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="acceptsReservations" 
                checked={watch("acceptsReservations")} 
                onCheckedChange={(checked) => setValue("acceptsReservations", checked)} 
              />
              <Label htmlFor="acceptsReservations">Aceita Reservas</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximumPartySize">Tamanho Máximo de Grupo *</Label>
              <Input
                id="maximumPartySize"
                type="number"
                min="1"
                max="100"
                {...register("maximumPartySize", { 
                  required: "Tamanho máximo é obrigatório",
                  valueAsNumber: true,
                  min: { value: 1, message: "Deve ser pelo menos 1" },
                })}
                error={errors.maximumPartySize?.message}
              />
              {errors.maximumPartySize && <p className="text-sm text-red-500">{errors.maximumPartySize.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                checked={watch("isActive")} 
                onCheckedChange={(checked) => setValue("isActive", checked)} 
              />
              <Label htmlFor="isActive">Restaurante Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="isFeatured" 
                checked={watch("isFeatured")} 
                onCheckedChange={(checked) => setValue("isFeatured", checked)} 
              />
              <Label htmlFor="isFeatured">Destacar na Home</Label>
            </div>
          </div>
        </TabsContent>

        {/* Tab de detalhes */}
        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label>Características</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Pet Friendly"
                value={tempFeature}
                onChange={(e) => setTempFeature(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addFeature} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {feature}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeFeature(feature)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Romântico"
                value={tempTag}
                onChange={(e) => setTempTag(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formas de Pagamento *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Visa"
                value={tempPayment}
                onChange={(e) => setTempPayment(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addPaymentOption} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {paymentOptions.map((option, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {option}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removePaymentOption(option)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            {!paymentOptions.length && (
              <p className="text-sm text-amber-600">Adicione pelo menos uma forma de pagamento</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dressCode">Código de Vestimenta</Label>
            <Select
              defaultValue={restaurant?.dressCode || "Casual"}
              onValueChange={(value) => setValue("dressCode", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o código de vestimenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                <SelectItem value="Casual Chic">Casual Chic</SelectItem>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Black Tie">Black Tie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parkingDetails">Informações de Estacionamento</Label>
            <Textarea
              id="parkingDetails"
              placeholder="Ex: Estacionamento gratuito disponível"
              {...register("parkingDetails")}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="executiveChef">Chef Executivo</Label>
            <Input
              id="executiveChef"
              placeholder="Ex: Maria Silva"
              {...register("executiveChef")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privatePartyInfo">Informações para Eventos Privados</Label>
            <Textarea
              id="privatePartyInfo"
              placeholder="Ex: Dispomos de um salão privativo para até 30 pessoas"
              {...register("privatePartyInfo")}
              rows={3}
            />
          </div>

          {/* Seção de Classificações */}
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h3 className="font-medium">Classificações Iniciais</h3>
            <p className="text-sm text-gray-500">Valores iniciais para novos restaurantes. Poderão ser alterados com base em avaliações reais.</p>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rating.overall">Classificação Geral (0-5)</Label>
                <Input
                  id="rating.overall"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  {...register("rating.overall", { 
                    required: "Classificação geral é obrigatória",
                    valueAsNumber: true,
                    min: { value: 0, message: "Mínimo é 0" },
                    max: { value: 5, message: "Máximo é 5" },
                  })}
                  error={errors.rating?.overall?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating.food">Comida (0-5)</Label>
                <Input
                  id="rating.food"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  {...register("rating.food", { 
                    required: "Classificação da comida é obrigatória",
                    valueAsNumber: true,
                    min: { value: 0, message: "Mínimo é 0" },
                    max: { value: 5, message: "Máximo é 5" },
                  })}
                  error={errors.rating?.food?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating.service">Serviço (0-5)</Label>
                <Input
                  id="rating.service"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  {...register("rating.service", { 
                    required: "Classificação do serviço é obrigatória",
                    valueAsNumber: true,
                    min: { value: 0, message: "Mínimo é 0" },
                    max: { value: 5, message: "Máximo é 5" },
                  })}
                  error={errors.rating?.service?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating.ambience">Ambiente (0-5)</Label>
                <Input
                  id="rating.ambience"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  {...register("rating.ambience", { 
                    required: "Classificação do ambiente é obrigatória",
                    valueAsNumber: true,
                    min: { value: 0, message: "Mínimo é 0" },
                    max: { value: 5, message: "Máximo é 5" },
                  })}
                  error={errors.rating?.ambience?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating.value">Custo-Benefício (0-5)</Label>
                <Input
                  id="rating.value"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  {...register("rating.value", { 
                    required: "Classificação do custo-benefício é obrigatória",
                    valueAsNumber: true,
                    min: { value: 0, message: "Mínimo é 0" },
                    max: { value: 5, message: "Máximo é 5" },
                  })}
                  error={errors.rating?.value?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating.noiseLevel">Nível de Ruído</Label>
                <Select
                  defaultValue={restaurant?.rating?.noiseLevel || "Moderate"}
                  onValueChange={(value) => setValue("rating.noiseLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível de ruído" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quiet">Silencioso</SelectItem>
                    <SelectItem value="Moderate">Moderado</SelectItem>
                    <SelectItem value="Energetic">Enérgico</SelectItem>
                    <SelectItem value="Very Loud">Muito Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating.totalReviews">Total de Avaliações</Label>
              <Input
                id="rating.totalReviews"
                type="number"
                min="0"
                {...register("rating.totalReviews", { 
                  required: "Total de avaliações é obrigatório",
                  valueAsNumber: true,
                  min: { value: 0, message: "Mínimo é 0" },
                })}
                error={errors.rating?.totalReviews?.message}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab de endereço */}
        <TabsContent value="address" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address.street">Rua/Avenida *</Label>
            <Input
              id="address.street"
              placeholder="Ex: Rua das Flores, 123"
              {...register("address.street", { required: "Rua é obrigatória" })}
              error={errors.address?.street?.message}
            />
            {errors.address?.street && <p className="text-sm text-red-500">{errors.address?.street.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address.neighborhood">Bairro *</Label>
              <Input
                id="address.neighborhood"
                placeholder="Ex: Centro"
                {...register("address.neighborhood", { required: "Bairro é obrigatório" })}
                error={errors.address?.neighborhood?.message}
              />
              {errors.address?.neighborhood && <p className="text-sm text-red-500">{errors.address?.neighborhood.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.city">Cidade *</Label>
              <Input
                id="address.city"
                placeholder="Ex: Rio de Janeiro"
                {...register("address.city", { required: "Cidade é obrigatória" })}
                error={errors.address?.city?.message}
              />
              {errors.address?.city && <p className="text-sm text-red-500">{errors.address?.city.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address.state">Estado *</Label>
              <Input
                id="address.state"
                placeholder="Ex: RJ"
                {...register("address.state", { required: "Estado é obrigatório" })}
                error={errors.address?.state?.message}
              />
              {errors.address?.state && <p className="text-sm text-red-500">{errors.address?.state.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.zipCode">CEP *</Label>
              <Input
                id="address.zipCode"
                placeholder="Ex: 20000-000"
                {...register("address.zipCode", { required: "CEP é obrigatório" })}
                error={errors.address?.zipCode?.message}
              />
              {errors.address?.zipCode && <p className="text-sm text-red-500">{errors.address?.zipCode.message}</p>}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h3 className="font-medium">Coordenadas</h3>
            <p className="text-sm text-gray-500">Coordenadas geográficas para localização precisa no mapa.</p>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address.coordinates.latitude">Latitude *</Label>
                <Input
                  id="address.coordinates.latitude"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: -22.9028"
                  {...register("address.coordinates.latitude", { 
                    required: "Latitude é obrigatória",
                    valueAsNumber: true,
                  })}
                  error={errors.address?.coordinates?.latitude?.message}
                />
                {errors.address?.coordinates?.latitude && (
                  <p className="text-sm text-red-500">{errors.address?.coordinates?.latitude.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.coordinates.longitude">Longitude *</Label>
                <Input
                  id="address.coordinates.longitude"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: -43.2075"
                  {...register("address.coordinates.longitude", { 
                    required: "Longitude é obrigatória",
                    valueAsNumber: true,
                  })}
                  error={errors.address?.coordinates?.longitude?.message}
                />
                {errors.address?.coordinates?.longitude && (
                  <p className="text-sm text-red-500">{errors.address?.coordinates?.longitude.message}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab de horários */}
        <TabsContent value="hours" className="space-y-4">
          <div className="border rounded-lg p-4 space-y-6 bg-gray-50">
            <h3 className="font-medium">Horários de Funcionamento</h3>
            <p className="text-sm text-gray-500">Defina os horários de abertura e fechamento para cada dia da semana. Deixe em branco para dias fechados.</p>
            
            {Object.entries(hours).map(([day, periods]) => (
              <div key={day} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-medium">{day}</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addHourPeriod(day as keyof typeof hours)}
                    className="h-8 text-xs"
                  >
                    + Horário
                  </Button>
                </div>
                
                {periods.length === 0 ? (
                  <div className="flex items-center p-2 bg-gray-100 rounded">
                    <p className="text-sm text-gray-500 italic">Fechado</p>
                  </div>
                ) : (
                  periods.map((period: string, index: number) => {
                    const [openTime, closeTime] = period.split("-");
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-2">
                          <Input
                            type="time"
                            value={openTime}
                            onChange={(e) => updateHours(day as keyof typeof hours, "open", index, e.target.value)}
                            className="w-32"
                          />
                          <span>até</span>
                          <Input
                            type="time"
                            value={closeTime}
                            onChange={(e) => updateHours(day as keyof typeof hours, "close", index, e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost"
                          size="icon" 
                          onClick={() => removeHourPeriod(day as keyof typeof hours, index)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab de mídia */}
        <TabsContent value="media" className="space-y-4">
          <div className="space-y-2">
            <Label>Galeria de Imagens</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL da imagem da galeria"
                value={tempGalleryImage}
                onChange={(e) => setTempGalleryImage(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addGalleryImage} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {galleryImages.map((url, index) => (
                <Card key={index} className="overflow-hidden relative group">
                  <div className="relative h-40 w-full">
                    <div className="relative w-full h-full">
                      <Image 
                        src={url} 
                        alt={`Galeria ${index + 1}`}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeGalleryImage(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs text-gray-500 truncate">{url}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagens do Menu</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL da imagem do menu"
                value={tempMenuImage}
                onChange={(e) => setTempMenuImage(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addMenuImage} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {menuImages.map((url, index) => (
                <Card key={index} className="overflow-hidden relative group">
                  <div className="relative h-40 w-full">
                    <div className="relative w-full h-full">
                      <Image 
                        src={url} 
                        alt={`Menu ${index + 1}`}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMenuImage(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs text-gray-500 truncate">{url}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="space-x-2">
          <Button 
            type="button" 
            variant="secondary"
            disabled={loading}
            onClick={() => {
              // Avançar para o próximo tab
              const tabs = ["basic", "details", "address", "hours", "media"];
              const currentIndex = tabs.indexOf(currentTab);
              if (currentIndex < tabs.length - 1) {
                setCurrentTab(tabs[currentIndex + 1]);
              }
            }}
          >
            Próximo
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
