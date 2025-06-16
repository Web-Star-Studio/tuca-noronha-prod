"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useOrganization } from "./organization-context";
import { Id } from "@/../convex/_generated/dataModel";

interface Asset {
  _id: string;
  name: string;
  assetType: "restaurants" | "events" | "activities" | "vehicles" | "accommodations";
  partnerId: Id<"users">;
  isActive: boolean;
  // Add other common asset fields as needed
}

interface AssetContextType {
  selectedAsset: Asset | null;
  setSelectedAsset: (asset: Asset | null) => void;
  availableAssets: Asset[];
  isLoading: boolean;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export function AssetProvider({ children }: { children: React.ReactNode }) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Fetch user organizations - since organizations ARE assets in our app
  const userOrganizations = useQuery(api.domains.rbac.queries.listUserOrganizations);

  // Transform organizations to assets format
  const availableAssets = userOrganizations?.map((org: any) => ({
    _id: org._id,
    name: org.name,
    assetType: getAssetTypeFromOrganizationType(org.type),
    partnerId: org.partnerId,
    isActive: org.isActive,
  })) || [];

  // Auto-select first asset when assets are loaded
  useEffect(() => {
    if (availableAssets.length > 0 && !selectedAsset) {
      setSelectedAsset(availableAssets[0]);
    }
  }, [availableAssets, selectedAsset]);

  const value: AssetContextType = {
    selectedAsset,
    setSelectedAsset,
    availableAssets,
    isLoading: userOrganizations === undefined,
  };

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
}

// Helper function to map organization type to asset type
function getAssetTypeFromOrganizationType(orgType: string): Asset["assetType"] {
  switch (orgType) {
    case "restaurant":
      return "restaurants";
    case "event_service":
      return "events";
    case "activity_service":
      return "activities";
    case "rental_service":
      return "vehicles";
    case "accommodation": // if this type exists
      return "accommodations";
    default:
      return "restaurants"; // default fallback
  }
}

export function useAsset() {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error("useAsset must be used within an AssetProvider");
  }
  return context;
} 