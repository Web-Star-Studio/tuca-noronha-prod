"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Search, X, Plus, UserPlus, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CouponUserAssignmentProps {
  couponId: string;
  currentUsers: Array<{ _id: string; name: string; email: string; profileImage?: string }>;
  onUpdate: () => void;
}

export default function CouponUserAssignment({
  couponId,
  currentUsers,
  onUpdate,
}: CouponUserAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Queries
  const availableUsers = useQuery(
    api.domains.coupons.queries.getAvailableUsers,
    {
      searchTerm: searchTerm.length > 2 ? searchTerm : undefined,
      limit: 10,
      excludeIds: currentUsers.map(u => u._id as any),
    }
  );

  // Mutations
  const assignUsers = useMutation(api.domains.coupons.mutations.assignCouponToUsers);
  const removeUsers = useMutation(api.domains.coupons.mutations.removeCouponUsers);

  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      await assignUsers({
        couponId: couponId as any,
        userIds: selectedUsers as any,
      });
      
      setSelectedUsers([]);
      setSearchTerm("");
      setShowSearchResults(false);
      onUpdate();
      
      toast({
        title: "Usuários atribuídos",
        description: `${selectedUsers.length} usuário(s) atribuído(s) ao cupom com sucesso.`,
      });
    } catch (error) {
      console.error("Error assigning users to coupon:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atribuir usuários ao cupom.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUsers({
        couponId: couponId as any,
        userIds: [userId as any],
      });
      
      onUpdate();
      
      toast({
        title: "Usuário removido",
        description: "Usuário removido do cupom com sucesso.",
      });
    } catch (error) {
      console.error("Error removing user from coupon:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário do cupom.",
        variant: "destructive",
      });
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getSelectedUserInfo = (userId: string) => {
    return availableUsers?.find(u => u._id === userId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Atribuição de Usuários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usuários Atualmente Atribuídos */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Usuários Atribuídos ({currentUsers.length})
          </Label>
          
          {currentUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum usuário atribuído</p>
              <p className="text-sm">Este cupom está disponível para todos os usuários</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUser(user._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Buscar e Atribuir Novos Usuários */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Atribuir Novos Usuários</Label>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuários por nome ou email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(e.target.value.length > 2);
              }}
              className="pl-10"
            />
          </div>

          {/* Usuários Selecionados */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Usuários Selecionados ({selectedUsers.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const user = getSelectedUserInfo(userId);
                  return (
                    <Badge key={userId} variant="secondary" className="gap-1">
                      {user?.name || userId}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserSelect(userId)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
              <Button
                onClick={handleAssignUsers}
                className="w-full"
                disabled={selectedUsers.length === 0}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir {selectedUsers.length} Usuário(s)
              </Button>
            </div>
          )}

          {/* Resultados da Busca */}
          {showSearchResults && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resultados da Busca</Label>
              
              {availableUsers === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                  {searchTerm.length <= 2 && (
                    <p className="text-sm">Digite pelo menos 3 caracteres para buscar</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(user._id)
                          ? "bg-primary/10 border-primary/20 border"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                      onClick={() => handleUserSelect(user._id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {selectedUsers.includes(user._id) && (
                        <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                          <Plus className="h-3 w-3 text-primary-foreground rotate-45" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}