"use client"

import {
  Activity,
  BarChart3,
  Building,
  CalendarDays,
  Home,
  Image as ImageIcon,
  Layout,
  ListOrderedIcon,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Utensils,
  Bell
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <Sidebar className="bg-gradient-to-b from-slate-900/95 to-slate-800/95 text-white shadow-xl transition-all duration-300 ease-in-out">
      <SidebarHeader className="pb-6">
        <div className="flex items-center gap-3 px-5 py-4">
          <Layout className="h-6 w-6 text-blue-400" />
          <div className="font-semibold text-lg tracking-tight">TN Next Admin</div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard")} tooltip="Dashboard">
              <Link href="/admin/dashboard"><Home />Dashboard</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/atividades")} tooltip="Atividades">
              <Link href="/admin/dashboard/atividades"><Activity />Atividades</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/restaurantes")} tooltip="Restaurantes">
              <Link href="/admin/dashboard/restaurantes"><Utensils />Restaurantes</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/hospedagens")} tooltip="Hospedagens">
              <Link href="/admin/dashboard/hospedagens"><Building />Hospedagens</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/eventos")} tooltip="Eventos">
              <Link href="/admin/dashboard/eventos"><CalendarDays />Eventos</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/pacotes")} tooltip="Pacotes">
              <Link href="/admin/dashboard/pacotes"><Package />Pacotes</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/reservas")} tooltip="Reservas">
              <Link href="/admin/dashboard/reservas"><ShoppingBag />Reservas</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/usuarios")} tooltip="Usuários">
              <Link href="/admin/dashboard/usuarios"><Users />Usuários</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/midias")} tooltip="Mídias">
              <Link href="/admin/dashboard/midias"><ImageIcon />Mídias</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/relatorios")} tooltip="Relatórios">
              <Link href="/admin/dashboard/relatorios"><BarChart3 />Relatórios</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/logs")} tooltip="Logs">
              <Link href="/admin/dashboard/logs"><ListOrderedIcon />Logs de Auditoria</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/dashboard/configuracoes")} tooltip="Configurações">
              <Link href="/admin/dashboard/configuracoes"><Settings />Configurações</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-6 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    Painel Administrativo TN Next
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-100/60 transition-colors duration-200 relative">
              <Bell className="h-5 w-5 text-slate-700" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
            </Button>
            
            <div className="overflow-hidden rounded-full transition-all duration-200 hover:ring-2 hover:ring-blue-200 hover:ring-offset-2 hover:ring-offset-white/10">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-5 px-6 py-6 bg-gradient-to-br from-slate-50 to-white/80 min-h-screen animate-fadeIn">{children}</div>

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0.6; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out forwards;
          }
        `}</style>
      </SidebarInset>
    </SidebarProvider>
  );
}
