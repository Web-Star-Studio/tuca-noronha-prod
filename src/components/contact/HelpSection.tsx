import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GlobalContactButton } from "./GlobalContactButton";

interface HelpSectionProps {
  title?: string;
  description?: string;
  customMessage?: string;
  className?: string;
  showDropdown?: boolean;
}

export function HelpSection({
  title = "Precisa de ajuda?",
  description = "Nossa equipe está disponível para responder suas perguntas.",
  customMessage,
  className = "",
  showDropdown = true
}: HelpSectionProps) {
  return (
    <Card className={`border-gray-100 ${className}`}>
      <CardContent className="p-5">
        <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">
          {description}
        </p>
        <GlobalContactButton 
          variant="outline"
          className="w-full text-green-600 border-green-300 hover:bg-green-50"
          customMessage={customMessage}
          showDropdown={showDropdown}
        />
      </CardContent>
    </Card>
  );
} 