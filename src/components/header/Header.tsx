'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import UserMenu from "./UserMenu"
import DropdownNavigation from "./DropdownNavigation"
import { playfairDisplay } from "@/lib/fonts"
import { usePathname } from "next/navigation"

export default function Header() {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)

    // Determina se a página deve forçar um header opaco
    const pagesWithOpaqueHeader = [
      '/meu-painel',
      '/reservas',
      '/privacidade',
      '/termos'
    ]
    const forceOpaque = pagesWithOpaqueHeader.some(page => pathname.startsWith(page))

    useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50)
      }

      if (!forceOpaque) {
        window.addEventListener('scroll', handleScroll)
        handleScroll() // Verifica o estado inicial
      } else {
        setIsScrolled(true); // Garante que seja opaco
      }

      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }, [pathname, forceOpaque])

    const isTransparent = !forceOpaque && !isScrolled;
    
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isTransparent
            ? "bg-transparent text-white"
            : "bg-white/80 backdrop-blur-lg text-gray-900 shadow-sm border-b border-gray-200/80"
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tighter"
            >
              <span className={`${isTransparent ? "text-white" : "text-gray-900"} ${playfairDisplay.className}`}>
                Tuca Noronha
              </span>
            </Link>

            {/* User Menu and Navigation Dropdown */}
            <div className="flex items-center space-x-4">
              <UserMenu isTransparent={isTransparent} />
              <DropdownNavigation isTransparent={isTransparent} />
            </div>
          </div>
        </div>
      </header>
    )
}
