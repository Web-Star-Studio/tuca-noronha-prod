"use client"

import type * as React from "react"
import { LayoutDashboard, Activity, Utensils, CalendarDays, Package, ShoppingBag, Users, BarChart3, ListOrderedIcon, ClipboardList, QrCode, MessageCircle, CreditCard, Settings, Image } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { cn } from "@/lib/utils"

// Base navigation items
const baseNavItems = [
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
    title: "Chats",
    url: "/admin/dashboard/chats", 
    icon: MessageCircle,
  },
  {
    title: "Minhas Reservas",
    url: "/admin/dashboard/minhas-reservas",
    icon: ClipboardList,
  },
  {
    title: "Vouchers",
    url: "/admin/dashboard/vouchers",
    icon: QrCode,
  },
  {
    title: "Usuários",
    url: "/admin/dashboard/usuarios",
    icon: Users,
  },
  {
    title: "Mídias",
    url: "/admin/dashboard/midias",
    icon: Image,
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
  },
];

// Partner management items
const partnerManagementItems = [
  {
    title: "Pagamentos",
    url: "/admin/dashboard/pagamentos",
    icon: CreditCard,
  },
  {
    title: "Configurações",
    url: "/admin/dashboard/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  // Determine which navigation items to show based on user role
  const navMain = baseNavItems;
  const showPartnerManagement = currentUser?.role === "partner" || currentUser?.role === "master";

  return (
    <Sidebar className="border-r border-slate-200 bg-white text-slate-900" {...props}>
      <SidebarHeader className="pb-6">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
            TN
          </div>
          <div className="text-lg font-semibold tracking-tight text-slate-800">
            TN Next Admin
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarMenu>
          {navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive(item.url)} 
                tooltip={item.title}
                className="group transition-colors duration-150"
              >
                <Link href={item.url} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500",
                      "group-data-[active=true]:border-slate-900 group-data-[active=true]:bg-slate-900 group-data-[active=true]:text-white",
                      "group-hover:border-slate-300"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 group-data-[active=true]:text-slate-900">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Partner Management Section */}
        {showPartnerManagement && (
          <>
            <SidebarSeparator className="my-4 bg-slate-200" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gestão
              </SidebarGroupLabel>
              <SidebarMenu>
                {partnerManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)} 
                      tooltip={item.title}
                      className="group transition-colors duration-150"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500",
                            "group-data-[active=true]:border-slate-900 group-data-[active=true]:bg-slate-900 group-data-[active=true]:text-white",
                            "group-hover:border-slate-300"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 group-data-[active=true]:text-slate-900">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      
      <SidebarRail className="border-none bg-white" />
    </Sidebar>
  )
}
