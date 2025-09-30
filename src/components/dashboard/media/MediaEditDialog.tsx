"use client"

import { useState, useEffect } from "react"
import type { Media } from "@/lib/services/mediaService"
import { useUpdateMedia } from "@/lib/services/mediaService"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { buttonStyles, formStyles, transitionEffects, typography, cardStyles } from "@/lib/ui-config"
import { cn } from "@/lib/utils"
import { Save, PencilLine, Image } from "lucide-react"
import { SmartMedia } from "@/components/ui/smart-media"
import type { MediaEntry } from "@/lib/media"

const MEDIA_CATEGORIES = [
  { value: "restaurant", label: "Restaurantes" },
  { value: "activity", label: "Atividades" },
  { value: "event", label: "Eventos" },
  { value: "hero", label: "Banner Principal" },
  { value: "general", label: "Geral" },
]

type MediaEditDialogProps = {
  media: Media | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function MediaEditDialog({ media, open, onOpenChange, onSuccess }: MediaEditDialogProps) {
  const updateMedia = useUpdateMedia()
  
  const [description, setDescription] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [tags, setTags] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  
  // Reset form when media changes
  useEffect(() => {
    if (media) {
      setDescription(media.description || "")
      setCategory(media.category || "")
      setIsPublic(media.isPublic)
      setTags(media.tags ? media.tags.join(", ") : "")
    }
  }, [media])
  
  if (!media) return null
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      await updateMedia({
        id: media._id,
        description,
        category: category || undefined,
        isPublic,
        tags: tags ? tags.split(",").map(tag => tag.trim()) : undefined,
      })
      
      toast.success("Mídia atualizada com sucesso!")
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch {
      console.error("Erro ao atualizar mídia:", error)
      toast.error("Erro ao atualizar mídia")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px] max-w-[95vw]", cardStyles.base)}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", typography.title.cool)}>
            <PencilLine className="h-5 w-5" />
            Editar mídia
          </DialogTitle>
          <DialogDescription className={transitionEffects.appear.fadeIn}>
            Atualize as informações sobre esta mídia
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4 overflow-hidden">
          <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
            <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-background">
              {media.fileType.startsWith("image/") || media.fileType.startsWith("video/") ? (
                <SmartMedia
                  entry={{ url: media.url, type: media.fileType } as MediaEntry}
                  alt={media.fileName}
                  className="h-full w-full object-cover"
                  imageProps={{ width: 64, height: 64 }}
                  videoProps={{ muted: true, loop: true, playsInline: true }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate" title={media.fileName}>
                {media.fileName}
              </h4>
              <p className="text-xs text-muted-foreground">
                {media.fileType} • {media._creationTime 
                  ? new Date(media._creationTime).toLocaleDateString('pt-BR') 
                  : 'Data desconhecida'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category || "none"} onValueChange={(value) => setCategory(value === "none" ? "" : value)}>
              <SelectTrigger className={formStyles.select.trigger}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className={formStyles.select.content}>
                <SelectItem value="none">Nenhuma</SelectItem>
                {MEDIA_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da imagem..."
              className={formStyles.textarea.base}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="restaurante, praia, evento..."
              className={formStyles.input.base}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="public" 
              checked={isPublic} 
              onCheckedChange={setIsPublic}
              className={formStyles.switch.base}
            />
            <Label htmlFor="public">Disponível publicamente</Label>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              className={buttonStyles.variant.outline}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className={buttonStyles.variant.gradient}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
