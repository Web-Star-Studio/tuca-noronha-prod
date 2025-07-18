"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RatingStarsProps {
  rating?: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
  showValue?: boolean;
  precision?: "full" | "half";
}

export function RatingStars({
  rating = 0,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
  showValue = false,
  precision = "full"
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [tempRating, setTempRating] = useState(rating);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  // Ensure rating is a valid number
  const validRating = typeof rating === 'number' && !isNaN(rating) && isFinite(rating) ? rating : 0;
  const displayRating = interactive ? (hoverRating || tempRating) : validRating;

  const handleStarClick = (starRating: number) => {
    if (!interactive) return;
    
    setTempRating(starRating);
    onChange?.(starRating);
  };

  const handleStarHover = (starRating: number) => {
    if (!interactive) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const getStarFill = (starIndex: number) => {
    const starValue = starIndex + 1;
    
    if (precision === "half") {
      if (displayRating >= starValue) {
        return "fill-yellow-400 text-yellow-400";
      } else if (displayRating >= starValue - 0.5) {
        return "fill-yellow-400/50 text-yellow-400";
      } else {
        return "fill-gray-200 text-gray-200";
      }
    } else {
      return displayRating >= starValue 
        ? "fill-yellow-400 text-yellow-400" 
        : "fill-gray-200 text-gray-200";
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: maxRating }, (_, index) => (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            className={cn(
              "transition-colors",
              interactive && "hover:scale-110 cursor-pointer",
              !interactive && "cursor-default"
            )}
            onClick={() => handleStarClick(index + 1)}
            onMouseEnter={() => handleStarHover(index + 1)}
          >
            <Star 
              className={cn(
                sizeClasses[size],
                getStarFill(index),
                "transition-all duration-150"
              )}
            />
          </button>
        ))}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-gray-700 ml-1">
          {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
        </span>
      )}
    </div>
  );
}

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCount?: boolean;
}

export function RatingDisplay({
  rating,
  totalReviews,
  size = "md",
  className,
  showCount = true
}: RatingDisplayProps) {
  // Ensure rating is a valid number
  const validRating = typeof rating === 'number' && !isNaN(rating) && isFinite(rating) ? rating : 0;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RatingStars 
        rating={validRating} 
        size={size} 
        showValue 
        precision="half"
      />
      {showCount && totalReviews !== undefined && (
        <span className="text-sm text-gray-500">
          ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </div>
  );
}

interface DetailedRatingProps {
  label: string;
  rating: number;
  maxRating?: number;
  className?: string;
}

export function DetailedRating({
  label,
  rating,
  maxRating = 5,
  className
}: DetailedRatingProps) {
  const percentage = (rating / maxRating) * 100;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="text-sm text-gray-600 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right">{rating.toFixed(1)}</span>
    </div>
  );
} 