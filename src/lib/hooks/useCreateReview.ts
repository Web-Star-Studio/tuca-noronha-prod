import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

export interface CreateReviewData {
  itemType: string;
  itemId: string;
  rating: number;
  title: string;
  comment: string;
  detailedRatings?: {
    value?: number;
    service?: number;
    cleanliness?: number;
    location?: number;
    food?: number;
    organization?: number;
    guide?: number;
  };
  visitDate?: string;
  groupType?: string;
  wouldRecommend: boolean;
  photos?: string[];
  isVerified?: boolean;
}

export function useCreateReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createReviewMutation = useMutation(api.reviews.createReview);

  const submitReview = async (userId: Id<"users">, reviewData: CreateReviewData) => {
    setIsSubmitting(true);
    
    try {
      // Validações client-side
      if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error("Avaliação deve ser entre 1 e 5 estrelas");
      }

      if (!reviewData.title.trim()) {
        throw new Error("Título é obrigatório");
      }

      if (!reviewData.comment.trim()) {
        throw new Error("Comentário é obrigatório");
      }

      if (reviewData.title.length > 100) {
        throw new Error("Título deve ter no máximo 100 caracteres");
      }

      if (reviewData.comment.length > 1000) {
        throw new Error("Comentário deve ter no máximo 1000 caracteres");
      }

      // Validar detailed ratings se fornecidos
      if (reviewData.detailedRatings) {
        const detailedRatings = reviewData.detailedRatings;
        const ratingKeys = Object.keys(detailedRatings) as Array<keyof typeof detailedRatings>;
        
        for (const key of ratingKeys) {
          const rating = detailedRatings[key];
          if (rating !== undefined && (rating < 1 || rating > 5)) {
            throw new Error(`Avaliação de ${key} deve ser entre 1 e 5`);
          }
        }
      }

      // Submeter review
      const reviewId = await createReviewMutation({
        userId,
        ...reviewData
      });

      toast.success("Avaliação enviada com sucesso!");
      return reviewId;

    } catch {
      const errorMessage = error instanceof Error ? error.message : "Erro ao enviar avaliação";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitReview,
    isSubmitting
  };
}

export function useVoteOnReview() {
  const [isVoting, setIsVoting] = useState(false);
  const voteOnReviewMutation = useMutation(api.reviews.voteOnReview);

  const voteOnReview = async (
    reviewId: Id<"reviews">, 
    userId: Id<"users">, 
    voteType: "helpful" | "unhelpful"
  ) => {
    setIsVoting(true);
    
    try {
      await voteOnReviewMutation({
        reviewId,
        userId,
        voteType
      });

      toast.success(voteType === "helpful" ? "Marcado como útil!" : "Marcado como não útil!");
    } catch {
      const errorMessage = error instanceof Error ? error.message : "Erro ao votar";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsVoting(false);
    }
  };

  return {
    voteOnReview,
    isVoting
  };
} 