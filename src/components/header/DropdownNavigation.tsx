'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Home, Compass, Package, Calendar, UtensilsCrossed, Car, Heart, ChevronDown, HelpCircle, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { transitionEffects } from '@/lib/ui-config'

interface DropdownNavigationProps {
  isTransparent?: boolean
}

interface NavigationItem {
  path: string
  label: string
  icon: React.ElementType
  category: 'main' | 'user' | 'support'
  badge?: string
}

const navigationItems: NavigationItem[] = [
  // Navegação Principal
  { path: '/', label: 'Home', icon: Home, category: 'main' },
  { path: '/atividades', label: 'Atividades', icon: Compass, category: 'main' },
  { path: '/pacotes', label: 'Pacotes', icon: Package, category: 'main' },
  { path: '/eventos', label: 'Eventos', icon: Calendar, category: 'main' },
  { path: '/restaurantes', label: 'Restaurantes', icon: UtensilsCrossed, category: 'main' },
  { path: '/veiculos', label: 'Veículos', icon: Car, category: 'main' },
  { path: '/sobre', label: 'Sobre', icon: Info, category: 'main' },
  
  // Área do Usuário
  { path: '/meu-painel', label: 'Meu Painel', icon: User, category: 'user' },
  { path: '/meu-painel/guia', label: 'Guia Interativo', icon: Compass, category: 'user' },
  { path: '/reservas', label: 'Minhas Reservas', icon: Calendar, category: 'user', badge: '3' },
  { path: '/wishlist', label: 'Lista de Desejos', icon: Heart, category: 'user' },
  { path: '/meu-painel?tab=pacotes', label: 'Solicitações', icon: Package, category: 'user' },
  
  // Suporte
  { path: '/ajuda', label: 'Ajuda e Suporte', icon: HelpCircle, category: 'support' },
]

const DropdownNavigation: React.FC<DropdownNavigationProps> = ({ 
  isTransparent = false 
}) => {
  const pathname = usePathname()

  const getCategoryItems = (category: string) => 
    navigationItems.filter(item => item.category === category)

  const isActivePath = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`
            gap-2 px-3 py-2 h-auto font-medium transition-all duration-300
            ${isTransparent 
              ? 'text-white hover:bg-white/10 border-white/20' 
              : 'text-gray-900 hover:bg-gray-100 border-gray-200'
            }
            border hover:border-opacity-100 rounded-lg
            backdrop-blur-sm shadow-sm hover:shadow-md
          `}
        >
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Menu</span>
            <motion.div
              animate={{ rotate: 0 }}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className={`
          w-80 p-2 bg-white/95 backdrop-blur-md border border-gray-200/50 
          shadow-2xl rounded-xl
          ${transitionEffects.appear.fadeInDown}
        `}
        align="end"
        sideOffset={8}
      >
        {/* Header do Menu */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-3 py-2 border-b border-gray-100 mb-2"
        >
          <DropdownMenuLabel className="text-lg font-semibold text-gray-900 mb-1">
            Navegação
          </DropdownMenuLabel>
          <p className="text-sm text-gray-600">
            Acesse todas as seções da plataforma
          </p>
        </motion.div>

        {/* Navegação Principal */}
        <DropdownMenuGroup>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <DropdownMenuLabel className="text-sm font-medium text-gray-700 px-2 py-1">
              Explorar
            </DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {getCategoryItems('main').map((item, index) => {
                const Icon = item.icon
                const isActive = isActivePath(item.path)
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <DropdownMenuItem asChild className="p-0">
                      <Link
                        href={item.path}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200 group
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className={`
                          h-4 w-4 transition-colors
                          ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
                        `} />
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        {/* Área do Usuário */}
        <DropdownMenuGroup>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <DropdownMenuLabel className="text-sm font-medium text-gray-700 px-2 py-1">
              Minha Conta
            </DropdownMenuLabel>
            <div className="space-y-1 mb-2">
              {getCategoryItems('user').map((item, index) => {
                const Icon = item.icon
                const isActive = isActivePath(item.path)
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <DropdownMenuItem asChild className="p-0">
                      <Link
                        href={item.path}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200 group w-full
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className={`
                          h-4 w-4 transition-colors
                          ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
                        `} />
                        <span className="text-sm font-medium flex-1 truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        {/* Suporte */}
        <DropdownMenuGroup>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {getCategoryItems('support').map((item, index) => {
              const Icon = item.icon
              const isActive = isActivePath(item.path)
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                >
                  <DropdownMenuItem asChild className="p-0">
                    <Link
                      href={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 group w-full
                        ${isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className={`
                        h-4 w-4 transition-colors
                        ${isActive ? 'text-emerald-600' : 'text-gray-500 group-hover:text-gray-700'}
                      `} />
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </motion.div>
              )
            })}
          </motion.div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownNavigation 