"use client"

import {
  Building2,
  CalendarClock,
  Home,
  Map as MapIcon,
  Package,
  Receipt,
  Settings,
  Store,
  Users,
  Bell,
  ChevronsUpDown,
  PlusCircle,
  Check,
  Image,
  FileText,
  ChevronLeft,
  Search,
  LayoutPanelLeft,
  Car,
  MessageSquare,
  Bed,
  Activity,
  Calendar,
  Utensils,
  UserCheck
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import type { LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { OrganizationProvider, useOrganization } from "@/lib/providers/organization-context"
import { useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"


interface SidebarLinkProps {
  href: string
  icon: LucideIcon
  label: string
  isActive: (path: string) => boolean
}

function SidebarLink({ href, icon: Icon, label, isActive }: SidebarLinkProps) {
  return (
    <SidebarMenuItem>
      <Link
        href={href}
        className={cn(
          "flex items-center h-10 gap-3 px-3 text-sm font-medium rounded-md hover:bg-slate-100",
          isActive(href) ? "text-blue-600 bg-blue-50" : "text-slate-600"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    </SidebarMenuItem>
  )
}

function OrganizationSwitcher() {
  const { organizations, activeOrganization, setActiveOrganization } = useOrganization()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useCurrentUser()

  if (!activeOrganization) {
    return (
      <div className="flex items-center gap-2 w-full justify-start px-2 py-1.5">
        <div className="animate-pulse bg-slate-200 h-8 w-8 rounded-full"></div>
        <div className="flex flex-col items-start gap-1">
          <div className="animate-pulse bg-slate-200 h-4 w-24 rounded"></div>
          <div className="animate-pulse bg-slate-200 h-3 w-16 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="w-full">
        <div className="flex items-center gap-2 w-full justify-start px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activeOrganization.image} alt={activeOrganization.name} />
            <AvatarFallback className="bg-blue-600 text-white">
              {activeOrganization.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-slate-900">{activeOrganization.name}</span>
            <span className="text-xs text-slate-500">Gerenciar</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-500" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] bg-white border-none shadow-lg rounded-md overflow-hidden">
        <DropdownMenuLabel className="font-medium">Meus Empreendimentos</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuGroup>
          {organizations.map((org) => (
            <DropdownMenuCheckboxItem
              key={org._id}
              checked={org._id === activeOrganization._id}
              onCheckedChange={() => {
                setActiveOrganization(org)
                setOpen(false)
              }}
              className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer"
            >
              <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={org.image} alt={org.name} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {org.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{org.name}</span>
              {org._id === activeOrganization._id && (
                <Check className="ml-auto h-4 w-4 text-blue-600" />
              )}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-slate-200" />
        {/* Apenas partners e masters podem criar organizações */}
        {user && (user.role === "partner" || user.role === "master") && (
          <DropdownMenuItem 
            className="cursor-pointer text-sm focus:bg-slate-100 focus:text-slate-900"
            onClick={() => {
              setOpen(false)
              router.push("/admin/dashboard/novo-empreendimento")
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4 text-blue-600" />
            <span>Adicionar Empreendimento</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Mapear tipos de organização para ícones e links específicos
const getOrganizationSpecificLinks = (organizationType: string): Array<{
  href: string
  icon: LucideIcon
  label: string
}> => {
  const baseLink = "/admin/dashboard"
  
  switch (organizationType) {
    case "restaurant":
      return [
        { href: `${baseLink}/restaurantes`, icon: Utensils, label: "Gerenciar Restaurantes" },
        { href: `${baseLink}/reservas`, icon: Receipt, label: "Reservas" },
      ]
    case "accommodation":
      return [
        { href: `${baseLink}/hospedagens`, icon: Bed, label: "Acomodações" },
        { href: `${baseLink}/reservas`, icon: Receipt, label: "Reservas" },
      ]
    case "rental_service":
      return [
        { href: `${baseLink}/vehicles`, icon: Car, label: "Frota de Veículos" },
        { href: `${baseLink}/reservas`, icon: Receipt, label: "Locações" },
      ]
    case "activity_service":
      return [
        { href: `${baseLink}/atividades`, icon: Activity, label: "Atividades" },
        { href: `${baseLink}/reservas`, icon: Receipt, label: "Reservas" },
      ]
    case "event_service":
      return [
        { href: `${baseLink}/eventos`, icon: Calendar, label: "Eventos" },
        { href: `${baseLink}/reservas`, icon: Receipt, label: "Reservas" },
      ]
    default:
      return []
  }
}

function AdminSidebar() {
  const pathname = usePathname()
  const { activeOrganization } = useOrganization()
  const { user } = useCurrentUser()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  // Links comuns a todas as organizações
  const baseCommonLinks: Array<{
    href: string;
    icon: LucideIcon;
    label: string;
    requiresRole?: string[];
  }> = [
    { href: "/admin/dashboard", icon: LayoutPanelLeft, label: "Dashboard" },
    { href: "/admin/dashboard/chat", icon: MessageSquare, label: "Chat" },
    { href: "/admin/dashboard/colaboradores", icon: UserCheck, label: "Colaboradores", requiresRole: ["partner", "master"] },
    { href: "/admin/dashboard/usuarios", icon: Users, label: "Usuários", requiresRole: ["partner", "master"] },
    { href: "/admin/dashboard/midias", icon: Image, label: "Mídias" },
    { href: "/admin/dashboard/logs", icon: FileText, label: "Logs de Auditoria", requiresRole: ["partner", "master"] },
    { href: "/admin/dashboard/configuracoes", icon: Settings, label: "Configurações" },
  ]

  // Filtrar links baseado no role do usuário
  const commonLinks = baseCommonLinks.filter(link => {
    if (!link.requiresRole) return true;
    if (!user?.role) return false;
    return link.requiresRole.includes(user.role);
  });

  // Links específicos baseados no tipo de organização
  const specificLinks = activeOrganization 
    ? getOrganizationSpecificLinks(activeOrganization.type)
    : []

  return (
    <Sidebar className="bg-white border-r border-slate-200 shadow-sm">
      <SidebarHeader className="pb-5 border-b border-slate-200">
        <div className="px-3 py-4">
          <OrganizationSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarMenu className="space-y-1">
          {/* Links comuns */}
          {commonLinks.slice(0, 1).map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isActive={isActive}
            />
          ))}

          {/* Links específicos do tipo de organização */}
          {specificLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isActive={isActive}
            />
          ))}

          {/* Resto dos links comuns */}
          {commonLinks.slice(1).map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isActive={isActive}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 mt-auto py-3 px-3">
        <Link href="/" className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
          <Home className="h-5 w-5 mr-3" />
          Home
        </Link>
      </SidebarFooter>
    </Sidebar>
  ) 
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-6 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="rounded-md p-1.5 hover:bg-slate-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </SidebarTrigger>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Pesquisar..."
                className="pl-8 h-9 focus-visible:ring-blue-500"
              />
            </div>

            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 relative">
              <Bell className="h-5 w-5 text-slate-700" />
              <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">3</span>
            </Button>

            <div className="overflow-hidden rounded-full">
              <UserButton appearance={{
                elements: {
                  userPreview: "bg-white rounded-lg shadow-md",
                  userButtonPopoverCard: "bg-white rounded-lg shadow-lg border border-gray-200",
                  userButtonTrigger: "shadow-sm hover:shadow-md focus:shadow-md transition-shadow",
                  userButtonPopoverActions: "p-2",
                  userButtonPopoverActionButton: "text-black hover:bg-blue-100 rounded-md transition-colors",
                  userButtonPopoverActionButtonIcon: "text-gray-600",
                  userButtonPopoverFooter: "border-t border-gray-200",
                  userButtonPopoverActionButtonText: "text-sm font-medium",
                  avatarBox: "h-9 w-9 rounded-full border border-slate-200"
                }
              }} />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6 bg-slate-50 min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrganizationProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </OrganizationProvider>
  )
}
