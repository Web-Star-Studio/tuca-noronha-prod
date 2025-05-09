"use client"

import {
  BarChart3,
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
  LogOut,
  ChevronLeft,
  Search,
  LayoutPanelLeft
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
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
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
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

type Team = {
  id: string
  name: string
  image?: string
}

// Mock data for teams - in a real app, this would come from your Convex database
const teams: Team[] = [
  {
    id: "1",
    name: "Recanto da Serra",
    image: "/images/teams/adventure.png"
  },
  {
    id: "2",
    name: "Pousada do Sol",
    image: "/images/teams/eco.png"
  },
  {
    id: "3",
    name: "Cantinho do Mar",
    image: "/images/teams/corporate.png"
  }
]

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

function TeamSwitcher() {
  const [selectedTeam, setSelectedTeam] = useState<Team>(teams[0])
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="w-full">
        <div className="flex items-center gap-2 w-full justify-start px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedTeam.image} alt={selectedTeam.name} />
            <AvatarFallback className="bg-blue-600 text-white">
              {selectedTeam.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-slate-900">{selectedTeam.name}</span>
            <span className="text-xs text-slate-500">Gerenciar</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-500" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] bg-white border-none shadow-lg rounded-md overflow-hidden">
        <DropdownMenuLabel className="font-medium">Meus Empreendimentos</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuGroup>
          {teams.map((team) => (
            <DropdownMenuCheckboxItem
              key={team.id}
              checked={team.id === selectedTeam.id}
              onCheckedChange={() => {
                setSelectedTeam(team)
                setOpen(false)
              }}
              className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer"
            >
              <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={team.image} alt={team.name} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {team.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{team.name}</span>
              {team.id === selectedTeam.id && (
                <Check className="ml-auto h-4 w-4 text-blue-600" />
              )}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuItem className="cursor-pointer text-sm focus:bg-slate-100 focus:text-slate-900">
          <PlusCircle className="mr-2 h-4 w-4 text-blue-600" />
          <span>Adicionar Empreendimento</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <Sidebar className="bg-white border-r border-slate-200 shadow-sm">
      <SidebarHeader className="pb-5 border-b border-slate-200">
        <div className="px-3 py-4">
          <TeamSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarMenu className="space-y-1">
          <SidebarLink
            href="/admin/dashboard"
            icon={LayoutPanelLeft}
            label="Dashboard"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/atividades"
            icon={MapIcon}
            label="Atividades"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/eventos"
            icon={CalendarClock}
            label="Eventos"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/hospedagens"
            icon={Building2}
            label="Hospedagens"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/restaurantes"
            icon={Store}
            label="Restaurantes"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/pacotes"
            icon={Package}
            label="Pacotes"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/reservas"
            icon={Receipt}
            label="Reservas"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/usuarios"
            icon={Users}
            label="Usuários"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/midias"
            icon={Image}
            label="Mídias"
            isActive={isActive}
          />

          <SidebarLink
            href="/admin/dashboard/logs"
            icon={FileText}
            label="Logs de Auditoria"
            isActive={isActive}
          />


          <SidebarLink
            href="/admin/dashboard/configuracoes"
            icon={Settings}
            label="Configurações"
            isActive={isActive}
          />
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              {/* AD represents the user's initials */}
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarFallback className="bg-slate-100 text-slate-800 font-medium">
                  AD
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6 bg-slate-50 min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
