import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export interface UseReviewsOptions {
  itemType: string;
  itemId: string;
  limit?: number;
  offset?: number;
  sortBy?: "newest" | "oldest" | "rating_high" | "rating_low" | "helpful";
}

export interface ReviewWithUser {
  _id: Id<"reviews">;
  _creationTime: number;
  userId: Id<"users">;
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
  helpfulVotes: number;
  unhelpfulVotes: number;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: number;
  updatedAt: number;
  user: {
    id: Id<"users">;
    name: string;
    image?: string;
  } | null;
}

export interface ReviewsResult {
  reviews: ReviewWithUser[];
  total: number;
  hasMore: boolean;
}

export function useReviews({
  itemType,
  itemId,
  limit = 20,
  offset = 0,
  sortBy = "newest"
}: UseReviewsOptions) {
  const reviewsResult = useQuery(api.reviews.getItemReviews, {
    itemType,
    itemId,
    limit,
    offset,
    sortBy
  });

  return {
    reviews: reviewsResult?.reviews || [],
    total: reviewsResult?.total || 0,
    hasMore: reviewsResult?.hasMore || false,
    isLoading: reviewsResult === undefined,
    error: null // Convex handles errors automatically
  };
}

interface UseReviewStatsOptions {
  assetId: string;
  assetType: string;
}

export function useReviewStats({ assetId, assetType }: UseReviewStatsOptions) {
  const stats = useQuery(
    api.reviews.getItemReviewStats, 
    assetId && assetType ? {
      itemType: assetType,
      itemId: assetId
    } : "skip"
  );

  // Debug logging
  console.log("📊 useReviewStats Debug:", {
    assetId,
    assetType,
    rawStats: stats,
    isLoading: stats === undefined,
    processedData: stats ? {
      totalReviews: stats.totalReviews || 0,
      averageRating: stats.averageRating || 0,
      ratingDistribution: stats.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recommendationPercentage: stats.recommendationPercentage || 0,
      detailedAverages: stats.detailedAverages || {},
    } : null
  });

  return {
    data: stats ? {
      totalReviews: stats.totalReviews || 0,
      averageRating: stats.averageRating || 0,
      ratingDistribution: stats.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recommendationPercentage: stats.recommendationPercentage || 0,
      detailedAverages: stats.detailedAverages || {},
    } : null,
    isLoading: stats === undefined,
    error: null
  };
}

export function useUserReview(userId: Id<"users">, itemType: string, itemId: string) {
  const userReview = useQuery(api.reviews.getUserReviewForItem, {
    userId,
    itemType,
    itemId
  });

  return {
    userReview,
    hasReviewed: !!userReview,
    isLoading: userReview === undefined
  };
} 