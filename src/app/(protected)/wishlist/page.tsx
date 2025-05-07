'use client'

import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"

export default function WishlistPage() {
    const user = useQuery(api.functions.getUser);

  return (
    <div>
      <h1>Hello {user}</h1>
    </div>
  )
}