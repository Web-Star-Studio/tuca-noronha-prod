"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export interface Organization {
  _id: Id<"partnerOrganizations">
  name: string
  description?: string
  type: string
  image?: string
  partnerId: Id<"users">
  isActive: boolean
  settings?: {
    theme?: string
    contactInfo?: {
      email?: string
      phone?: string
      website?: string
    }
  }
  createdAt: number
  updatedAt: number
}

interface OrganizationContextType {
  organizations: Organization[]
  activeOrganization: Organization | null
  setActiveOrganization: (org: Organization | null) => void
  isLoading: boolean
  error: string | null
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

interface OrganizationProviderProps {
  children: ReactNode
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null)
  
  // Busca as organizações baseado no role do usuário (partner, employee, master)
  const organizations = useQuery(api.domains.rbac.queries.listUserOrganizations) as Organization[] | undefined
  const isLoading = organizations === undefined
  const error = null // TODO: Implementar tratamento de erro adequado

  // Define a primeira organização como ativa por padrão
  useEffect(() => {
    if (organizations && organizations.length > 0 && !activeOrganization) {
      // Verifica se há uma organização salva no localStorage
      const savedOrgId = localStorage.getItem("activeOrganizationId")
      if (savedOrgId) {
        const savedOrg = organizations.find(org => org._id === savedOrgId)
        if (savedOrg) {
          setActiveOrganization(savedOrg)
          return
        }
      }
      
      // Caso contrário, define a primeira organização como ativa
      setActiveOrganization(organizations[0])
    }
  }, [organizations, activeOrganization])

  // Salva a organização ativa no localStorage quando ela muda
  useEffect(() => {
    if (activeOrganization) {
      localStorage.setItem("activeOrganizationId", activeOrganization._id)
    } else {
      localStorage.removeItem("activeOrganizationId")
    }
  }, [activeOrganization])

  const value: OrganizationContextType = {
    organizations: organizations || [],
    activeOrganization,
    setActiveOrganization,
    isLoading,
    error,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}

// Hook para obter os assets da organização ativa
export function useOrganizationAssets(assetType?: string) {
  const { activeOrganization } = useOrganization()
  
  const assets = useQuery(
    api.domains.rbac.queries.listOrganizationAssets,
    activeOrganization 
      ? { 
          organizationId: activeOrganization._id,
          ...(assetType && { assetType })
        } 
      : "skip"
  )

  return {
    assets: assets || [],
    isLoading: assets === undefined,
    organizationId: activeOrganization?._id,
  }
} 