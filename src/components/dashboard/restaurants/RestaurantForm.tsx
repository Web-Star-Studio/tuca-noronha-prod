"use client";

import { useForm } from "react-hook-form";
import { Restaurant } from "@/lib/services/restaurantService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MediaSelector } from "@/components/dashboard/media";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Store, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Media } from "@/lib/services/mediaService";
import { parseMediaEntry, serializeMediaEntry } from "@/lib/media";
import { SmartMedia } from "@/components/ui/smart-media";

export type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export type WeekdayHours = Record<WeekDay, string[]>;

interface RestaurantFormProps {
  restaurant?: Restaurant | null;
  onSubmit: (data: Restaurant) => void;
  onCancel: () => void;
  loading: boolean;
  // Dados iniciais vindos do formulário de empreendimento
  initialData?: {
    name?: string;
    phone?: string;
    website?: string;
    description?: string;
  };
  // Modo de criação dentro do fluxo de empreendimento
  isEmbedded?: boolean;
}

export function RestaurantForm({
  restaurant,
  onSubmit,
  onCancel,
  loading,
  initialData,
  isEmbedded = false,
}: RestaurantFormProps) {
  const isEditing = !!restaurant;
  const [mainMediaPickerOpen, setMainMediaPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);

  // Convert BigInt values from Convex to regular numbers for the form
  const prepareRestaurantForForm = (restaurant: Restaurant | null | undefined) => {
    if (!restaurant) return null;
    
    return {
      ...restaurant,
      netRate: restaurant.netRate ?? restaurant.price ?? undefined,
      maximumPartySize: Number(restaurant.maximumPartySize) || 8,
      rating: {
        ...restaurant.rating,
        overall: Number(restaurant.rating.overall) || 0,
        food: Number(restaurant.rating.food) || 0,
        service: Number(restaurant.rating.service) || 0,
        ambience: Number(restaurant.rating.ambience) || 0,
        value: Number(restaurant.rating.value) || 0,
        totalReviews: Number(restaurant.rating.totalReviews) || 0,
      },
      address: {
        ...restaurant.address,
        coordinates: {
          latitude: Number(restaurant.address.coordinates.latitude) || 0,
          longitude: Number(restaurant.address.coordinates.longitude) || 0,
        },
      },
    };
  };

  // Prepare restaurant data with BigInt converted to numbers
  const preparedRestaurant = useMemo(() => prepareRestaurantForForm(restaurant), [restaurant]);

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

  // Form setup - needs to be initialized before using watch
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Restaurant>({
    defaultValues: preparedRestaurant || {
      name: initialData?.name || "",
      slug: initialData?.name ? generateSlug(initialData.name) : "",
      description: initialData?.description || "",
      description_long: initialData?.description || "",
      address: {
        street: "",
        city: "Fernando de Noronha",
        state: "Pernambuco",
        zipCode: "",
        neighborhood: "",
        coordinates: {
          latitude: -3.8549,
          longitude: -32.4238,
        },
      },
      phone: initialData?.phone || "",
      website: initialData?.website || "",
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
      hours: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      },
      status: "draft",
      netRate: undefined,
      tags: [],
      location: "Fernando de Noronha",
      isActive: true,
      isFeatured: false,
      executiveChef: "",
      privatePartyInfo: "",
      price: undefined,
      acceptsOnlinePayment: false,
      requiresUpfrontPayment: false,
    },
  });

  // Estados para arrays e objetos complexos
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(preparedRestaurant?.cuisine || []);
  const [features, setFeatures] = useState<string[]>(preparedRestaurant?.features || []);
  const [tags, setTags] = useState<string[]>(preparedRestaurant?.tags || []);
  const [paymentOptions, setPaymentOptions] = useState<string[]>(preparedRestaurant?.paymentOptions || []);
  const [galleryImages, setGalleryImages] = useState<string[]>(preparedRestaurant?.galleryImages || []);
  const [menuImages, setMenuImages] = useState<string[]>(preparedRestaurant?.menuImages || []);
  const [currentTab, setCurrentTab] = useState(isEmbedded ? "basic" : "basic");

  const galleryEntries = useMemo(
    () => galleryImages.map(parseMediaEntry),
    [galleryImages],
  );

  const mainImageValue = watch("mainImage") ?? "";
  const mainImageEntry = parseMediaEntry(mainImageValue);
  const mainImageGalleryEntry = galleryEntries.find(
    (entry) => entry.url === mainImageEntry.url,
  );
  const mainImageUrl = mainImageGalleryEntry?.url ?? mainImageEntry.url;
  const previewMainEntry = mainImageGalleryEntry ?? mainImageEntry;
  const hasMainImage = Boolean(previewMainEntry.url && previewMainEntry.url.trim() !== "");

  const handleAppendGalleryMedia = useCallback((items: Media[]) => {
    setGalleryImages((prev) => {
      if (items.length === 0) return prev;

      const existingUrls = new Set(prev.map((entry) => parseMediaEntry(entry).url));
      const appended = items
        .filter((item) => !existingUrls.has(item.url))
        .map((item) => serializeMediaEntry({ url: item.url, type: item.fileType || undefined }));

      if (appended.length === 0) return prev;

      const next = [...prev, ...appended];
      setValue("galleryImages", next);
      return next;
    });
  }, [setValue]);
  
  // Estados para inputs temporários
  const [tempCuisine, setTempCuisine] = useState("");
  const [tempFeature, setTempFeature] = useState("");
  const [tempTag, setTempTag] = useState("");
  const [tempPayment, setTempPayment] = useState("");
  const [tempGalleryImage, setTempGalleryImage] = useState("");
  const [tempMenuImage, setTempMenuImage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const [hours, setHours] = useState(preparedRestaurant?.hours || defaultHours);

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
    if (!tempGalleryImage) return;

    const serialized = serializeMediaEntry({ url: tempGalleryImage });
    const exists = galleryImages.some(
      (image) => parseMediaEntry(image).url === tempGalleryImage,
    );

    if (!exists) {
      const newGalleryImages = [...galleryImages, serialized];
      setGalleryImages(newGalleryImages);
      setValue("galleryImages", newGalleryImages);
    }

    setTempGalleryImage("");
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
    console.log("RestaurantForm processSubmit called");
    console.log("Form data:", data);
    
    // Reset validation error
    setValidationError(null);
    
    // Validação básica
    if (!data.name || !data.slug || !data.description || !data.description_long) {
      const error = "Por favor, preencha todos os campos obrigatórios: Nome, Slug, Descrição e Descrição Completa.";
      setValidationError(error);
      console.error("Missing required fields:", {
        name: data.name,
        slug: data.slug,
        description: data.description,
        description_long: data.description_long
      });
      return;
    }

    if (cuisineTypes.length === 0) {
      setValidationError("Por favor, adicione pelo menos um tipo de cozinha.");
      console.error("No cuisine types selected");
      return;
    }

    if (paymentOptions.length === 0) {
      setValidationError("Por favor, adicione pelo menos uma forma de pagamento.");
      console.error("No payment options selected");
      return;
    }

    if (!data.mainImage) {
      setValidationError("Por favor, selecione uma imagem principal para o restaurante.");
      console.error("No main image selected");
      return;
    }

    if (!data.address?.street || !data.address?.neighborhood || !data.address?.zipCode) {
      setValidationError("Por favor, preencha todos os campos de endereço: Rua, Bairro e CEP.");
      console.error("Missing address fields:", data.address);
      return;
    }

    if (!data.phone) {
      setValidationError("Por favor, informe o telefone do restaurante.");
      console.error("Missing phone");
      return;
    }
    
    // Garantir que todas as listas estão incluídas
    const completeData = {
      ...data,
      // Aplicar dados iniciais se estiver no modo embedded e os campos não foram preenchidos
      name: data.name || initialData?.name || "",
      phone: data.phone || initialData?.phone || "",
      website: data.website || initialData?.website || "",
      description: data.description || initialData?.description || "",
      description_long: data.description_long || initialData?.description || "",
      cuisine: cuisineTypes,
      features: features,
      tags: tags,
      paymentOptions: paymentOptions,
      galleryImages: galleryImages,
      menuImages: menuImages,
      hours: hours,
      // Convert string values to numbers
      maximumPartySize: Number(data.maximumPartySize) || 8,
      address: {
        ...data.address,
        city: "Fernando de Noronha",
        state: "Pernambuco",
        coordinates: {
          latitude: -3.8549,
          longitude: -32.4238,
        },
      },
      rating: {
        overall: 4.0,
        food: 4.0,
        service: 4.0,
        ambience: 4.0,
        value: 4.0,
        noiseLevel: "Moderate",
        totalReviews: 0,
      },
    };

    console.log("Complete data to submit:", completeData);

    // Chamar a função onSubmit com os dados completos
    onSubmit(completeData);
  };



  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      {/* Alerta de erro de validação */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Validação</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-4">
          <TabsTrigger value="basic">{isEmbedded ? "Config. Base" : "Básico"}</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
        </TabsList>

        {/* Mensagem informativa quando estiver no modo embedded */}
        {isEmbedded && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Store className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Configuração do Restaurante</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Configure agora os detalhes específicos do seu restaurante. As informações básicas 
                  (nome, telefone, website) já foram preenchidas na etapa anterior.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab de informações básicas */}
        <TabsContent value="basic" className="space-y-4">
          {/* Mostrar campos de nome apenas quando não estiver no modo embedded ou quando estiver editando */}
          {(!isEmbedded || isEditing) && (
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
          )}

          {/* Preview dos dados herdados quando estiver no modo embedded */}
          {isEmbedded && !isEditing && (initialData?.name || initialData?.phone || initialData?.website) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">Dados do Empreendimento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {initialData?.name && (
                        <div>
                          <span className="text-blue-700 font-medium">Nome:</span>
                          <span className="ml-2 text-blue-800">{initialData.name}</span>
                        </div>
                      )}
                      {initialData?.phone && (
                        <div>
                          <span className="text-blue-700 font-medium">Telefone:</span>
                          <span className="ml-2 text-blue-800">{initialData.phone}</span>
                        </div>
                      )}
                      {initialData?.website && (
                        <div>
                          <span className="text-blue-700 font-medium">Website:</span>
                          <span className="ml-2 text-blue-800">{initialData.website}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      ℹ️ Estes dados foram preenchidos na etapa anterior e serão aplicados automaticamente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seletor de mídia para imagem principal */}
          <MediaSelector
            open={mainMediaPickerOpen}
            onOpenChange={setMainMediaPickerOpen}
            initialSelected={mainImageUrl ? [mainImageUrl] : []}
            onSelect={() => {}}
            onSelectMedia={([item]) => {
              if (!item) return;
              setValue("mainImage", item.url);
              handleAppendGalleryMedia([item]);
            }}
          />
          {/* Mostrar campos de descrição apenas quando não estiver no modo embedded ou quando estiver editando */}
          {(!isEmbedded || isEditing) && (
            <>
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
            </>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priceRange">Faixa de Preço *</Label>
              <Select
                defaultValue={preparedRestaurant?.priceRange || "$$"}
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
                defaultValue={preparedRestaurant?.diningStyle || "Casual"}
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

          {/* Mostrar campos de contato apenas quando não estiver no modo embedded ou quando estiver editando */}
          {(!isEmbedded || isEditing) && (
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
          )}
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Imagem Principal *</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={watch("mainImage") || ""}
                placeholder="Nenhuma imagem selecionada"
                className="flex-1"
              />
              <Button type="button" onClick={() => setMainMediaPickerOpen(true)}>
                Selecionar da Biblioteca
              </Button>
            </div>
            {errors.mainImage && <p className="text-sm text-red-500">{errors.mainImage.message}</p>}
            {hasMainImage && (
              <div className="mt-2 relative h-40 w-full overflow-hidden rounded-md">
                <SmartMedia
                  entry={previewMainEntry}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  imageProps={{ fill: true }}
                  videoProps={{ controls: true, preload: "metadata" }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="acceptsReservations" 
                variant="default"
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
                variant="success"
                checked={watch("isActive")} 
                onCheckedChange={(checked) => setValue("isActive", checked)} 
              />
              <Label htmlFor="isActive">Restaurante Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="isFeatured" 
                variant="warning"
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
                              defaultValue={preparedRestaurant?.dressCode || "Casual"}
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

          {/* Configurações de Pagamento */}
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações de Reserva e Pagamento</h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço por Reserva (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 50.00"
                    {...register("price", { 
                      valueAsNumber: true,
                      validate: (value) => {
                        if (value !== undefined && value < 0) {
                          return "O preço não pode ser negativo";
                        }
                        return true;
                      }
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Deixe em branco se o restaurante não cobra por reserva
                  </p>
                  {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netRate">Tarifa net (R$)</Label>
                  <Input
                    id="netRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 35.00"
                    {...register("netRate", {
                      valueAsNumber: true,
                      validate: (value) => {
                        const priceValue = watch("price");
                        if (value === undefined || Number.isNaN(value)) {
                          if (priceValue !== undefined && !Number.isNaN(priceValue)) {
                            return "Informe a tarifa net";
                          }
                          return true;
                        }
                        if (value < 0) {
                          return "A tarifa net não pode ser negativa";
                        }
                        if (priceValue !== undefined && !Number.isNaN(priceValue) && value > priceValue) {
                          return "A tarifa net deve ser menor ou igual ao preço";
                        }
                        return true;
                      }
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Valor líquido do fornecedor; usamos essa base para calcular o repasse.
                  </p>
                  {errors.netRate && <p className="text-sm text-red-500">{errors.netRate.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="acceptsOnlinePayment">Aceita Pagamento Online</Label>
                    <p className="text-xs text-gray-500">
                      Permite pagamento online
                    </p>
                  </div>
                  <Switch
                    id="acceptsOnlinePayment"
                    checked={watch("acceptsOnlinePayment") || false}
                    onCheckedChange={(checked) => setValue("acceptsOnlinePayment", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requiresUpfrontPayment">Exige Pagamento Antecipado</Label>
                    <p className="text-xs text-gray-500">
                      Cobrar no momento da reserva
                    </p>
                  </div>
                  <Switch
                    id="requiresUpfrontPayment"
                    checked={watch("requiresUpfrontPayment") || false}
                    onCheckedChange={(checked) => setValue("requiresUpfrontPayment", checked)}
                    disabled={!watch("acceptsOnlinePayment")}
                  />
                </div>
              </div>
            </div>

            {watch("acceptsOnlinePayment") && watch("requiresUpfrontPayment") && !watch("price") && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Para exigir pagamento antecipado, você precisa definir um preço por reserva.
                </AlertDescription>
              </Alert>
            )}
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
              <Label htmlFor="address.zipCode">CEP *</Label>
              <Input
                id="address.zipCode"
                placeholder="Ex: 53990-000"
                {...register("address.zipCode", { required: "CEP é obrigatório" })}
                error={errors.address?.zipCode?.message}
              />
              {errors.address?.zipCode && <p className="text-sm text-red-500">{errors.address?.zipCode.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address.city">Cidade</Label>
              <Input
                id="address.city"
                value="Fernando de Noronha"
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500">Nossa plataforma é exclusiva para Fernando de Noronha</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.state">Estado</Label>
              <Input
                id="address.state"
                value="Pernambuco"
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
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
            <Label>Galeria</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL da mídia da galeria"
                value={tempGalleryImage}
                onChange={(e) => setTempGalleryImage(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addGalleryImage} variant="outline">
                Adicionar
              </Button>
              <Button type="button" onClick={() => setGalleryPickerOpen(true)} variant="outline">
                Selecionar da Biblioteca
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 mt-2">
              {galleryEntries.map((entry, index) => (
                <Card key={`${entry.url}-${index}`} className="relative overflow-hidden group">
                  <div className="relative h-40 w-full">
                    <div className="relative h-full w-full">
                      <SmartMedia
                        entry={entry}
                        alt={`Mídia ${index + 1}`}
                        className="h-full w-full object-cover"
                        imageProps={{
                          fill: true,
                          sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
                        }}
                        videoProps={{ controls: true, preload: "metadata" }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => removeGalleryImage(galleryImages[index])}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-2">
                    <p className="truncate text-xs text-gray-500">{entry.url}</p>
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
              <Button type="button" onClick={() => setMenuPickerOpen(true)} variant="outline">
                Selecionar da Biblioteca
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {menuImages.map((url, index) => (
                <Card key={index} className="overflow-hidden relative group">
                  <div className="relative h-40 w-full">
                    <div className="relative w-full h-full">
                      <SmartMedia
                        entry={parseMediaEntry(url)}
                        alt={`Menu ${index + 1}`}
                        className="h-full w-full object-cover"
                        imageProps={{
                          fill: true,
                          sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
                        }}
                        videoProps={{ controls: true, preload: "metadata" }}
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
          {/* Seletor de mídia para galeria e menu */}
        <MediaSelector
          open={galleryPickerOpen}
          onOpenChange={setGalleryPickerOpen}
          multiple
          initialSelected={galleryEntries.map((entry) => entry.url)}
          onSelect={() => {}}
          onSelectMedia={handleAppendGalleryMedia}
        />
          <MediaSelector
            open={menuPickerOpen}
            onOpenChange={setMenuPickerOpen}
            multiple
            initialSelected={menuImages}
            onSelect={(urls) => {
              // Remove duplicatas e adiciona apenas URLs novas
              setMenuImages(prev => {
                const newUrls = urls.filter(url => !prev.includes(url));
                return [...prev, ...newUrls];
              });
            }}
          />
      </Tabs>

      <Separator />

      <div className="flex justify-between pt-2">
        <div>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="outline"
            className="ml-2"
            onClick={() => {
              // Limpar erro de validação
              setValidationError(null);
              
              // Preencher campos obrigatórios para teste
              setValue("name", "Restaurante Teste");
              setValue("slug", "restaurante-teste");
              setValue("description", "Descrição curta do restaurante teste");
              setValue("description_long", "Descrição longa e detalhada do restaurante teste para validação do formulário");
              setValue("phone", "+55 81 99999-9999");
              setValue("mainImage", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4");
              setValue("address.street", "Rua Teste, 123");
              setValue("address.neighborhood", "Centro");
              setValue("address.zipCode", "53990-000");
              setCuisineTypes(["Brasileira", "Internacional"]);
              setPaymentOptions(["Dinheiro", "Cartão de Crédito", "Pix"]);
              console.log("Test data filled");
            }}
          >
            Preencher Teste
          </Button>
        </div>
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
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar Restaurante"}
          </Button>
        </div>
      </div>
    </form>
  );
}
