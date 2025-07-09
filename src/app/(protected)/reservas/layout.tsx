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
      <main className="min-h-screen bg-slate-50 dark:bg-gray-950 pt-16">
        {children}
      </main>
      <Footer />
    </SignedIn>
  )
}