"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Sparkles, 
  MessageCircle,
  Bell
} from "lucide-react";

interface MobileBottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Início', icon: LayoutDashboard },
    { id: 'reservas', label: 'Reservas', icon: Calendar },
    { id: 'notificacoes', label: 'Avisos', icon: Bell },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'pacotes', label: 'Solicitações', icon: Package },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/50 safe-area-pb">
      <div className="px-2 py-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex-1"
              >
                <Button
                  onClick={() => onSectionChange(item.id)}
                  variant="ghost"
                  className={`
                    w-full flex flex-col items-center gap-1 py-3 px-2 h-auto transition-all duration-200 rounded-xl
                    ${isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-xs font-medium leading-tight">
                    {item.label}
                  </span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNavigation; 