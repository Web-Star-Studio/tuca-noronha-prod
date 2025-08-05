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
import { Check, X, Eye, Calendar, MapPin, Trash2, Reply } from "lucide-react";
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
  const [responseText, setResponseText] = useState("");
  const [isPublicResponse, setIsPublicResponse] = useState(true);
  const [openResponseDialog, setOpenResponseDialog] = useState(false);

  const deleteReview = useMutation(api["domains/reviews/mutations"].deleteReview);
  const respondToReview = useMutation(api["domains/reviews/mutations"].respondToReview);



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
      setOpenResponseDialog(false);
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



  return (
    <Card className="border-l-4 border-l-green-500">
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

          <Badge variant="outline">
            {getAssetTypeLabel(review.itemType)}
          </Badge>
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
              {Object.entries(review.detailedRatings).map(([key, value]) => 
                value ? (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span>{String(value)}/5</span>
                  </div>
                ) : null
              )}
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
            
            <Dialog open={openResponseDialog} onOpenChange={setOpenResponseDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Responder
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-lg">
                <DialogHeader>
                  <DialogTitle>Responder Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sua resposta</label>
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public-response-dialog"
                      checked={isPublicResponse}
                      onChange={(e) => setIsPublicResponse(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="public-response-dialog" className="text-sm">
                      Resposta pública (visível para todos)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpenResponseDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRespond}
                    disabled={isLoading || !responseText.trim()}
                  >
                    {isLoading ? "Enviando..." : "Enviar Resposta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

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
                    className="bg-red-600 hover:bg-red-700 text-white"
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
      </CardContent>
    </Card>
  );
} 