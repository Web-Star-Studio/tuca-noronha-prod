/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";

interface WishlistIconProps {
  isTransparent: boolean;
}

const WishlistIcon = ({ isTransparent }: WishlistIconProps) => {
  const { userId } = useAuth();

  // Buscar contagem de itens na wishlist
  const wishlistCount = useQuery(
    api.wishlist.getWishlistCount,
    userId ? {} : undefined
  );

  const hasItems = wishlistCount && wishlistCount > 0;

  return (
    <Link
      href="/wishlist"
      className="relative flex items-center justify-center"
      aria-label="Lista de Desejos"
    >
      <Heart
        className={`h-6 w-6 ${
          isTransparent ? "text-white hover:text-white/80" : "text-gray-800 hover:text-gray-600"
        } transition-colors`}
      />
      {hasItems && (
        <span
          className={`absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-tuca-coral text-white text-xs font-medium`}
        >
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </span>
      )}
    </Link>
  );
};

export default WishlistIcon;
