"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardPageHeader } from "../components";
import { MediaSelector } from "@/components/dashboard/media";

type ActivityData = {
  _id: Id<"activities">;
  title: string;
  description?: string;
  category: string;
  price: number | bigint;
  maxParticipants: number | bigint;
  minParticipants?: number | bigint;
  difficulty: string;
  rating: number | bigint;
  isFeatured: boolean;
  isActive: boolean;
  partnerId: Id<"users">;
  _creationTime: number;
  duration: string;
  shortDescription: string;
  imageUrl?: string;
  galleryImages?: string[];
  highlights?: string[];
  includes?: string[];
  itineraries?: string[];
  excludes?: string[];
  additionalInfo?: string[];
  cancelationPolicy?: string[];
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

  // Estados para operações CRUD
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Mutations
  const createActivity = useMutation(api.domains.activities.mutations.create);
  const updateActivity = useMutation(api.domains.activities.mutations.update);
  const deleteActivity = useMutation(api.domains.activities.mutations.remove);
  const toggleFeatured = useMutation(api.domains.activities.mutations.toggleFeatured);
  const toggleActive = useMutation(api.domains.activities.mutations.toggleActive);

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
    totalRevenuePotential: activities.reduce((sum, a) => sum + (Number(a.price) * Number(a.maxParticipants)), 0),
    avgRating: activities.length > 0 ? activities.reduce((sum, a) => sum + Number(a.rating || 0), 0) / activities.length : 0,
  } : null;

  // Handlers para operações CRUD
  const handleCreateActivity = async (formData: any) => {
    try {
      await createActivity({
        ...formData,
        partnerId: formData.partnerId as Id<"users">,
      });
      toast.success("Atividade criada com sucesso");
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Erro ao criar atividade");
    }
  };

  const handleUpdateActivity = async (formData: any) => {
    try {
      await updateActivity({
        id: editingActivity?._id as Id<"activities">,
        ...formData,
        partnerId: formData.partnerId as Id<"users">,
      });
      toast.success("Atividade atualizada com sucesso");
      setEditingActivity(null);
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Erro ao atualizar atividade");
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteActivity({ id: id as Id<"activities"> });
      toast.success("Atividade excluída com sucesso");
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Erro ao excluir atividade");
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await toggleFeatured({ id: id as Id<"activities">, isFeatured: featured });
      toast.success(`Atividade ${featured ? "destacada" : "removida dos destaques"} com sucesso`);
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Erro ao alterar status de destaque");
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleActive({ id: id as Id<"activities">, isActive: active });
      toast.success(`Atividade ${active ? "ativada" : "desativada"} com sucesso`);
    } catch (error) {
      console.error("Error toggling active:", error);
      toast.error("Erro ao alterar status ativo");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <DashboardPageHeader
          title="Gestão de Atividades"
          description="Visão completa de todas as atividades da plataforma"
          icon={Activity}
          iconBgClassName="bg-purple-100"
          iconColorClassName="text-purple-600"
        />
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 border-none text-white">
              <Plus className="mr-2 h-4 w-4" /> Nova Atividade
            </Button>
          </DialogTrigger>
        </Dialog>
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
                            <span className="text-sm">{activity.rating ? Number(activity.rating).toFixed(1) : 'N/A'}</span>
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
                        {formatCurrency(Number(activity.price))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          {Number(activity.maxParticipants)}
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
                            onClick={() => setEditingActivity(activity)}
                            title="Editar atividade"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleFeatured(activity._id, !activity.isFeatured)}
                            title={activity.isFeatured ? "Remover destaque" : "Destacar"}
                            className={activity.isFeatured ? "text-yellow-600 hover:text-yellow-700" : ""}
                          >
                            <Star className={`h-4 w-4 ${activity.isFeatured ? "fill-yellow-500" : ""}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(activity._id, !activity.isActive)}
                            title={activity.isActive ? "Desativar" : "Ativar"}
                            className={activity.isActive ? "text-green-600 hover:text-green-700" : "text-gray-600 hover:text-gray-700"}
                          >
                            {activity.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/atividades/${activity._id}`, "_blank")}
                            title="Visualizar página"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteId(activity._id)}
                            title="Excluir atividade"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Activity Form Dialog */}
      <ActivityFormDialog 
        open={addDialogOpen || !!editingActivity}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setEditingActivity(null);
          }
        }}
        activity={editingActivity}
        onSave={editingActivity ? handleUpdateActivity : handleCreateActivity}
        title={editingActivity ? "Editar Atividade" : "Nova Atividade"}
        description={editingActivity ? "Atualize as informações da atividade." : "Preencha os dados para criar uma nova atividade."}
      />

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta atividade?
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200 text-red-700 text-sm">
              Ao excluir esta atividade, todos os dados associados também serão removidos.
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteActivity(confirmDeleteId)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Componente do formulário de atividade
function ActivityFormDialog({ 
  open, 
  onOpenChange, 
  activity, 
  onSave, 
  title, 
  description 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: ActivityData | null;
  onSave: (data: any) => void;
  title: string;
  description: string;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    price: 0,
    category: "",
    duration: "",
    maxParticipants: 1,
    minParticipants: 1,
    difficulty: "Fácil",
    rating: 0,
    imageUrl: "",
    galleryImages: [] as string[],
    highlights: [] as string[],
    includes: [] as string[],
    itineraries: [] as string[],
    excludes: [] as string[],
    additionalInfo: [] as string[],
    cancelationPolicy: [] as string[],
    isFeatured: false,
    isActive: true,
    partnerId: "",
  });

  const [partners] = useState<any[]>([]);
  const allUsers = useQuery(api.domains.users.queries.getAllUsers);

  const partnerUsers = allUsers?.filter(user => user.role === "partner") || [];

  // Reset form when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || "",
        description: activity.description || "",
        shortDescription: activity.shortDescription || "",
        price: Number(activity.price) || 0,
        category: activity.category || "",
        duration: activity.duration || "",
        maxParticipants: Number(activity.maxParticipants) || 1,
        minParticipants: Number(activity.minParticipants) || 1,
        difficulty: activity.difficulty || "Fácil",
        rating: Number(activity.rating) || 0,
        imageUrl: activity.imageUrl || "",
        galleryImages: activity.galleryImages || [],
        highlights: activity.highlights || [],
        includes: activity.includes || [],
        itineraries: activity.itineraries || [],
        excludes: activity.excludes || [],
        additionalInfo: activity.additionalInfo || [],
        cancelationPolicy: activity.cancelationPolicy || [],
        isFeatured: activity.isFeatured || false,
        isActive: activity.isActive !== undefined ? activity.isActive : true,
        partnerId: activity.partnerId || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        shortDescription: "",
        price: 0,
        category: "",
        duration: "",
        maxParticipants: 1,
        minParticipants: 1,
        difficulty: "Fácil",
        rating: 0,
        imageUrl: "",
        galleryImages: [],
        highlights: [],
        includes: [],
        itineraries: [],
        excludes: [],
        additionalInfo: [],
        cancelationPolicy: [],
        isFeatured: false,
        isActive: true,
        partnerId: "",
      });
    }
  }, [activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Ex: 2 horas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Máx. Participantes *</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade *</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerId">Parceiro *</Label>
              <Select 
                value={formData.partnerId} 
                onValueChange={(value) => setFormData({ ...formData, partnerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um parceiro" />
                </SelectTrigger>
                <SelectContent>
                  {partnerUsers.map((partner) => (
                    <SelectItem key={partner._id} value={partner._id}>
                      {partner.name || partner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Descrição Curta *</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Completa *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            />
            <Label htmlFor="isFeatured">Destacar atividade</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <Label htmlFor="isActive">Atividade ativa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {activity ? "Atualizar" : "Criar"} Atividade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 