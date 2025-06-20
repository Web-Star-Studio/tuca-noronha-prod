import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { useSystemSettings, useWhatsAppLink } from "@/lib/hooks/useSystemSettings";

interface GlobalContactButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  customMessage?: string;
  showDropdown?: boolean;
}

export function GlobalContactButton({
  className = "",
  variant = "outline",
  size = "default",
  customMessage,
  showDropdown = true
}: GlobalContactButtonProps) {
  const { supportEmail, supportPhone } = useSystemSettings();
  const { generateWhatsAppLink } = useWhatsAppLink();

  const handleWhatsAppClick = () => {
    const message = customMessage || "Olá! Gostaria de saber mais informações. Vocês podem me ajudar?";
    const url = generateWhatsAppLink(message);
    window.open(url, '_blank');
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${supportEmail}`;
  };

  const handlePhoneClick = () => {
    const cleanPhone = supportPhone.replace(/\D/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`gap-2 text-green-600 border-green-300 hover:bg-green-50 ${className}`}
        onClick={handleWhatsAppClick}
      >
        <MessageCircle className="h-4 w-4" />
        Falar pelo WhatsApp
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-2 ${className}`}
        >
          <MessageCircle className="h-4 w-4" />
          Entrar em Contato
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleWhatsAppClick} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmailClick} className="cursor-pointer">
          <Mail className="h-4 w-4 mr-2 text-blue-600" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePhoneClick} className="cursor-pointer">
          <Phone className="h-4 w-4 mr-2 text-orange-600" />
          Telefone
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 