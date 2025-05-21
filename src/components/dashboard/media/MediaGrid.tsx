"use client"

import { useState } from "react"
import type { Media } from "@/lib/services/mediaService"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Pencil, Trash2, Eye, Copy, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { MediaDetailsDialog } from "@/components/dashboard/media/MediaDetailsDialog"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { cardStyles, buttonStyles, badgeStyles } from "@/lib/ui-config"
import { ConvexImage } from "@/components/ui/convex-image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type MediaGridProps = {
  media: Media[]
  onDelete: (id: Id<"media">) => void
  onEdit: (media: Media) => void
  isLoading?: boolean
  className?: string
}

export function MediaGrid({ media, onDelete, onEdit, isLoading, className }: MediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null)

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copiada para a área de transferência")
  }

  const formatFileSize = (bytes: number | bigint): string => {
    const kb = Number(bytes) / 1024
    
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`
    }
    
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return null // Will show the image itself
    }
    
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <span className="text-xs font-mono">{fileType}</span>
      </div>
    )
  }

  const showDetails = (media: Media) => {
    setSelectedMedia(media)
    setDetailsOpen(true)
  }

  const confirmDelete = (media: Media) => {
    setMediaToDelete(media)
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (mediaToDelete) {
      onDelete(mediaToDelete._id)
      setDeleteDialogOpen(false)
      setMediaToDelete(null)
      toast.success("Mídia excluída com sucesso")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-2 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`loading-placeholder-${i}`} className="bg-muted rounded-lg h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto"
            aria-hidden="true"
          >
            <path d="M21 11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" />
            <path d="m12 12 4-4" />
            <path d="M17 3v4" />
            <path d="M21 7h-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">Nenhuma mídia encontrada</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload de imagens para começar a criar sua biblioteca de mídia.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        <AnimatePresence>
          {media.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn("overflow-hidden group h-full flex flex-col", cardStyles.base, cardStyles.hover.scale)}>
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {item.fileType.startsWith("image/") ? (
                    <ConvexImage
                      src={item.url}
                      alt={item.description || item.fileName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      mediaId={item._id}
                      storageId={item.storageId}
                      fallbackText={item.fileName}
                    />
                  ) : (
                    getFileIcon(item.fileType)
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      onClick={() => showDetails(item)}
                      size="icon"
                      variant="secondary"
                      className={buttonStyles.size["icon-sm"]}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleCopyUrl(item.url)}
                      size="icon"
                      variant="secondary"
                      className={buttonStyles.size["icon-sm"]}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => onEdit(item)}
                      size="icon"
                      variant="secondary"
                      className={buttonStyles.size["icon-sm"]}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => confirmDelete(item)}
                      size="icon"
                      variant="destructive"
                      className={buttonStyles.size["icon-sm"]}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className={cn("flex-grow", cardStyles.content.compact)}>
                  <h3 className="font-medium truncate" title={item.fileName}>
                    {item.fileName}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </CardContent>
                
                <CardFooter className={cn("flex justify-between items-center", cardStyles.footer.default)}>
                  <div className="flex flex-wrap gap-1">
                    {item.category && (
                      <Badge className={badgeStyles.base} variant="outline">{item.category}</Badge>
                    )}
                    {item.isPublic ? (
                      <Badge className={badgeStyles.base} variant="secondary">Público</Badge>
                    ) : (
                      <Badge className={badgeStyles.base} variant="outline">Privado</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(item.fileSize)}
                    </span>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(item);
                      }}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Dialog de detalhes da mídia */}
      <MediaDetailsDialog
        media={selectedMedia}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      
      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {mediaToDelete && (
            <div className="flex items-center gap-3 my-2 p-3 bg-muted rounded-md">
              {mediaToDelete.fileType.startsWith("image/") ? (
                <div className="h-14 w-14 rounded overflow-hidden flex-shrink-0">
                  <ConvexImage
                    src={mediaToDelete.url}
                    alt={mediaToDelete.description || mediaToDelete.fileName}
                    className="w-full h-full object-cover"
                    mediaId={mediaToDelete._id}
                    storageId={mediaToDelete.storageId}
                    fallbackText={mediaToDelete.fileName}
                  />
                </div>
              ) : (
                <div className="h-14 w-14 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-mono">{mediaToDelete.fileType.split('/')[1]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{mediaToDelete.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(mediaToDelete.fileSize)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-gray-500 text-white hover:bg-gray-600 transition-colors hover:cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-800 text-white hover:bg-red-500 transition-colors hover:cursor-pointer"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
