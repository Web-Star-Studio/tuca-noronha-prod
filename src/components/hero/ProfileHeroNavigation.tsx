"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  MessageCircle
} from "lucide-react";

interface ProfileHeroNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const ProfileHeroNavigation: React.FC<ProfileHeroNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'chats', label: 'Conversas', icon: MessageCircle },
    { id: 'pacotes', label: 'Solicitações', icon: Package },
  ];

  return (
    <div className="hidden md:block">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-white/20">
        <div className="flex items-center justify-center gap-1">
          {navigationItems.map((item, index) => {
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
                  variant="ghost"
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">
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

export default ProfileHeroNavigation; 