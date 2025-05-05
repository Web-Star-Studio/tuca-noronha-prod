"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

interface UserMenuProps {
  isTransparent?: boolean;
}

const UserMenu = ({ isTransparent = true }: UserMenuProps) => {
  // const [isMaster, setIsMaster] = useState(false);
  // const [isAdmin, setIsAdmin] = useState(false);
  // const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // const handleLogout = () => {
  //   router.push("/login");
  // };

  // const getInitials = (name: string) =>
  //   name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //     .toUpperCase()
  //     .slice(0, 2);

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
            onClick={() => router.push("/login")}
          >
            Login
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
      {/* <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          {isMaster && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400">
              <ShieldCheck className="h-3 w-3 text-white" />
            </span>
          )}
          <Avatar className="h-9 w-9">
            <AvatarFallback
              className={`text-black ${
                isMaster
                  ? "bg-yellow-600"
                  : isAdmin
                    ? "bg-tuca-ocean-blue"
                    : "bg-gray-600"
              }`}
            >
              <User />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">Usuário</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {user?.user_metadata?.name}
            </p>
            {isMaster && (
              <p className="text-xs text-yellow-600 font-semibold flex items-center">
                <ShieldCheck className="h-3 w-3 mr-1" /> Master Admin
              </p>
            )}
            {!isMaster && isAdmin && (
              <p className="text-xs text-blue-600 font-semibold">
                Administrador
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" /> Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/lista-de-desejos" className="flex w-full items-center">
            <Heart className="mr-2 h-4 w-4" /> Lista de Desejos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pedidos" className="flex w-full items-center">
            <ShoppingBag className="mr-2 h-4 w-4" /> Pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu> */}
    </>
  );
};

export default UserMenu;
