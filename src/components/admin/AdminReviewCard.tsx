"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/reviews/RatingStars";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Check, X, Eye, MessageSquare, Calendar, MapPin, Trash2, Reply } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminReviewCardProps {
  review: any; // Tipo será refinado baseado na query
  onStatusChange: () => void;
}

export function AdminReviewCard({ review, onStatusChange }: AdminReviewCardProps) {
  const [moderationReason, setModerationReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isPublicResponse, setIsPublicResponse] = useState(true);

  const moderateReview = useMutation(api.domains.reviews.mutations.moderateReview);
  const deleteReview = useMutation(api.domains.reviews.mutations.deleteReview);
  const respondToReview = useMutation(api.domains.reviews.mutations.respondToReview);

  const handleModerate = async (action: "approve" | "reject") => {
    setIsLoading(true);
    try {
      await moderateReview({
        reviewId: review._id,
        action,
        reason: moderationReason || undefined
      });

      toast.success(
        action === "approve" 
          ? "Review aprovada com sucesso!" 
          : "Review rejeitada com sucesso!"
      );
      
      onStatusChange();
      setModerationReason("");
    } catch (error) {
      toast.error("Erro ao moderar review");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteReview({
        reviewId: review._id,
        reason: moderationReason || undefined
      });

      toast.success("Review deletada com sucesso!");
      onStatusChange();
      setModerationReason("");
    } catch (error) {
      toast.error("Erro ao deletar review");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim()) {
      toast.error("Digite uma resposta");
      return;
    }

    setIsLoading(true);
    try {
      await respondToReview({
        reviewId: review._id,
        response: responseText,
        isPublic: isPublicResponse
      });

      toast.success("Resposta enviada com sucesso!");
      setShowResponse(false);
      setResponseText("");
      onStatusChange();
    } catch (error) {
      toast.error("Erro ao enviar resposta");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAssetTypeLabel = (type: string) => {
    const labels = {
      restaurant: "Restaurante",
      accommodation: "Hospedagem", 
      activity: "Atividade",
      event: "Evento",
      vehicle: "Veículo",
      package: "Pacote"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (isApproved: boolean) => {
    return isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  return (
    <Card className={`border-l-4 ${review.isApproved ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.user?.image} />
              <AvatarFallback>
                {review.user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{review.user?.name || "Usuário Anônimo"}</h4>
                <Badge variant={review.isVerified ? "default" : "secondary"}>
                  {review.isVerified ? "Verificado" : "Não verificado"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(review.isApproved)}>
              {review.isApproved ? "Aprovada" : "Pendente"}
            </Badge>
            <Badge variant="outline">
              {getAssetTypeLabel(review.itemType)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating e Título */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <RatingStars rating={review.rating} size="sm" />
            <span className="text-sm text-muted-foreground">
              {review.rating}/5
            </span>
          </div>
          <h5 className="font-medium">{review.title}</h5>
        </div>

        {/* Comentário */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm">{review.comment}</p>
        </div>

        {/* Informações do Asset */}
        {review.asset && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{review.asset.name}</span>
            </div>
            {review.asset.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {review.asset.description}
              </p>
            )}
          </div>
        )}

        {/* Ratings Detalhados */}
        {review.detailedRatings && Object.keys(review.detailedRatings).length > 0 && (
          <div className="bg-muted/20 p-3 rounded-lg">
            <h6 className="text-sm font-medium mb-2">Avaliações Detalhadas:</h6>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(review.detailedRatings).map(([key, value]) => (
                value && (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span>{value}/5</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Metadados */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
            {review.visitDate && (
              <span>Visitado: {review.visitDate}</span>
            )}
            {review.groupType && (
              <span>Grupo: {review.groupType}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <span>{review.helpfulVotes} útil</span>
            <span>•</span>
            <span>{review.unhelpfulVotes} não útil</span>
            <span>•</span>
            <span className={review.wouldRecommend ? "text-green-600" : "text-red-600"}>
              {review.wouldRecommend ? "Recomenda" : "Não recomenda"}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            {!review.isApproved && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="default" disabled={isLoading}>
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Aprovar Review</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja aprovar esta review? Ela ficará visível para todos os usuários.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleModerate("approve")}
                        disabled={isLoading}
                      >
                        Aprovar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={isLoading}>
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rejeitar Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Por favor, forneça um motivo para a rejeição (opcional):
                      </p>
                      <Textarea
                        placeholder="Motivo da rejeição..."
                        value={moderationReason}
                        onChange={(e) => setModerationReason(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">
                          Cancelar
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleModerate("reject")}
                          disabled={isLoading}
                        >
                          {isLoading ? "Processando..." : "Rejeitar"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowResponse(!showResponse)}
              disabled={isLoading}
            >
              <Reply className="h-4 w-4 mr-1" />
              Responder
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar Review</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A review será permanentemente removida do sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <Textarea
                    placeholder="Motivo da exclusão (opcional)..."
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? "Deletando..." : "Deletar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Button size="sm" variant="ghost">
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalhes
          </Button>
        </div>

        {/* Seção de Resposta */}
        {showResponse && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border-t">
            <h6 className="font-medium mb-3">Responder à Review</h6>
            <div className="space-y-3">
              <Textarea
                placeholder="Digite sua resposta..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="public-response"
                    checked={isPublicResponse}
                    onChange={(e) => setIsPublicResponse(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="public-response" className="text-sm">
                    Resposta pública (visível para todos)
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowResponse(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRespond}
                    disabled={isLoading || !responseText.trim()}
                  >
                    {isLoading ? "Enviando..." : "Enviar Resposta"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 