'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import UserMenu from "./UserMenu"
import DropdownNavigation from "./DropdownNavigation"
import { playfairDisplay } from "@/lib/fonts"
import { usePathname } from "next/navigation"

export default function Header() {
    const [isTransparent, setIsTransparent] = useState(true)
    const pathname = usePathname()
    
    // Verifica se estamos em uma página de detalhe de hospedagem
    const isDetailPage = /^\/hospedagens\/[^/]+$/.test(pathname)
    const isProfilePage = /^\/meu-painel$/.test(pathname)
    const isReservationPage = /^\/reservas\/[^/]+$/.test(pathname)

    useEffect(() => {
      const handleScroll = () => {
        // Se estiver em uma página de detalhes, nunca usar transparência
        if (isDetailPage || isProfilePage || isReservationPage) {
          setIsTransparent(false)
          return
        }
        
        // Mudar o header para não transparente quando o scroll for maior que 50px
        const scrollPosition = window.scrollY
        setIsTransparent(scrollPosition <= 50)
      }
      
      // Adicionar evento de scroll
      window.addEventListener('scroll', handleScroll)
      
      // Verificar posição inicial
      handleScroll()
      
      // Limpar o event listener quando o componente for desmontado
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }, [isDetailPage, isProfilePage, isReservationPage])
    
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isTransparent
            ? "bg-transparent text-white"
            : "bg-white/80 backdrop-blur-lg text-gray-900 shadow-sm border-b border-white/20"
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