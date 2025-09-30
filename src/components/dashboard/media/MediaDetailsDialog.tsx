"use client"

import type { Media } from "@/lib/services/mediaService"

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


import { SmartMedia } from "@/components/ui/smart-media"
import type { MediaEntry } from "@/lib/media"
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold truncate">
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
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 mb-4 grid grid-cols-2 w-full">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span>Visualização</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Informações</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="preview" className="space-y-4 mt-0">
                <div className="bg-muted rounded-lg overflow-hidden">
                  <div className="aspect-video w-full">
                    {media.fileType.startsWith("image/") || media.fileType.startsWith("video/") ? (
                      <SmartMedia
                        entry={{ url: media.url, type: media.fileType } as MediaEntry}
                        alt={media.description || media.fileName}
                        className="w-full h-full object-contain bg-black"
                        imageProps={{ fill: true, style: { objectFit: "contain" } }}
                        videoProps={{ controls: true, preload: "metadata" }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <div className="text-center">
                          <FileType className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm font-mono text-gray-600">{media.fileType}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    onClick={handleCopyUrl}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar URL
                  </Button>
                </div>
              </TabsContent>
          
              <TabsContent value="info" className="space-y-4 mt-0">
                {media.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      Descrição
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                      {media.description}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Informações Técnicas</h4>
                  <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <FileType className="h-4 w-4" />
                          Tipo
                        </span>
                        <Badge variant="outline">{media.fileType}</Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <HardDrive className="h-4 w-4" />
                          Tamanho
                        </span>
                        <Badge variant="outline">{formatFileSize(media.fileSize)}</Badge>
                      </div>
                      
                      {media.width && media.height && (
                        <div className="space-y-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Image className="h-4 w-4" />
                            Dimensões
                          </span>
                          <Badge variant="outline">{media.width} × {media.height}px</Badge>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          Visibilidade
                        </span>
                        <Badge variant={media.isPublic ? "secondary" : "outline"}>
                          {media.isPublic ? "Pública" : "Privada"}
                        </Badge>
                      </div>
                      
                      {media.category && (
                        <div className="space-y-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="h-4 w-4" />
                            Categoria
                          </span>
                          <Badge variant="secondary">{media.category}</Badge>
                        </div>
                      )}
                      
                      {media._creationTime && (
                        <div className="space-y-1">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Data de Upload
                          </span>
                          <span className="text-sm font-medium">
                            {new Date(media._creationTime).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {media.tags && media.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {media.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    URL do arquivo
                  </h4>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
                    <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
                      {media.url}
                    </code>
                    <Button
                      onClick={handleCopyUrl}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
