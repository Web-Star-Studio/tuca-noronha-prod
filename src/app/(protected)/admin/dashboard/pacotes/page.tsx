"use client"

import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PackagesPage() {
  const { user } = useCurrentUser()
  
  // Convex hooks
  const packagesQuery = useQuery(api.packages.getPackages, { 
    filters: user?.role === "partner" ? { partnerId: user._id } : {}
  })

  const packages = packagesQuery?.packages || []

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pacotes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Total de pacotes: {packages.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 