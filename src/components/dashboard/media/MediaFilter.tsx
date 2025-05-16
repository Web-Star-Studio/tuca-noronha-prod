"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { buttonStyles, formStyles, badgeStyles, cardStyles, transitionEffects } from "@/lib/ui-config"

// Media categories
const MEDIA_CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "restaurant", label: "Restaurantes" },
  { value: "activity", label: "Atividades" },
  { value: "event", label: "Eventos" },
  { value: "hero", label: "Banner Principal" },
  { value: "general", label: "Geral" },
]

// Media types
const MEDIA_TYPES = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/gif", label: "GIF" },
  { value: "image/svg+xml", label: "SVG" },
]

type MediaFilterProps = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  category: string
  setCategory: (category: string) => void
  filterIsPublic: boolean | null
  setFilterIsPublic: (isPublic: boolean | null) => void
  fileTypes: string[]
  setFileTypes: (types: string[]) => void
  className?: string
}

export function MediaFilter({
  searchQuery,
  setSearchQuery,
  category,
  setCategory,
  filterIsPublic,
  setFilterIsPublic,
  fileTypes,
  setFileTypes,
  className,
}: MediaFilterProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  
  // Handle fileType toggle
  const handleFileTypeToggle = (type: string) => {
    if (fileTypes.includes(type)) {
      setFileTypes(fileTypes.filter(t => t !== type))
    } else {
      setFileTypes([...fileTypes, type])
    }
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setCategory("all")
    setFilterIsPublic(null)
    setFileTypes([])
  }
  
  // Count active filters
  const activeFilterCount = [
    searchQuery ? 1 : 0,
    category !== "all" ? 1 : 0,
    filterIsPublic !== null ? 1 : 0,
    fileTypes.length > 0 ? 1 : 0
  ].reduce((a, b) => a + b, 0)
  
  return (
    <div className={cn("flex flex-col md:flex-row gap-3 md:items-center", className, transitionEffects.appear.fadeIn)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nome, descrição ou tags..."
          className={cn("pl-9", formStyles.input.base)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpar busca</span>
          </Button>
        )}
      </div>
      
      {/* Desktop Filters */}
      <div className="hidden md:flex gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className={cn("w-[180px]", formStyles.select.trigger)}>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className={formStyles.select.content}>
            {MEDIA_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={filterIsPublic === null ? "all" : filterIsPublic ? "public" : "private"}
          onValueChange={(value) => {
            if (value === "all") setFilterIsPublic(null)
            else if (value === "public") setFilterIsPublic(true)
            else setFilterIsPublic(false)
          }}
        >
          <SelectTrigger className={cn("w-[140px]", formStyles.select.trigger)}>
            <SelectValue placeholder="Visibilidade" />
          </SelectTrigger>
          <SelectContent className={formStyles.select.content}>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="public">Público</SelectItem>
            <SelectItem value="private">Privado</SelectItem>
          </SelectContent>
        </Select>
        
        {activeFilterCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className={buttonStyles.variant.outline}
          >
            Limpar filtros
            <Badge variant="secondary" className={cn("ml-2", badgeStyles.variant.secondary)}>
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>
      
      {/* Mobile Filter Button */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className={cn("md:hidden", buttonStyles.variant.soft)}
            onClick={() => setMobileFilterOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className={cn("ml-2", badgeStyles.variant.secondary)}>
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className={cardStyles.base}>
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Ajuste os filtros para encontrar as mídias que você procura
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={formStyles.select.trigger}>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className={formStyles.select.content}>
                  {MEDIA_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <Select 
                value={filterIsPublic === null ? "all" : filterIsPublic ? "public" : "private"}
                onValueChange={(value) => {
                  if (value === "all") setFilterIsPublic(null)
                  else if (value === "public") setFilterIsPublic(true)
                  else setFilterIsPublic(false)
                }}
              >
                <SelectTrigger className={formStyles.select.trigger}>
                  <SelectValue placeholder="Visibilidade" />
                </SelectTrigger>
                <SelectContent className={formStyles.select.content}>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label>Tipos de arquivo</Label>
              <div className="grid grid-cols-2 gap-2">
                {MEDIA_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type.value}`}
                      checked={fileTypes.includes(type.value)}
                      onCheckedChange={() => handleFileTypeToggle(type.value)}
                    />
                    <Label htmlFor={`type-${type.value}`}>{type.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <SheetFooter className="flex flex-col gap-2 sm:gap-0">
              <Button 
                onClick={resetFilters} 
                variant="outline"
                className={buttonStyles.variant.outline}
              >
                Limpar todos os filtros
              </Button>
              
              <Button 
                onClick={() => setMobileFilterOpen(false)}
                className={buttonStyles.variant.gradient}
              >
                Aplicar filtros
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
