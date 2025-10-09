"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellRing,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Filter,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationManagementProps {
  className?: string;
}

type NotificationTypeMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
  iconWrapper: string;
  badgeClass: string;
  tintClass: string;
};

const DEFAULT_TYPE_META: NotificationTypeMeta = {
  label: "Notificação",
  description: "Atualizações gerais enviadas para os usuários.",
  icon: Bell,
  iconWrapper: "bg-blue-500/10 text-blue-600",
  badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
  tintClass: "hover:border-blue-200",
};

const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  booking_confirmed: {
    label: "Reserva Confirmada",
    description: "Confirmações enviadas após aprovação de reservas.",
    icon: CheckCircle,
    iconWrapper: "bg-emerald-500/10 text-emerald-600",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    tintClass: "hover:border-emerald-200",
  },
  booking_canceled: {
    label: "Reserva Cancelada",
    description: "Comunicações sobre cancelamentos e ajustes de agenda.",
    icon: Calendar,
    iconWrapper: "bg-rose-500/10 text-rose-600",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    tintClass: "hover:border-rose-200",
  },
  booking_updated: {
    label: "Reserva Atualizada",
    description: "Alterações nas reservas compartilhadas com o cliente.",
    icon: Calendar,
    iconWrapper: "bg-sky-500/10 text-sky-600",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    tintClass: "hover:border-sky-200",
  },
  booking_reminder: {
    label: "Lembrete de Reserva",
    description: "Alertas próximos à data da experiência reservada.",
    icon: BellRing,
    iconWrapper: "bg-amber-500/10 text-amber-600",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    tintClass: "hover:border-amber-200",
  },
  payment_received: {
    label: "Pagamento Recebido",
    description: "Confirmações de pagamento enviadas ao usuário.",
    icon: CreditCard,
    iconWrapper: "bg-emerald-500/10 text-emerald-600",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    tintClass: "hover:border-emerald-200",
  },
  system_update: {
    label: "Atualização do Sistema",
    description: "Novidades e melhorias liberadas na plataforma.",
    icon: Bell,
    iconWrapper: "bg-blue-500/10 text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    tintClass: "hover:border-blue-200",
  },
  chat_message: {
    label: "Mensagem de Chat",
    description: "Novas mensagens trocadas com o time de suporte.",
    icon: MessageCircle,
    iconWrapper: "bg-purple-500/10 text-purple-600",
    badgeClass: "bg-purple-100 text-purple-700 border border-purple-200",
    tintClass: "hover:border-purple-200",
  },
  chat_room_created: {
    label: "Nova Conversa",
    description: "Novos tópicos de chat criados na plataforma.",
    icon: MessageCircle,
    iconWrapper: "bg-indigo-500/10 text-indigo-600",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    tintClass: "hover:border-indigo-200",
  },
};

const typeFilterOptions = [
  { value: "all", label: "Todos os tipos" },
  ...Object.entries(NOTIFICATION_TYPE_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

const statusFilterOptions = [
  { value: "all", label: "Todos" },
  { value: "unread", label: "Não lidas" },
  { value: "read", label: "Lidas" },
];

export function NotificationManagement({ className }: NotificationManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState({
    type: "system_update",
    title: "",
    message: "",
    userEmail: "",
  });

  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: 100,
    includeRead: true,
  });

  const users = useQuery(api.domains.users.queries.listAllUsers, {
    limit: 1000,
  });

  type NotificationItem = NonNullable<typeof notifications>[number];
  type UserItem = NonNullable<typeof users>[number];

  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const createNotification = useMutation(api.domains.notifications.mutations.createNotification);
  const deleteNotification = useMutation(api.domains.notifications.mutations.deleteNotification);
  const sendBulkNotification = useMutation(api.domains.notifications.mutations.sendBulkNotification);

  const usersWithEmail = useMemo(() => {
    return (users ?? []).filter((user) => Boolean(user.email));
  }, [users]);

  const usersMap = useMemo(() => {
    const map = new Map<string, UserItem>();
    usersWithEmail.forEach((user) => {
      map.set(user._id, user);
    });
    return map;
  }, [usersWithEmail]);

  const selectedUser = useMemo(() => {
    if (!newNotification.userEmail) {
      return undefined;
    }
    return usersWithEmail.find((user) => user.email === newNotification.userEmail);
  }, [usersWithEmail, newNotification.userEmail]);

  const stats = useMemo(() => {
    const total = notifications?.length ?? 0;
    const unread = notifications?.filter((notification) => !notification.isRead).length ?? 0;
    const today = notifications?.filter((notification) => {
      const diff = differenceInCalendarDays(
        startOfDay(new Date(notification.createdAt)),
        startOfDay(new Date()),
      );
      return diff === 0;
    }).length ?? 0;
    const read = total - unread;
    const readRate = total > 0 ? Math.round((read / total) * 100) : 0;
    return { total, unread, today, readRate };
  }, [notifications]);

  const topNotificationType = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return null;
    }
    const counts = notifications.reduce<Record<string, number>>((acc, notification) => {
      acc[notification.type] = (acc[notification.type] ?? 0) + 1;
      return acc;
    }, {});
    const [value, count] =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (!value) {
      return null;
    }
    const meta = NOTIFICATION_TYPE_META[value] ?? DEFAULT_TYPE_META;
    return { value, count, meta };
  }, [notifications]);

  const filteredNotifications: NotificationItem[] = useMemo(() => {
    if (!notifications) {
      return [];
    }
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return notifications
      .filter((notification) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          notification.title.toLowerCase().includes(normalizedSearch) ||
          notification.message.toLowerCase().includes(normalizedSearch);

        const matchesType =
          typeFilter === "all" || notification.type === typeFilter;

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "read" && notification.isRead) ||
          (statusFilter === "unread" && !notification.isRead);

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [notifications, searchTerm, statusFilter, typeFilter]);

  const groupedNotifications = useMemo(() => {
    if (filteredNotifications.length === 0) {
      return [];
    }

    const groups = filteredNotifications.reduce<
      Record<string, { label: string; subtitle: string; date: Date; items: NotificationItem[] }>
    >((acc, notification) => {
      const date = new Date(notification.createdAt);
      const diff = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));

      let relativeLabel = format(date, "dd 'de' MMMM", { locale: ptBR });
      if (diff === 0) {
        relativeLabel = "Hoje";
      } else if (diff === -1) {
        relativeLabel = "Ontem";
      }

      const subtitle = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
      const key = `${relativeLabel}|${subtitle}`;

      if (!acc[key]) {
        acc[key] = {
          label: relativeLabel,
          subtitle,
          date,
          items: [],
        };
      }
      acc[key].items.push(notification);
      return acc;
    }, {});

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredNotifications]);

  const isLoadingNotifications = notifications === undefined;
  const isFiltering =
    searchTerm.trim().length > 0 || typeFilter !== "all" || statusFilter !== "all";

  const resetNewNotification = useCallback(() => {
    setNewNotification({
      type: "system_update",
      title: "",
      message: "",
      userEmail: "",
    });
    setSendToAll(true);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  }, []);

  const handleSelectNotification = useCallback((notification: NotificationItem) => {
    setSelectedNotification(notification);
    setIsPreviewOpen(true);
  }, []);

  const handlePreviewOpenChange = useCallback((open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) {
      setTimeout(() => setSelectedNotification(null), 150);
    }
  }, []);

  const handleCreateNotification = useCallback(async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast.error("Título e mensagem são obrigatórios.");
      return;
    }

    if (!sendToAll && !newNotification.userEmail) {
      toast.error("Selecione o usuário que receberá a notificação.");
      return;
    }

    setIsCreating(true);
    try {
      if (!sendToAll) {
        const user = usersWithEmail.find(
          (currentUser) => currentUser.email === newNotification.userEmail,
        );

        if (!user) {
          toast.error("Usuário não encontrado ou sem acesso.");
          return;
        }

        await createNotification({
          userId: user._id,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
        });
      } else {
        if (!usersWithEmail.length) {
          toast.error("Nenhum usuário disponível para receber a notificação.");
          return;
        }

        await sendBulkNotification({
          userIds: usersWithEmail.map((user) => user._id),
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
        });
      }

      toast.success("Notificação enviada com sucesso!");
      setIsCreateDialogOpen(false);
      resetNewNotification();
    } catch (error) {
      toast.error("Erro ao enviar notificação");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  }, [
    createNotification,
    newNotification.message,
    newNotification.title,
    newNotification.type,
    newNotification.userEmail,
    resetNewNotification,
    sendBulkNotification,
    sendToAll,
    usersWithEmail,
  ]);

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      setDeletingId(notificationId);
      try {
        await deleteNotification({ notificationId });
        toast.success("Notificação removida.");
        if (selectedNotification?._id === notificationId) {
          setSelectedNotification(null);
          setIsPreviewOpen(false);
        }
      } catch (error) {
        toast.error("Erro ao remover notificação");
        console.error(error);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteNotification, selectedNotification],
  );

  const handleSendToAllToggle = useCallback((checked: boolean) => {
    setSendToAll(checked);
    if (checked) {
      setNewNotification((prev) => ({ ...prev, userEmail: "" }));
    }
  }, []);

  const typeOptionsForSelect = typeFilterOptions.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      {option.label}
    </SelectItem>
  ));

  const statusOptionsForSelect = statusFilterOptions.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      {option.label}
    </SelectItem>
  ));

  const statCards = [
    {
      label: "Total enviadas",
      value: stats.total,
      description: "Notificações disparadas na plataforma",
      icon: Bell,
      iconBg: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Não lidas",
      value: stats.unread,
      description: "Ainda aguardando leitura",
      icon: BellRing,
      iconBg: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Enviadas hoje",
      value: stats.today,
      description: "Últimas 24 horas",
      icon: Calendar,
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Taxa de leitura",
      value: `${stats.readRate}%`,
      description: "Mensagens com leitura registrada",
      icon: TrendingUp,
      iconBg: "bg-purple-500/10 text-purple-600",
    },
  ] as const;

  const previewType =
    selectedNotification &&
    (NOTIFICATION_TYPE_META[selectedNotification.type] ?? DEFAULT_TYPE_META);

  const previewRecipient =
    selectedNotification && usersMap.get(selectedNotification.userId);

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className={`${ui.typography.h2.className} ${ui.colors.text.primary}`}>
              Gerenciamento de Notificações
            </h2>
            <p className={ui.colors.text.secondary}>
              Centralize os envios, monitore a leitura e ajuste o tom das comunicados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="flex items-center gap-1 border-dashed">
              <BellRing className="h-3.5 w-3.5" />
              {stats.unread} não lidas
            </Badge>
            {topNotificationType && (
              <Badge variant="outline" className="flex items-center gap-1 border-dashed">
                <Target className="h-3.5 w-3.5" />
                Tipo mais enviado: {topNotificationType.meta.label}
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1 border-dashed">
              <Users className="h-3.5 w-3.5" />
              Alcance visível: {usersWithEmail.length}
            </Badge>
          </div>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              resetNewNotification();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" variant="gradient">
              <Plus className="h-4 w-4" />
              Nova Notificação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Criar nova notificação</DialogTitle>
              <DialogDescription>
                Combine mensagem, tom e destinatários para entregar o contexto ideal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de notificação</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value) =>
                    setNewNotification((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{typeOptionsForSelect.slice(1)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Escolha o tipo para aplicar o tom visual correto e ajudar na identificação rápida.
                </p>
              </div>

              <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Destinatários</p>
                    <p className="text-xs text-muted-foreground">
                      Envie para todos os usuários visíveis ou selecione alguém específico.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Todos</span>
                    <Switch checked={sendToAll} onCheckedChange={handleSendToAllToggle} />
                  </div>
                </div>
              </div>

              {!sendToAll && (
                <div className="space-y-2">
                  <Label>Selecionar usuário</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex w-full items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {selectedUser
                            ? selectedUser.fullName ??
                              selectedUser.name ??
                              selectedUser.email
                            : "Buscar usuário por nome ou e-mail"}
                        </span>
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Digite para filtrar usuários..." />
                        <CommandList>
                          <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                          <CommandGroup heading="Usuários disponíveis">
                            {usersWithEmail.map((user) => {
                              const displayName =
                                user.fullName ?? user.name ?? "Usuário sem nome";
                              const email = user.email ?? "Sem e-mail";
                              return (
                                <CommandItem
                                  key={user._id}
                                  value={`${displayName} ${email}`}
                                  onSelect={() =>
                                    setNewNotification((prev) => ({
                                      ...prev,
                                      userEmail: user.email ?? "",
                                    }))
                                  }
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">
                                      {displayName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {email}
                                    </span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedUser && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 border-dashed text-xs"
                    >
                      <Users className="h-3.5 w-3.5" />
                      {selectedUser.fullName ?? selectedUser.name ?? selectedUser.email}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Apenas usuários com reservas confirmadas ficam disponíveis para seleção.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Ex: Sua reserva foi confirmada!"
                  value={newNotification.title}
                  onChange={(event) =>
                    setNewNotification((prev) => ({ ...prev, title: event.target.value }))
                  }
                  maxLength={120}
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {newNotification.title.length}/120
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Compartilhe o contexto e próxima ação que o usuário precisa realizar."
                  value={newNotification.message}
                  onChange={(event) =>
                    setNewNotification((prev) => ({ ...prev, message: event.target.value }))
                  }
                  maxLength={280}
                  className="min-h-[120px]"
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {newNotification.message.length}/280
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateNotification} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isCreating ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            variant="outline"
            className="border border-border/60 transition-all duration-200 hover:border-border hover:shadow-md"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
                <div className={cn("rounded-lg p-3", card.iconBg)}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="outline" className="border border-dashed border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros rápidos
          </CardTitle>
          <CardDescription>
            Combine buscas, tipos e status para encontrar notificações específicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou mensagem..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>{typeOptionsForSelect}</SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>{statusOptionsForSelect}</SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filteredNotifications.length === 1
                ? "1 notificação localizada"
                : `${filteredNotifications.length} notificações localizadas`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={!isFiltering}
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {isLoadingNotifications ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <Card key={index} variant="outline" className="border border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groupedNotifications.length > 0 ? (
          groupedNotifications.map((group) => (
            <div key={`${group.label}-${group.subtitle}`} className="space-y-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                </div>
                <div className="h-px flex-1 bg-border/60" />
                <Badge variant="outline" className="border-dashed text-xs">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "notificação" : "notificações"}
                </Badge>
              </div>

              <div className="space-y-3">
                {group.items.map((notification) => {
                  const typeMeta =
                    NOTIFICATION_TYPE_META[notification.type] ?? DEFAULT_TYPE_META;
                  const recipient = usersMap.get(notification.userId);
                  const recipientLabel =
                    recipient?.fullName ?? recipient?.name ?? recipient?.email ?? "Usuário";

                  return (
                    <Card
                      key={notification._id}
                      variant="outline"
                      className={cn(
                        "border border-border/60 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md",
                        typeMeta.tintClass,
                        !notification.isRead && "border-primary/40 bg-primary/5",
                      )}
                    >
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex flex-1 gap-4">
                            <div
                              className={cn(
                                "mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl",
                                typeMeta.iconWrapper,
                              )}
                            >
                              <typeMeta.icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-semibold text-foreground">
                                    {notification.title}
                                  </h3>
                                  <Badge
                                    className={cn("text-xs", typeMeta.badgeClass)}
                                  >
                                    {typeMeta.label}
                                  </Badge>
                                  {!notification.isRead && (
                                    <Badge variant="secondary" className="text-xs">
                                      Nova
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 border-dashed text-xs"
                                >
                                  <Users className="h-3.5 w-3.5" />
                                  {recipientLabel}
                                </Badge>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    locale: ptBR,
                                    addSuffix: true,
                                  })}
                                </div>
                                <div className="hidden items-center gap-1.5 md:flex">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              </div>

                              {(notification.data?.confirmationCode ||
                                notification.data?.assetName) && (
                                <div className="flex flex-wrap gap-2">
                                  {notification.data?.confirmationCode && (
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-[11px] uppercase tracking-wide"
                                    >
                                      Código: {notification.data.confirmationCode}
                                    </Badge>
                                  )}
                                  {notification.data?.assetName && (
                                    <Badge variant="outline" className="text-[11px]">
                                      Local: {notification.data.assetName}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-start">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectNotification(notification)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalhes</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNotification(notification._id)}
                                  disabled={deletingId === notification._id}
                                >
                                  {deletingId === notification._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent variant="danger">
                                Excluir esta notificação
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <Card variant="outline" className="border border-dashed border-border/70">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">
                Nenhuma notificação encontrada
              </h3>
              <p className="text-sm text-muted-foreground">
                Ajuste os filtros acima ou crie uma nova notificação para iniciar o histórico.
              </p>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar notificação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={isPreviewOpen} onOpenChange={handlePreviewOpenChange}>
        <SheetContent className="w-full space-y-6 sm:w-[460px]">
          {selectedNotification && previewType ? (
            <>
              <SheetHeader className="space-y-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-xl p-3",
                      previewType.iconWrapper,
                    )}
                  >
                    <previewType.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-lg font-semibold text-foreground">
                      {selectedNotification.title}
                    </SheetTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={cn("text-xs", previewType.badgeClass)}>
                        {previewType.label}
                      </Badge>
                      {!selectedNotification.isRead && (
                        <Badge variant="secondary" className="text-xs">
                          Nova
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <SheetDescription>{previewType.description}</SheetDescription>
              </SheetHeader>

              <Separator />

              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      Mensagem
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">
                      {selectedNotification.message}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(selectedNotification.createdAt), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(selectedNotification.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {previewRecipient
                          ? previewRecipient.fullName ??
                            previewRecipient.name ??
                            previewRecipient.email
                          : "Destinatário indisponível"}
                      </span>
                    </div>
                  </div>

                  {selectedNotification.data && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                        Dados adicionais
                      </h4>
                      <div className="grid gap-2">
                        {selectedNotification.data.confirmationCode && (
                          <div className="flex items-center justify-between rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm">
                            <span className="font-medium text-foreground">Código</span>
                            <span className="font-mono text-xs">
                              {selectedNotification.data.confirmationCode}
                            </span>
                          </div>
                        )}
                        {selectedNotification.data.assetName && (
                          <div className="flex items-center justify-between rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm">
                            <span className="font-medium text-foreground">Local</span>
                            <span className="text-sm text-muted-foreground">
                              {selectedNotification.data.assetName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <SheetFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteNotification(selectedNotification._id)}
                  disabled={deletingId === selectedNotification._id}
                >
                  {deletingId === selectedNotification._id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Excluir notificação
                </Button>
              </SheetFooter>
            </>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Selecione uma notificação para visualizar os detalhes.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
