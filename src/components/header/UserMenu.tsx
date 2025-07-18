"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { NotificationCenter } from "@/components/ui/notification-center";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import Link from "next/link";
import { LayoutDashboard, Settings, DollarSign } from "lucide-react";
import { ui } from "@/lib/ui-config";

interface UserMenuProps {
  isTransparent?: boolean;
}

const UserMenu = ({ isTransparent = true }: UserMenuProps) => {
  const { user, isLoading } = useCurrentUser();
  
  // Verifica se o usuário tem permissão para acessar o dashboard
  const canAccessDashboard = user && (user.role === "partner" || user.role === "employee" || user.role === "master");
  
  // Verifica se o usuário é partner ou employee (não deve ver Financeiro e Configurações)
  const isPartnerOrEmployee = user && (user.role === "partner" || user.role === "employee");
  
  return (
    <>
      <SignedOut>
        <SignInButton>
          <Button
            className={`hover:cursor-pointer ${
              isTransparent
                ? "bg-white text-black hover:bg-white/90"
                : "hover:bg-blue-500 bg-blue-700 text-white"
            }`}
            variant="default"
          >
            Login
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-3">
          {/* Dashboard Button - apenas para roles autorizadas */}
          {!isLoading && canAccessDashboard && (
            <Link href="/admin/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-all duration-200 ${
                  isTransparent
                    ? "text-white hover:bg-white/10 hover:text-white"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          )}
          
          {/* Financial Dashboard Button - NÃO mostrar para partners e employees */}
          {!isLoading && !isPartnerOrEmployee && (
            <Link href="/meu-painel/financeiro">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-all duration-200 ${
                  isTransparent
                    ? "text-white hover:bg-white/10 hover:text-white"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </Button>
            </Link>
          )}
          
          {/* Configurações Button - NÃO mostrar para partners e employees */}
          {!isLoading && !isPartnerOrEmployee && (
            <Link href="/meu-painel/configuracoes">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-all duration-200 ${
                  isTransparent
                    ? "text-white hover:bg-white/10 hover:text-white"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </Button>
            </Link>
          )}
          
          {/* Notification Center */}
          <NotificationCenter 
            className={`${
              isTransparent
                ? "text-white hover:bg-white/10"
                : "text-gray-900 hover:bg-gray-100"
            }`}
          />
          
          {/* User Button */}
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
              avatarBox: "rounded-full border-2 border-white shadow-sm"
            }
          }} />
        </div>
      </SignedIn>
    </>
  );
};

export default UserMenu;
