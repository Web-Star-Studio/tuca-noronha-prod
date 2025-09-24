"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { MediaUploader } from "./MediaUploader"
import { useMedia } from "@/lib/services/mediaService"
import type { Media } from "@/lib/services/mediaService"
import { SmartMedia } from "@/components/ui/smart-media"
import type { MediaEntry } from "@/lib/media"
import {
  Check,
  ImageIcon,
  Layers,
  Loader2,
  Plus,
  Search,
  Video,
} from "lucide-react"

type MediaSelectorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  multiple?: boolean
  initialSelected?: string[]
  onSelect: (urls: string[]) => void
  onSelectMedia?: (media: Media[]) => void
}

const PAGE_SIZE = 24

export function MediaSelector({
  open,
  onOpenChange,
  multiple = false,
  initialSelected = [],
  onSelect,
  onSelectMedia,
}: MediaSelectorProps) {
  const { media, isLoading } = useMedia()
  const [selected, setSelected] = useState<string[]>(initialSelected)
  const [searchTerm, setSearchTerm] = useState("")
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "video">("all")
  const [page, setPage] = useState(1)
  const [showUploader, setShowUploader] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null)

  const mediaByUrl = useMemo(() => {
    const map = new Map<string, Media>()
    media?.forEach((item) => {
      map.set(item.url, item)
    })
    return map
  }, [media])

  // Reset state when the dialog opens
  useEffect(() => {
    if (open) {
      setSelected(initialSelected)
      setSearchTerm("")
      setFileTypeFilter("all")
      setPage(1)
    }
  }, [open, initialSelected])

  const filteredMedia = useMemo(() => {
    if (!media) return []

    const normalizedQuery = searchTerm.trim().toLowerCase()

    return media.filter((item) => {
      const matchesType =
        fileTypeFilter === "all" || item.fileType.startsWith(`${fileTypeFilter}/`)

      if (!normalizedQuery) return matchesType

      const haystack = [
        item.fileName,
        item.description ?? "",
        item.category ?? "",
        ...(item.tags ?? []),
      ]

      const matchesSearch = haystack.some((entry) =>
        entry.toLowerCase().includes(normalizedQuery),
      )

      return matchesType && matchesSearch
    })
  }, [media, searchTerm, fileTypeFilter])

  const paginatedMedia = useMemo(
    () => filteredMedia.slice(0, page * PAGE_SIZE),
    [filteredMedia, page],
  )

  const selectedMedia = useMemo(
    () => (media ? media.filter((item) => selected.includes(item.url)) : []),
    [media, selected],
  )

  useEffect(() => {
    if (!open) {
      setPreviewMedia(null)
      return
    }

    const preferred = selectedMedia[selectedMedia.length - 1]
    if (preferred) {
      setPreviewMedia(preferred)
      return
    }

    setPreviewMedia(filteredMedia[0] ?? null)
  }, [open, filteredMedia, selectedMedia])

  const handleSelect = (item: Media) => {
    const url = item.url
    setPreviewMedia(item)

    if (multiple) {
      setSelected((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
      )
    } else {
      setSelected([url])
    }
  }

  const confirmSelection = () => {
    if (selected.length === 0) {
      toast.error("Nenhuma mídia selecionada.")
      return
    }

    onSelect(selected)
    if (onSelectMedia) {
      const resolvedMedia = selected
        .map((url) => mediaByUrl.get(url))
        .filter((item): item is Media => Boolean(item))
      onSelectMedia(resolvedMedia)
    }
    onOpenChange(false)
    setSelected([])
  }

  const renderMediaThumbnail = (item: Media) => {
    const entry: MediaEntry = { url: item.url, type: item.fileType };

    if (!item.fileType.startsWith("image/") && !item.fileType.startsWith("video/")) {
      return (
        <div className="flex h-full items-center justify-center bg-muted">
          <span className="text-xs font-mono text-muted-foreground">
            {item.fileType}
          </span>
        </div>
      )
    }

    return (
      <div className="relative h-full w-full">
        <SmartMedia
          entry={entry}
          alt={item.fileName}
          className="h-full w-full object-cover"
          imageProps={{ fill: true }}
          videoProps={{
            muted: true,
            loop: true,
            playsInline: true,
            preload: "metadata",
          }}
        />
      </div>
    )
  }

  const hasMore = paginatedMedia.length < filteredMedia.length
  const selectionLabel = multiple
    ? `${selected.length} arquivo${selected.length === 1 ? "" : "s"} selecionado${
        selected.length === 1 ? "" : "s"
      }`
    : selected.length === 1
    ? "1 arquivo selecionado"
    : "Nenhuma seleção"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-lg font-semibold">
            Biblioteca de mídia
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Busque, visualize e selecione imagens ou vídeos já enviados ou adicione novos arquivos.
          </p>
        </DialogHeader>

        {showUploader ? (
          <div className="py-4">
            <MediaUploader
              onSuccess={() => {
                setShowUploader(false)
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <div className="relative w-full md:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, categoria ou tag"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value)
                      setPage(1)
                    }}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {[
                    { value: "all" as const, label: "Todos", icon: Layers },
                    { value: "image" as const, label: "Imagens", icon: ImageIcon },
                    { value: "video" as const, label: "Vídeos", icon: Video },
                  ].map(({ value, label, icon: Icon }) => {
                    const isActive = fileTypeFilter === value
                    return (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "gap-2",
                          isActive ? "shadow-sm" : "",
                        )}
                        onClick={() => {
                          setFileTypeFilter(value)
                          setPage(1)
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="whitespace-nowrap px-3 py-1">
                  {selectionLabel}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowUploader(true)}
                >
                  <Plus className="h-4 w-4" />
                  Enviar mídia
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`media-selector-skeleton-${index}`}
                    className="h-40 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h4 className="text-base font-semibold">Nenhuma mídia encontrada</h4>
                  <p className="text-sm text-muted-foreground">
                    Ajuste sua busca ou faça upload de um novo arquivo.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => setShowUploader(true)}
                >
                  <Plus className="h-4 w-4" />
                  Fazer upload agora
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="flex min-h-[320px] flex-col gap-3">
                  <ScrollArea className="max-h-[55vh] rounded-lg border">
                    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
                      {paginatedMedia.map((item) => {
                        const isSelected = selected.includes(item.url)

                        return (
                          <button
                            key={item._id}
                            type="button"
                            className={cn(
                              "relative overflow-hidden rounded-md border text-left transition",
                              isSelected
                                ? "border-primary ring-2 ring-primary/40"
                                : "border-transparent hover:border-muted",
                            )}
                            onClick={() => handleSelect(item)}
                          >
                            <div className="aspect-square">
                              {renderMediaThumbnail(item)}
                            </div>

                            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/0 via-black/0 to-black/60 p-2 text-white">
                              <div className="flex items-start justify-between text-xs">
                                <span className="line-clamp-1 font-medium">
                                  {item.fileName}
                                </span>
                                {item.fileType.startsWith("video/") && (
                                  <Video className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                {item.category && (
                                  <span className="rounded-full bg-black/40 px-2 py-0.5">
                                    {item.category}
                                  </span>
                                )}
                                <span>
                                  {(Number(item.fileSize) / 1024 / 1024).toFixed(1)} MB
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-primary/80">
                                <Check className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center border-t bg-background p-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => setPage((prev) => prev + 1)}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Carregar mais
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div className="hidden min-h-[320px] flex-col gap-3 rounded-lg border bg-muted/30 p-5 md:flex">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Pré-visualização
                  </h4>
                  {previewMedia ? (
                    <div className="flex flex-1 flex-col gap-4">
                      <div className="relative aspect-video overflow-hidden rounded-md border bg-background">
                        {previewMedia.fileType.startsWith("image/") || previewMedia.fileType.startsWith("video/") ? (
                          <SmartMedia
                            entry={{ url: previewMedia.url, type: previewMedia.fileType }}
                            alt={previewMedia.description || previewMedia.fileName}
                            className="h-full w-full object-contain bg-black/80"
                            imageProps={{ fill: true, style: { objectFit: "contain" } }}
                            videoProps={{ controls: true, preload: "metadata" }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Pré-visualização não disponível
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{previewMedia.fileName}</p>
                            {previewMedia.description && (
                              <p className="text-muted-foreground">
                                {previewMedia.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">{previewMedia.fileType}</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {(Number(previewMedia.fileSize) / 1024 / 1024).toFixed(1)} MB
                          </span>
                          {previewMedia.category && (
                            <Badge variant="secondary">{previewMedia.category}</Badge>
                          )}
                          <Badge variant={previewMedia.isPublic ? "secondary" : "outline"}>
                            {previewMedia.isPublic ? "Pública" : "Privada"}
                          </Badge>
                        </div>

                        {previewMedia.tags && previewMedia.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {previewMedia.tags.map((tag) => (
                              <Badge key={`${previewMedia._id}-${tag}`} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Selecione um arquivo para visualizar as informações detalhadas.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:text-sm">
            {multiple
              ? "Você pode selecionar múltiplos arquivos; eles serão enviados na ordem escolhida."
              : "Somente um arquivo pode ser selecionado por vez."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSelection}>Confirmar seleção</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
