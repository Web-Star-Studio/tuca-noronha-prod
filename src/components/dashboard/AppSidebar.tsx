"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Command,
  Home,
  Inbox,
  Search,
  Sparkles,
} from "lucide-react"

import { NavMain } from "./NavMain"
import { TeamSwitcher } from "./TeamSwitcher"
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Atividades",
      url: "#",
      icon: Search,
    },
    {
      title: "Hospedagens",
      url: "#",
      icon: Sparkles,
    },
    {
      title: "Eventos",
      url: "#",
      icon: Sparkles,
    },
    {
      title: "Restaurantes",
      url: "#",
      icon: Sparkles,
    },
    {
      title: "Reservas",
      url: "#",
      icon: Home,
      isActive: true,
    },
    {
      title: "Pacotes",
      url: "#",
      icon: Home,
    },
    {
      title: "Usuários",
      url: "#",
      icon: Inbox,
      badge: "10",
    },
    {
      title: "Mídias",
      url: "#",
      icon: Inbox,
    },
    {
      title: "Relatórios",
      url: "#",
      icon: Inbox,
    },
    {
      title: "Logs de Auditoria",
      url: "#",
      icon: Inbox,
      badge: "10",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
