"use client"

import { useState, useMemo } from "react"
import { useMedia, useDeleteMedia } from "@/lib/services/mediaService"
import type { Media } from "@/lib/services/mediaService"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  MediaUploader, 
  MediaGrid, 
  MediaFilter,
  MediaEditDialog
} from "@/components/dashboard/media"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Image, Filter, Search } from "lucide-react"
import type { Id } from "@/../convex/_generated/dataModel"
import { AnimatePresence, motion } from "framer-motion"
import { ui } from "@/lib/ui-config"
import { cn } from "@/lib/utils"

export default function MediaPage() {
  const { media, isLoading } = useMedia()
  const deleteMedia = useDeleteMedia()
  const { user } = useCurrentUser()
  
  // State for dialogs
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [filterIsPublic, setFilterIsPublic] = useState<boolean | null>(null)
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([])
  
  // Filter media based on filters
  const filteredMedia = useMemo(() => {
    if (!media) return []
    
    return media.filter(item => {
      // Filter by search query
      const matchesSearch = 
        searchQuery === "" || 
        item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) || false)
      
      // Filter by category
      const matchesCategory = 
        selectedCategory === "all" || 
        item.category === selectedCategory
      
      // Filter by visibility
      const matchesVisibility = 
        filterIsPublic === null || 
        item.isPublic === filterIsPublic
      
      // Filter by file type
      const matchesFileType = 
        selectedFileTypes.length === 0 || 
        selectedFileTypes.includes(item.fileType)
      
      return matchesSearch && matchesCategory && matchesVisibility && matchesFileType
    })
  }, [media, searchQuery, selectedCategory, filterIsPublic, selectedFileTypes])
  
  // Sort media by most recent
  const sortedMedia = useMemo(() => {
    return [...filteredMedia].sort((a, b) => {
      if (!a._creationTime || !b._creationTime) return 0
      return b._creationTime - a._creationTime
    })
  }, [filteredMedia])
  
  // Handle media operations
  const handleUploadSuccess = () => {
    setUploadDialogOpen(false)
    toast.success("Mídia enviada com sucesso!")
  }
  
  const handleEditMedia = (media: Media) => {
    setSelectedMedia(media)
    setEditDialogOpen(true)
  }
  
  const handleDeleteMedia = async (id: Id<"media">) => {
    if (!window.confirm("Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.")) {
      return
    }
    
    try {
      setIsDeleting(true)
      await deleteMedia(id)
      toast.success("Mídia excluída com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir mídia:", error)
      toast.error("Erro ao excluir mídia")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <Image className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className={`${ui.typography.h1.className} ${ui.colors.text.primary}`}>
              Biblioteca de Mídia
            </h1>
            <p className={`${ui.colors.text.secondary} text-sm leading-relaxed`}>
              Gerencie imagens, arquivos e recursos visuais do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{media?.length || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Image className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Filtradas</p>
                <p className="text-2xl font-bold text-purple-600">{filteredMedia.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Públicas</p>
                <p className="text-2xl font-bold text-green-600">
                  {media?.filter(m => m.isPublic).length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Filter className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Categorias</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(media?.filter(m => m.category).map(m => m.category)).size || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Filter className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Filtros e Pesquisa</h3>
              <p className="text-sm text-muted-foreground">
                Use os filtros abaixo para encontrar arquivos específicos
              </p>
            </div>
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Mídia
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <MediaFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            category={selectedCategory}
            setCategory={setSelectedCategory}
            filterIsPublic={filterIsPublic}
            setFilterIsPublic={setFilterIsPublic}
            fileTypes={selectedFileTypes}
            setFileTypes={setSelectedFileTypes}
          />
        </CardContent>
      </Card>
      
      {/* Media Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex justify-center items-center py-12"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <MediaGrid
              media={sortedMedia}
              onDelete={handleDeleteMedia}
              onEdit={handleEditMedia}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Adicionar nova mídia
            </DialogTitle>
          </DialogHeader>
          <MediaUploader onSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <MediaEditDialog
        media={selectedMedia}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setSelectedMedia(null)
          setEditDialogOpen(false)
        }}
      />
    </motion.div>
  )
}
