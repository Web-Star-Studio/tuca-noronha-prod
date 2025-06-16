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
    
    // Verifica se estamos em uma página de detalhe 
    const isDetailPage = false // removido check de hospedagens
    const isProfilePage = /^\/meu-painel/.test(pathname) // Incluindo subpáginas do meu-painel
    const isReservationPage = /^\/reservas/.test(pathname) // Qualquer página dentro de /reservas

    useEffect(() => {
      const handleScroll = () => {
        // Se estiver em uma página de detalhes ou reservas (exceto meu-painel), nunca usar transparência
        if (isDetailPage || isReservationPage) {
          setIsTransparent(false)
          return
        }
        
        // Mudar o header para não transparente quando o scroll for maior que 50px
        const scrollPosition = window.scrollY
        setIsTransparent(scrollPosition <= 50)
      }
      
      // Se estiver em páginas específicas (exceto meu-painel), sempre definir como não transparente
      if (isDetailPage || isReservationPage) {
        setIsTransparent(false)
      } else {
        // Adicionar evento de scroll
        window.addEventListener('scroll', handleScroll)
        // Verificar posição inicial
        handleScroll()
      }
      
      // Limpar o event listener quando o componente for desmontado
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }, [isDetailPage, isProfilePage, isReservationPage])
    
    // Determinar se deve usar texto branco (quando transparente E não está em páginas de detalhes/reservas)
    const shouldUseWhiteText = isTransparent && !isDetailPage && !isReservationPage
    
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          shouldUseWhiteText
            ? "bg-transparent text-white"
            : `bg-white/80 backdrop-blur-lg text-gray-900 shadow-sm ${
                isProfilePage ? "" : "border-b border-white/20"
              }`
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tighter"
            >
              <span className={`${shouldUseWhiteText ? "text-white" : "text-gray-900"} ${playfairDisplay.className}`}>
                Tuca Noronha
              </span>
            </Link>

            {/* User Menu and Navigation Dropdown */}
            <div className="flex items-center space-x-4">
              <UserMenu isTransparent={shouldUseWhiteText} />
              <DropdownNavigation isTransparent={shouldUseWhiteText} />
            </div>
          </div>
        </div>
      </header>
    )
}