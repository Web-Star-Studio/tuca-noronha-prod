"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { MediaUploader } from "./MediaUploader"
import { useMedia } from "@/lib/services/mediaService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

 type MediaSelectorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  multiple?: boolean
  initialSelected?: string[]
  onSelect: (urls: string[]) => void
}

export function MediaSelector({ open, onOpenChange, multiple = false, initialSelected = [], onSelect }: MediaSelectorProps) {
  const { media, isLoading } = useMedia()
  const [selected, setSelected] = useState<string[]>(initialSelected)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 24
  const [showUploader, setShowUploader] = useState(false)

  // Reset selection when opening
  useEffect(() => {
    if (open) {
      setSelected([...initialSelected])
    }
  }, [open, initialSelected])

  const toggleSelect = (url: string) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      )
    } else {
      setSelected([url])
    }
  }

  const confirm = () => {
    if (selected.length === 0) {
      toast.error("Nenhuma imagem selecionada.")
      return
    }
    onSelect(selected)
    onOpenChange(false)
    setSelected([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Selecionar Mídia</DialogTitle>
        </DialogHeader>
        {showUploader ? (
          <div className="py-4">
            <MediaUploader onSuccess={() => setShowUploader(false)} />
          </div>
        ) : isLoading ? (
          <div className="py-10 text-center">Carregando...</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="border px-3 py-1 rounded w-1/2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowUploader(true)}>Upload</Button>
                <Button size="sm" onClick={() => setPage(page + 1)} disabled={!media || media.length <= page * pageSize}>
                  Mais
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {media
                ?.filter(item =>
                  !searchTerm ||
                  item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                  (item.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                  (item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) || false)
                )
                .slice(0, page * pageSize)
                .map((item) => (
                  <div
                    key={item._id}
                    className={cn(
                      "relative cursor-pointer rounded overflow-hidden border",
                      selected.includes(item.url)
                        ? "border-blue-500"
                        : "border-transparent"
                    )}
                    onClick={() => toggleSelect(item.url)}
                  >
                    <Image
                      src={item.url}
                      alt={item.fileName}
                      width={200}
                      height={200}
                      className="object-cover aspect-square"
                    />
                    {selected.includes(item.url) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-25 flex items-center justify-center">
                        <Check className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm}>Confirmar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}