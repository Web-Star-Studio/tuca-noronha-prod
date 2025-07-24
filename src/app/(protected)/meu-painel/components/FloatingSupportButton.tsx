"use client";

import React, { useState } from 'react';
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonStyles } from "@/lib/ui-config";
import { SupportModal } from "./SupportModal";

const FloatingSupportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-40">
      <Button 
        className={`${buttonStyles.variant.gradient} ${buttonStyles.size.lg} rounded-full flex items-center shadow-lg hover:shadow-xl transition-all duration-300 ${buttonStyles.animation.scaleOnHover}`}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Suporte
      </Button>

      <SupportModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
};

export default FloatingSupportButton; 