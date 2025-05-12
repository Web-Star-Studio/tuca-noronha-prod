import type React from "react"
import { SignedIn } from "@clerk/nextjs"

import Header from "@/components/header/Header"
import Footer from "@/components/footer/Footer"

export default function ReservasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SignedIn>
      <Header />
      <div className="min-h-screen pt-16">
        {children}
      </div>
      <Footer />
    </SignedIn>
  )
}