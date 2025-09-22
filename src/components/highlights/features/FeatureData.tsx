
import { Sparkles, LifeBuoy, Calendar, Shield } from "lucide-react";
import React from "react";

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: <Sparkles className="h-8 w-8 text-tuca-ocean-blue" />,
    title: "Experiências Exclusivas",
    description: "Acesso a passeios e atividades únicas, desenvolvidas especialmente para nossos clientes."
  },
  {
    icon: <LifeBuoy className="h-8 w-8 text-tuca-ocean-blue" />,
    title: "Suporte Personalizado",
    description: "Atendimento dedicado em horário comercial de Segunda a Sexta durante toda a sua viagem para resolver qualquer necessidade."
  },
  {
    icon: <Calendar className="h-8 w-8 text-tuca-ocean-blue" />,
    title: "Flexibilidade Total",
    description: "Opções de remarcação e cancelamento para garantir sua tranquilidade no planejamento."
  },
  {
    icon: <Shield className="h-8 w-8 text-tuca-ocean-blue" />,
    title: "Compromisso Ambiental",
    description: "Passeios e acomodações selecionados com foco na preservação do ecossistema local."
  }
];
