'use client'

import { useState } from "react"
import { Heart } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "./button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface WishlistButtonProps {
  itemType: string
  itemId: string
  variant?: "default" | "outline" | "ghost" | "icon"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function WishlistButton({
  itemType,
  itemId,
  variant = "outline",
  size = "sm",
  className,
  showText = true,
}: WishlistButtonProps) {
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Check if item is in wishlist
  const isInWishlist = useQuery(
    api.wishlist.isInWishlist,
    userId ? {
      itemType,
      itemId,
    } : "skip"
  )

  // Mutations
  const addToWishlist = useMutation(api.wishlist.addToWishlist)
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist)

  const handleToggleWishlist = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar itens aos favoritos.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isInWishlist) {
        await removeFromWishlist({
          itemType,
          itemId,
        })
        toast({
          title: "Removido dos favoritos",
          description: "Item removido da sua lista de favoritos.",
        })
      } else {
        await addToWishlist({
          itemType,
          itemId,
        })
        toast({
          title: "Adicionado aos favoritos",
          description: "Item adicionado à sua lista de favoritos.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar favoritos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={cn("flex items-center gap-2", className)}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isInWishlist 
            ? "fill-red-500 text-red-500" 
            : "text-gray-600"
        )}
      />
      {showText && (variant !== "icon" && size !== "icon") && (
        <span>
          {isLoading 
            ? "..." 
            : isInWishlist 
              ? "Favoritado" 
              : "Favoritar"
          }
        </span>
      )}
    </Button>
  )
} 