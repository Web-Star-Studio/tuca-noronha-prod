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
import { Plus, Loader2 } from "lucide-react"
import type { Id } from "@/../convex/_generated/dataModel"
import { AnimatePresence, motion } from "framer-motion"
import { buttonStyles, cardStyles, transitionEffects, typography } from "@/lib/ui-config"
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
    <div className={cn("container py-6 space-y-6", cardStyles.content.spacious)}>
      <motion.div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", typography.title.cool)}>
            Biblioteca de Mídia
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as imagens utilizadas no sistema
          </p>
        </div>
        
        <Button 
          onClick={() => setUploadDialogOpen(true)}
          className={buttonStyles.variant.gradient}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Mídia
        </Button>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <MediaFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          category={selectedCategory}
          setCategory={setSelectedCategory}
          filterIsPublic={filterIsPublic}
          setFilterIsPublic={setFilterIsPublic}
          fileTypes={selectedFileTypes}
          setFileTypes={setSelectedFileTypes}
          className={cn(cardStyles.base, "p-4")}
        />
      </motion.div>
      
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={cn("flex justify-center items-center py-12", transitionEffects.appear.fadeIn)}
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className={transitionEffects.appear.fadeInUp}
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
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className={typography.title.gradient}>Adicionar nova mídia</DialogTitle>
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
    </div>
  )
}
