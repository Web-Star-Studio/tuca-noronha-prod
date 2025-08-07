"use client"

import { ReactNode } from "react";
import type { Id } from "@/../convex/_generated/dataModel"

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

/*interface OrganizationContextType {
  organizations: Organization[]
  activeOrganization: Organization | null
  setActiveOrganization: (org: Organization | null) => void
  isLoading: boolean
  error: string | null
}*/

// const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

interface OrganizationProviderProps {
  children: ReactNode
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  // const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null)
  
  // Busca as organizações baseado no role do usuário (partner, employee, master)
  // const organizations = useQuery(api.domains.rbac.queries.listUserOrganizations) as Organization[] | undefined
  
  return <>{children}</>;
}

// Hook para usar o contexto de organização (temporário - não implementado)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useOrganization() {
  return {
    organizations: [] as Organization[],
    activeOrganization: null as Organization | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setActiveOrganization: (org: Organization) => {},
    isLoading: false,
    error: null
  };
} 