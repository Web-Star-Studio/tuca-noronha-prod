"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Sparkles, 
  Heart, 
  Settings, 
  HelpCircle,
  ChevronDown,
  Grid3X3
} from "lucide-react";

interface ProfileHeroNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const ProfileHeroNavigation: React.FC<ProfileHeroNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, shortLabel: 'Início' },
    { id: 'reservas', label: 'Reservas', icon: Calendar, shortLabel: 'Reservas' },
    { id: 'pacotes', label: 'Pacotes', icon: Package, shortLabel: 'Pacotes' },
    { id: 'recomendacoes', label: 'Recomendações', icon: Sparkles, shortLabel: 'Dicas' },
    { id: 'favoritos', label: 'Favoritos', icon: Heart, shortLabel: 'Favoritos' },
    { id: 'personalizacao', label: 'Preferências', icon: Settings, shortLabel: 'Config' },
    { id: 'ajuda', label: 'Ajuda', icon: HelpCircle, shortLabel: 'Ajuda' },
  ];

  const activeItem = navigationItems.find(item => item.id === activeSection);

  // Split navigation items for desktop display
  const primaryItems = navigationItems.slice(0, 5);
  const moreItems = navigationItems.slice(5);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  return (
    <>
      {/* Mobile Navigation - Bottom Sheet Style */}
      <div className="md:hidden">
        <div className="bg-white/10 backdrop-blur-md rounded-t-3xl px-4 py-3 shadow-lg border border-white/20">
          {/* Current Section Display */}
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="ghost"
            className="w-full flex items-center justify-between text-white/90 hover:bg-white/20 hover:text-white p-3 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              {activeItem && <activeItem.icon className="w-5 h-5" />}
              <span className="font-medium">
                {activeItem?.shortLabel || 'Menu'}
              </span>
            </div>
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </Button>

          {/* Expandable Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/20">
                  {navigationItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Button
                          onClick={() => {
                            onSectionChange(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          variant={isActive ? "default" : "ghost"}
                          className={`
                            w-full flex flex-col items-center gap-1 py-4 px-3 rounded-xl transition-all duration-200 min-h-[64px]
                            ${isActive 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'text-white/90 hover:bg-white/20 hover:text-white'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium leading-tight text-center">
                            {item.shortLabel}
                          </span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop Navigation - Horizontal Pills */}
      <div className="hidden md:block w-screen px-80">
        <div className="bg-white/10 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/20">
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-5xl relative">
            {primaryItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Button
                    onClick={() => onSectionChange(item.id)}
                    variant={isActive ? "default" : "ghost"}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-white/90 hover:bg-white/20 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  </Button>
                </motion.div>
              );
            })}
            
            {/* More Menu for Additional Items */}
            {moreItems.length > 0 && (
              <motion.div
                ref={moreMenuRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="relative"
              >
                <Button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  variant="ghost"
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200
                    ${isMoreMenuOpen
                      ? 'bg-white/30 text-white'
                      : 'text-white/90 hover:bg-white/20 hover:text-white'
                    }
                  `}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Mais</span>
                  <motion.div
                    animate={{ rotate: isMoreMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.div>
                </Button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full mb-2 right-0 min-w-[200px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden z-50"
                    >
                      <div className="p-2">
                        {moreItems.map((item, index) => {
                          const Icon = item.icon;
                          const isActive = activeSection === item.id;
                          
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <Button
                                onClick={() => {
                                  onSectionChange(item.id);
                                  setIsMoreMenuOpen(false);
                                }}
                                variant={isActive ? "default" : "ghost"}
                                className={`
                                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 justify-start
                                  ${isActive 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                  }
                                `}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {item.label}
                                </span>
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeroNavigation; 