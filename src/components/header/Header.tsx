'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import WishlistIcon from "./WishlistIcon"
import UserMenu from "./UserMenu"
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "../ui/sheet"
import { Menu, X } from "lucide-react"
import NavigationMenu from "./NavigationMenu"
import { motion, AnimatePresence } from "framer-motion"

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
            
            <div>
              <motion.button
                onClick={() => handleOpenChange(!isOpen)}
                className="focus:outline-none flex items-center justify-center relative overflow-hidden"
                aria-label="Open menu"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu 
                    className={`h-6 w-6 ${
                      isTransparent ? "text-white" : "text-gray-900"
                    }`} 
                  />
                </motion.div>
                <motion.span 
                  className="absolute inset-0 rounded-full bg-blue-500/10"
                  initial={{ scale: 0 }}
                  animate={{ scale: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
              
              <AnimatePresence>
                {isOpen && (
                  <>
                    {/* Overlay */}
                    <motion.div 
                      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleOpenChange(false)}
                    />
                    
                    {/* Menu Panel */}
                    <motion.div 
                      className="fixed inset-y-0 right-0 z-50 w-[300px] sm:w-[400px] bg-white shadow-xl flex flex-col scrollbar-hide"
                      initial={{ x: "100%" }}
                      animate={{ 
                        x: 0,
                        transition: { 
                          type: "spring", 
                          damping: 30, 
                          stiffness: 300,
                          bounce: 0
                        } 
                      }}
                      exit={{ 
                        x: "100%",
                        transition: { 
                          duration: 0.25,
                          ease: "easeInOut"
                        } 
                      }}
                    >
                      {/* Close Button */}
                      <motion.button 
                        onClick={() => handleOpenChange(false)}
                        className="absolute right-4 top-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Close menu"
                        whileHover={{ scale: 1.2, backgroundColor: "#E5E7EB" }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: 0,
                          transition: { delay: 0.3, duration: 0.3 }
                        }}
                      >
                        <motion.div 
                          whileHover={{ rotate: 90 }} 
                          transition={{ duration: 0.2 }}
                        >
                          <X className="h-4 w-4 text-gray-700" />
                        </motion.div>
                      </motion.button>
                      
                      <div className="py-6 px-0 flex-1 overflow-y-auto scrollbar-hide">
                        <NavigationMenu onClose={() => handleOpenChange(false)} />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
    )
}