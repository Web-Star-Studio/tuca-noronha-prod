'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import WishlistIcon from "./WishlistIcon"
import UserMenu from "./UserMenu"
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "../ui/sheet"
import { Menu } from "lucide-react"
import NavigationMenu from "./NavigationMenu"

export default function Header() {
    const [isOpen, setIsOpen] = useState(false)
    const [isTransparent, setIsTransparent] = useState(true)

    useEffect(() => {
      const handleScroll = () => {
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
    }, [])
    
    const handleOpenChange = (open: boolean) => {
      setIsOpen(open)
    }
    
    return (
        <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isTransparent
          ? "bg-transparent text-white"
          : "bg-white/70 backdrop-blur-md text-gray-900 shadow-sm"
      }`}
    >
      <div className="w-full px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold font-serif tracking-tighter"
          >
            <span className={isTransparent ? "text-white" : "text-gray-900"}>Tuca Noronha</span>
          </Link>

          {/* User Menu and Burger Menu Button */}
          <div className="flex items-center space-x-4">
            <span className="hidden lg:block">
              <WishlistIcon isTransparent={isTransparent} />
            </span>
            
            <UserMenu isTransparent={isTransparent} />
            
            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
              <SheetTrigger asChild>
                <button
                  className="focus:outline-none flex items-center justify-center"
                  aria-label="Open menu"
                >
                  <Menu className={`h-6 w-6 ${isTransparent ? "text-white" : "text-gray-900"}`} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] py-6 px-0 bg-white">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <NavigationMenu onClose={() => setIsOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
    )
}