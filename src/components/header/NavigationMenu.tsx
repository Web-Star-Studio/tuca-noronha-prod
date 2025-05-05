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
  ];

  return (
    <nav className="flex mt-8 flex-col h-full">
      <div className="flex flex-col space-y-1 px-2 overflow-y-auto grow">
        {navigationItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            href={path}
            onClick={onClose}
            className={`flex items-center size-8 px-4 py-3 rounded-lg transition-colors hover:bg-blue-500 hover:text-white`}
          >
            <Icon className="size-6 mr-3" />
            <span className="text-lg">{label}</span>
          </Link>
        ))}
        <Link
          href="/lista-de-desejos"
          onClick={onClose}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
            pathname.startsWith("/lista-de-desejos")
              ? "bg-tuca-light-blue text-tuca-ocean-blue font-medium"
              : "hover:bg-gray-100"
          }`}
        >
          <Heart className="h-5 w-5 mr-3" />
          <span>Lista de Desejos</span>
        </Link>
      </div>
      <div className="mt-auto border-t pt-6 px-4 mb-4">
        <Link
          href="/reservar"
          onClick={onClose}
          className="w-full flex items-center justify-center px-4 py-3 bg-tuca-ocean-blue text-white rounded-lg hover:bg-tuca-deep-blue transition-colors"
        >
          Reservar
        </Link>
      </div>
    </nav>
  );
};

export default NavigationMenu;
