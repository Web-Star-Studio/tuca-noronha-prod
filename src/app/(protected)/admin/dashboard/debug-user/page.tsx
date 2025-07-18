"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function DebugUserPage() {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);
  const updateUserRole = useMutation(api.admin_functions.updateUserRole);
  
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (currentUser?.role) {
      setSelectedRole(currentUser.role);
    }
  }, [currentUser?.role]);

  const handleUpdateRole = async () => {
    if (!currentUser?._id || !selectedRole) {
      toast.error("Usuário ou role não selecionado");
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserRole({
        userId: currentUser._id,
        role: selectedRole,
      });
      toast.success("Role atualizada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar role");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Debug de Usuário</h1>
        <p className="text-muted-foreground">
          Informações e configurações do usuário atual
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Clerk</CardTitle>
          <CardDescription>Dados do usuário no sistema de autenticação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">ID do Clerk</Label>
            <p className="font-mono text-sm">{clerkUser?.id}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="font-mono text-sm">{clerkUser?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <p className="font-mono text-sm">{clerkUser?.fullName || clerkUser?.firstName}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Convex</CardTitle>
          <CardDescription>Dados do usuário no banco de dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">ID do Convex</Label>
              <p className="font-mono text-sm">{currentUser._id}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Clerk ID</Label>
              <p className="font-mono text-sm">{currentUser.clerkId}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-mono text-sm">{currentUser.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <p className="font-mono text-sm">{currentUser.name}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="text-xs text-muted-foreground">Role Atual</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-sm">
                {currentUser.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atualizar Role</CardTitle>
          <CardDescription>
            Altere a role do usuário atual (requer role "master")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traveler">Traveler (Viajante)</SelectItem>
                <SelectItem value="partner">Partner (Parceiro)</SelectItem>
                <SelectItem value="employee">Employee (Funcionário)</SelectItem>
                <SelectItem value="master">Master (Administrador)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleUpdateRole} 
            disabled={isUpdating || !selectedRole || selectedRole === currentUser.role}
            className="w-full"
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atualizar Role
          </Button>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium text-sm mb-2">Descrição das Roles:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><strong>Traveler:</strong> Usuário padrão, pode fazer reservas</li>
              <li><strong>Partner:</strong> Parceiro com acesso ao Stripe Connect</li>
              <li><strong>Employee:</strong> Funcionário de um parceiro</li>
              <li><strong>Master:</strong> Administrador do sistema</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 