"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingStars } from "./RatingStars";
import { useCreateReview, CreateReviewData } from "@/lib/hooks/useCreateReview";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { toast } from "sonner";

const reviewSchema = z.object({
  rating: z.number().min(1, "Selecione uma avaliação").max(5, "Avaliação máxima é 5"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(100, "Título muito longo"),
  comment: z.string().min(10, "Comentário deve ter pelo menos 10 caracteres").max(1000, "Comentário muito longo"),
  wouldRecommend: z.boolean(),
  visitDate: z.string().optional(),
  groupType: z.string().optional(),
  detailedRatings: z.object({
    value: z.number().min(1).max(5).optional(),
    service: z.number().min(1).max(5).optional(),
    cleanliness: z.number().min(1).max(5).optional(),
    location: z.number().min(1).max(5).optional(),
    food: z.number().min(1).max(5).optional(),
    organization: z.number().min(1).max(5).optional(),
    guide: z.number().min(1).max(5).optional(),
  }).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  itemType: string;
  itemId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  isVerified?: boolean;
}

export function ReviewForm({
  itemType,
  itemId,
  onSuccess,
  onCancel,
  className,
  isVerified = false
}: ReviewFormProps) {
  const { user } = useCurrentUser();
  const { submitReview, isSubmitting } = useCreateReview();
  const [photos] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      wouldRecommend: true,
      detailedRatings: {}
    }
  });

  const rating = watch("rating");
  const detailedRatings = watch("detailedRatings") || {};

  // Configurar campos detalhados baseado no tipo de item
  const getDetailedRatingFields = () => {
    switch (itemType) {
      case "restaurant":
        return [
          { key: "food", label: "Comida" },
          { key: "service", label: "Serviço" },
          { key: "location", label: "Ambiente" },
          { key: "value", label: "Custo-benefício" }
        ];

      case "activity":
        return [
          { key: "organization", label: "Organização" },
          { key: "guide", label: "Guia" },
          { key: "value", label: "Custo-benefício" }
        ];
      case "event":
        return [
          { key: "organization", label: "Organização" },
          { key: "value", label: "Custo-benefício" }
        ];
      case "vehicle":
        return [
          { key: "cleanliness", label: "Condição" },
          { key: "service", label: "Atendimento" },
          { key: "value", label: "Custo-benefício" }
        ];
      default:
        return [
          { key: "service", label: "Serviço" },
          { key: "value", label: "Custo-benefício" }
        ];
    }
  };

  const detailedFields = getDetailedRatingFields();

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast.error("Você precisa estar logado para avaliar");
      return;
    }

    try {
      const reviewData: CreateReviewData = {
        itemType,
        itemId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        wouldRecommend: data.wouldRecommend,
        visitDate: data.visitDate,
        groupType: data.groupType,
        detailedRatings: data.detailedRatings,
        photos,
        isVerified
      };

      await submitReview(user._id as Id<"users">, reviewData);
      onSuccess?.();
    } catch {
      // Error is handled by the hook
    }
  };

  if (!user) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Faça login para avaliar</p>
            <p className="text-sm text-gray-500">Compartilhe sua experiência com outros viajantes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Avaliar Experiência</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              Avaliação Geral <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-4">
              <RatingStars
                rating={rating}
                interactive
                size="lg"
                onChange={(newRating) => setValue("rating", newRating)}
              />
              {rating > 0 && (
                <span className="text-sm text-gray-600">
                  {rating === 1 && "Muito ruim"}
                  {rating === 2 && "Ruim"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Bom"}
                  {rating === 5 && "Excelente"}
                </span>
              )}
            </div>
            {errors.rating && (
              <p className="text-sm text-red-500">{errors.rating.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
              Título da Avaliação <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Resuma sua experiência..."
              {...register("title")}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-medium">
              Comentário <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Conte-nos sobre sua experiência..."
              rows={4}
              {...register("comment")}
              className={errors.comment ? "border-red-500" : ""}
            />
            {errors.comment && (
              <p className="text-sm text-red-500">{errors.comment.message}</p>
            )}
          </div>

          {/* Detailed Ratings */}
          {detailedFields.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Avaliações Detalhadas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedFields.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm">{label}</Label>
                    <RatingStars
                      rating={detailedRatings[key as keyof typeof detailedRatings] || 0}
                      interactive
                      size="md"
                      onChange={(newRating) => 
                        setValue(`detailedRatings.${key}` as any, newRating)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitDate">Data da Visita</Label>
              <Input
                id="visitDate"
                type="date"
                {...register("visitDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupType">Tipo de Grupo</Label>
              <Select onValueChange={(value) => setValue("groupType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="couple">Casal</SelectItem>
                  <SelectItem value="family">Família</SelectItem>
                  <SelectItem value="friends">Amigos</SelectItem>
                  <SelectItem value="business">Negócios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Would Recommend */}
          <div className="flex items-center space-x-2">
            <Switch
              id="wouldRecommend"
              checked={watch("wouldRecommend")}
              onCheckedChange={(checked) => setValue("wouldRecommend", checked)}
            />
            <Label htmlFor="wouldRecommend">
              Eu recomendaria esta experiência
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 