"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Hotel, Package, Calendar, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface NavigationMenuProps {
  onClose: () => void;
}

const NavigationMenu = ({ onClose }: NavigationMenuProps) => {
  const pathname = usePathname();

  const navigationItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/atividades", label: "Atividades", icon: Compass },
    { path: "/hospedagens", label: "Hospedagens", icon: Hotel },
    { path: "/pacotes", label: "Pacotes", icon: Package },
    { path: "/eventos", label: "Eventos", icon: Calendar },
    { path: "/lista-de-desejos", label: "Lista de Desejos", icon: Heart },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      }
    }
  };

  return (
    <nav className="flex mt-8 flex-col h-full bg-white text-gray-800 overflow-hidden scrollbar-hide">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="px-4 mb-6"
      >
        <motion.h2 
          className="text-xl font-bold text-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.9 }}
        >
          Menu
        </motion.h2>
        <motion.div 
          className="h-0.5 w-16 bg-blue-500 mt-2"
          initial={{ width: 0 }}
          animate={{ width: 64 }}
          transition={{ delay: 0.4, duration: 0.9 }}
        />
      </motion.div>
      <motion.div 
        className="flex flex-col space-y-1 px-2 overflow-y-auto scrollbar-hide grow"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {navigationItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" 
            ? pathname === path 
            : pathname.startsWith(path);
            
          return (
            <motion.div 
              key={path} 
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-blue-500 rounded-lg z-0"
                    initial={{ borderRadius: 8 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 30 
                    }}
                  />
                )}
                
                <Link
                  href={path}
                  onClick={onClose}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors relative z-10 ${
                    isActive
                      ? "text-white font-medium"
                      : "text-gray-700 hover:bg-blue-500 hover:text-white"
                  }`}
                >
                  <motion.div
                    className="mr-3"
                    whileHover={{ 
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <span className="text-lg">{label}</span>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </nav>
  );
};

export default NavigationMenu;
