"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Hotel, Package, Calendar, Heart } from "lucide-react";

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

  return (
    <nav className="flex mt-8 flex-col h-full bg-white text-gray-800">
      <div className="flex flex-col space-y-1 px-2 overflow-y-auto grow">
        {navigationItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" 
            ? pathname === path 
            : pathname.startsWith(path);
            
          return (
            <Link
              key={path}
              href={path}
              onClick={onClose}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-500 text-white font-medium"
                  : "text-gray-700 hover:bg-blue-500 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span className="text-lg">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationMenu;
