"use client"

import { useState, useRef } from "react"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useUploadMedia } from "@/lib/services/mediaService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Check, Upload, X } from "lucide-react"
import { buttonStyles } from "@/lib/ui-config"

const MEDIA_CATEGORIES = [
  { value: "restaurant", label: "Restaurantes" },
  { value: "activity", label: "Atividades" },
  { value: "event", label: "Eventos" },
  { value: "hero", label: "Banner Principal" },
  { value: "general", label: "Geral" },
]

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]

export function MediaUploader({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useCurrentUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMedia = useUploadMedia()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("general")
  const [isPublic, setIsPublic] = useState(true)
  const [tags, setTags] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // File selection handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error("Tipo de arquivo não suportado. Por favor, selecione uma imagem válida.")
        return
      }
      
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error("Tipo de arquivo não suportado. Por favor, selecione uma imagem válida.")
        return
      }
      
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Você precisa estar logado para fazer upload de mídia")
      return
    }
    
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo para upload")
      return
    }
    
    try {
      setUploading(true)
      
      await uploadMedia({
        file: selectedFile,
        description,
        category,
        isPublic,
        tags: tags ? tags.split(",").map(tag => tag.trim()) : undefined,
      })
      
      // Reset form
      setSelectedFile(null)
      setFilePreview(null)
      setDescription("")
      setTags("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      toast.success("Arquivo enviado com sucesso!")
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast.error("Erro ao fazer upload do arquivo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Drop Area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          filePreview ? "border-success" : ""
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {filePreview ? (
          <div className="relative">
            <img 
              src={filePreview} 
              alt="Preview" 
              className="h-48 max-w-full mx-auto object-contain rounded-md" 
            />
            <div className="flex justify-center mt-2">
              <div className="flex items-center text-sm text-green-600">
                <Check className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  {selectedFile?.name} ({selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0}MB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("ml-2", buttonStyles.size["icon-sm"])}
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelectedFile()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Arraste uma imagem ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP, GIF ou SVG (máx. 10MB)
            </p>
          </div>
        )}
      </div>
      
      {/* File Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="restaurante, praia, evento..."
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da imagem..."
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="public" 
          checked={isPublic} 
          onCheckedChange={setIsPublic}
        />
        <Label htmlFor="public">Disponível publicamente</Label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        variant="default"
        disabled={!selectedFile || uploading}
      >
        {uploading ? "Enviando..." : "Fazer Upload"}
      </Button>
    </form>
  )
}
