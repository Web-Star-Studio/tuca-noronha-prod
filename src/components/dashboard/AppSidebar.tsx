"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Command,
  LayoutDashboard,
  Activity,
  Utensils,
  Building,
  CalendarDays,
  Package,
  ShoppingBag,
  Users,
  Image as ImageIcon,
  BarChart3,
  ListOrderedIcon,
  Settings,
  ClipboardList
} from "lucide-react"
import { TeamSwitcher } from "./TeamSwitcher"
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

// This is sample data.
const data = {
  teams: [
    {
      name: "TN Next",
      logo: Command,
      plan: "Admin",
    },
    {
      name: "TN Turismo",
      logo: AudioWaveform,
      plan: "Operador",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Atividades",
      url: "/admin/dashboard/atividades",
      icon: Activity,
    },
    {
      title: "Restaurantes",
      url: "/admin/dashboard/restaurantes",
      icon: Utensils,
    },

    {
      title: "Eventos",
      url: "/admin/dashboard/eventos",
      icon: CalendarDays,
    },
    {
      title: "Pacotes",
      url: "/admin/dashboard/pacotes",
      icon: Package,
    },
    {
      title: "Reservas",
      url: "/admin/dashboard/reservas",
      icon: ShoppingBag,
    },
    {
      title: "Minhas Reservas",
      url: "/admin/dashboard/minhas-reservas",
      icon: ClipboardList,
    },
    {
      title: "Usuários",
      url: "/admin/dashboard/usuarios",
      icon: Users,
      badge: "10",
    },
    {
      title: "Mídias",
      url: "/admin/dashboard/midias",
      icon: ImageIcon,
    },
    {
      title: "Relatórios",
      url: "/admin/dashboard/relatorios",
      icon: BarChart3,
    },
    {
      title: "Logs de Auditoria",
      url: "/admin/dashboard/logs",
      icon: ListOrderedIcon,
      badge: "10",
    },
    {
      title: "Configurações",
      url: "/admin/dashboard/configuracoes",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <Sidebar className="bg-gradient-to-b from-slate-900/95 to-slate-800/95 text-white shadow-xl transition-all duration-300 ease-in-out" {...props}>
      <SidebarHeader className="pb-6">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            TN
          </div>
          <div className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            TN Next Admin
          </div>
        </div>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarMenu>
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive(item.url)} 
                tooltip={item.title}
                className="group transition-all duration-200"
              >
                <Link href={item.url} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-slate-800/80 to-slate-700/80 group-hover:from-blue-600/90 group-hover:to-blue-700/90 group-data-[active=true]:from-blue-600 group-data-[active=true]:to-blue-700 transition-all duration-200 shadow-sm">
                    <item.icon className="h-4 w-4 text-slate-300 group-hover:text-white group-data-[active=true]:text-white" />
                  </span>
                  <span className="text-slate-300 group-hover:text-white group-data-[active=true]:text-white transition-colors duration-200">
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20 text-xs font-medium text-blue-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarRail className="bg-slate-800/50 border-none" />
    </Sidebar>
  )
}
