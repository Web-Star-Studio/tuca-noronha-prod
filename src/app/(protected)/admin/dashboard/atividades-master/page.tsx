"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Activity, 
  Users, 
  Calendar, 
  DollarSign, 
  Eye, 
  ExternalLink, 
  Star, 
  MapPin,
  Clock,
  Search,
  Filter,
  TrendingUp,
  Award,
  Building2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ActivityData = {
  _id: Id<"activities">;
  title: string;
  category: string;
  price: number;
  maxParticipants: number;
  difficulty: string;
  rating: number;
  isFeatured: boolean;
  isActive: boolean;
  partnerId: Id<"users">;
  _creationTime: number;
  duration: string;
  shortDescription: string;
  creator?: {
    name?: string;
    email?: string;
  };
};

const categoryLabels: Record<string, string> = {
  "adventure": "Aventura",
  "cultural": "Cultural",
  "gastronomic": "Gastronômico",
  "nature": "Natureza",
  "sports": "Esportivo",
  "wellness": "Bem-estar",
  "entertainment": "Entretenimento",
};

const difficultyColors: Record<string, string> = {
  "Fácil": "bg-green-100 text-green-800",
  "Moderado": "bg-yellow-100 text-yellow-800",
  "Difícil": "bg-red-100 text-red-800",
};

export default function ActivitiesMasterPage() {
  const { user } = useCurrentUser();
  const router = useRouter();

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  // Verificar permissões
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "master") {
    router.push("/admin/dashboard");
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores master podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Queries
  const activities = useQuery(api.domains.activities.queries.getActivitiesWithCreators) as ActivityData[] | undefined;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filtrar atividades baseado nos filtros aplicados
  const filteredActivities = activities?.filter((activity) => {
    if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "all" && activity.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== "all") {
      if (selectedStatus === "active" && !activity.isActive) return false;
      if (selectedStatus === "inactive" && activity.isActive) return false;
      if (selectedStatus === "featured" && !activity.isFeatured) return false;
    }
    if (selectedDifficulty !== "all" && activity.difficulty !== selectedDifficulty) {
      return false;
    }
    return true;
  }) || [];

  // Estatísticas
  const stats = activities ? {
    total: activities.length,
    active: activities.filter(a => a.isActive).length,
    featured: activities.filter(a => a.isFeatured).length,
    totalRevenuePotential: activities.reduce((sum, a) => sum + (a.price * a.maxParticipants), 0),
    avgRating: activities.length > 0 ? activities.reduce((sum, a) => sum + a.rating, 0) / activities.length : 0,
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Atividades</h1>
            <p className="text-sm text-gray-600">
              Visão completa de todas as atividades da plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">atividades registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Destaque</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.featured / stats.total) * 100) : 0}% em destaque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potencial de Receita</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalRevenuePotential)}
              </div>
              <p className="text-xs text-muted-foreground">capacidade máxima</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.avgRating.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">⭐ rating médio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Nome da atividade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="featured">Em Destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as dificuldades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as dificuldades</SelectItem>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades da Plataforma
            {filteredActivities.length > 0 && (
              <Badge variant="secondary">
                {filteredActivities.length} {filteredActivities.length === 1 ? "atividade" : "atividades"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activities && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          )}

          {activities && filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" || selectedDifficulty !== "all"
                  ? "Nenhuma atividade corresponde aos filtros aplicados."
                  : "Não há atividades cadastradas no momento."
                }
              </p>
            </div>
          )}

          {filteredActivities.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm">{activity.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {activity.creator?.name || "Nome não informado"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {activity.creator?.email || "Email não informado"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[activity.category] || activity.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(activity.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          {activity.maxParticipants}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={difficultyColors[activity.difficulty] || "bg-gray-100 text-gray-800"}>
                          {activity.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={activity.isActive ? "default" : "secondary"}>
                            {activity.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                          {activity.isFeatured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Destaque
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(activity._creationTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/atividades/${activity._id}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 