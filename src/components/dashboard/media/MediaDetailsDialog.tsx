"use client"

import { useState } from "react"
import type { Media } from "@/lib/services/mediaService"
import type { Id } from "@/../convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Copy, Link, Image, Info, Tag, Calendar, FileType, HardDrive, Eye } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { buttonStyles, cardStyles, badgeStyles, decorativeBackgrounds, transitionEffects, typography } from "@/lib/ui-config"
import { cn } from "@/lib/utils"
import { ConvexImage } from "@/components/ui/convex-image"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type MediaDetailsDialogProps = {
  media: Media | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MediaDetailsDialog({ media, open, onOpenChange }: MediaDetailsDialogProps) {
  if (!media) return null

  const formatFileSize = (bytes: number | bigint): string => {
    const kb = Number(bytes) / 1024
    
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`
    }
    
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(media.url)
    toast.success("URL copiada para a área de transferência")
  }
  
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = media.url
    link.download = media.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-3xl", cardStyles.base, transitionEffects.appear.fadeIn)}>
        <DialogHeader>
          <DialogTitle className={cn(typography.title.cool, "truncate")}>
            {media.fileName}
          </DialogTitle>
          <DialogDescription>
            {media._creationTime && (
              <span>
                Adicionado {formatDistanceToNow(new Date(media._creationTime), { 
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="py-4">
          <TabsList className="mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              <span>Visualização</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Informações</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className={transitionEffects.appear.fadeIn}>
            <div className={cn("bg-muted rounded-md overflow-hidden aspect-square", decorativeBackgrounds.gradient.subtle)}>
              {media.fileType.startsWith("image/") ? (
                <ConvexImage
                  src={media.url}
                  alt={media.description || media.fileName}
                  className="w-full h-full object-contain"
                  mediaId={media._id}
                  storageId={media.storageId}
                  fallbackText={media.fileName}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm font-mono">{media.fileType}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleDownload}
                className={cn("flex-1", buttonStyles.variant.gradient)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button 
                onClick={handleCopyUrl}
                variant="outline"
                className={cn("flex-1", buttonStyles.variant.outline)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar URL
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="info" className={transitionEffects.appear.fadeIn}>
            <div className="space-y-5">
              {media.description && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    Descrição
                  </h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {media.description}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Informações Técnicas</h4>
                <div className="space-y-2 bg-muted p-3 rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileType className="h-4 w-4" />
                      Tipo
                    </span>
                    <Badge variant="outline" className={badgeStyles.base}>{media.fileType}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      Tamanho
                    </span>
                    <Badge variant="outline" className={badgeStyles.base}>{formatFileSize(media.fileSize)}</Badge>
                  </div>
                  
                  {media.width && media.height && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Image className="h-4 w-4" />
                        Dimensões
                      </span>
                      <Badge variant="outline" className={badgeStyles.base}>{media.width} × {media.height}px</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      Visibilidade
                    </span>
                    <Badge 
                      variant={media.isPublic ? "secondary" : "outline"} 
                      className={cn(badgeStyles.base, media.isPublic ? badgeStyles.variant.secondary : badgeStyles.variant.outline)}
                    >
                      {media.isPublic ? "Pública" : "Privada"}
                    </Badge>
                  </div>
                  
                  {media.category && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        Categoria
                      </span>
                      <Badge variant="secondary" className={badgeStyles.variant.secondary}>{media.category}</Badge>
                    </div>
                  )}
                  
                  {media._creationTime && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Data de Upload
                      </span>
                      <span className="text-sm">
                        {new Date(media._creationTime).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {media.tags && media.tags.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {media.tags.map((tag) => (
                      <Badge key={tag} className={badgeStyles.base} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  URL do arquivo
                </h4>
                <div className="flex items-center justify-between rounded-md bg-muted p-2 text-xs">
                  <code className="truncate font-mono flex-1">{media.url}</code>
                  <Button
                    onClick={handleCopyUrl}
                    size="icon"
                    variant="ghost"
                    className={buttonStyles.size["icon-sm"]}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
