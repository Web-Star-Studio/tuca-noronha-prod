"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus,
  Search,
  Filter,
  Package,
  MapPin,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Star,
  Power
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { PackageForm } from "@/components/dashboard/packages/PackageForm"
import { PackageCard } from "@/components/dashboard/packages/PackageCard"
import { PackagesStats } from "@/components/dashboard/packages/PackagesStats"

export default function PackagesPage() {
  const { user } = useCurrentUser()
  
  // Convex hooks
  const packagesQuery = useQuery(api.packages.getPackages, { 
    filters: user?.role === "partner" ? { partnerId: user.id as Id<"users"> } : {}
  })
  const createPackage = useMutation(api.packages.createPackage)
  const updatePackage = useMutation(api.packages.updatePackage)
  const deletePackage = useMutation(api.packages.deletePackage)
  const toggleStatus = useMutation(api.packages.togglePackageStatus)
  const toggleFeatured = useMutation(api.packages.togglePackageFeatured)
  const duplicatePackage = useMutation(api.packages.duplicatePackage)
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for filtering and pagination
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const itemsPerPage = 6

  const packages = packagesQuery?.packages || []
  const isLoading = packagesQuery === undefined
  
  // Filter packages based on filter and search query
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      // Filter by status
      if (filter === "active" && !pkg.isActive) return false
      if (filter === "inactive" && pkg.isActive) return false
      if (filter === "featured" && !pkg.isFeatured) return false
      
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        return (
          pkg.name.toLowerCase().includes(searchLower) ||
          pkg.description.toLowerCase().includes(searchLower) ||
          pkg.category.toLowerCase().includes(searchLower) ||
          pkg.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }
      
      return true
    })
  }, [packages, filter, searchQuery])
  
  // Sort packages by creation date
  const sortedPackages = useMemo(() => {
    return [...filteredPackages].sort((a, b) => {
      return b._creationTime - a._creationTime
    })
  }, [filteredPackages])
  
  // Paginate packages
  const totalPages = Math.ceil(sortedPackages.length / itemsPerPage)
  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedPackages.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedPackages, currentPage])
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  
  // Handle package operations
  const handleCreatePackage = async (packageData: any) => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um pacote")
      return
    }
    
    try {
      setIsSubmitting(true)
      await createPackage({
        ...packageData,
        partnerId: user.id as Id<"users">
      })
      toast.success("Pacote criado com sucesso!")
      setDialogOpen(false)
      setSelectedPackage(null)
    } catch (error) {
      console.error("Erro ao criar pacote:", error)
      toast.error("Erro ao criar pacote")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleUpdatePackage = async (packageData: any) => {
    try {
      setIsSubmitting(true)
      await updatePackage({
        id: selectedPackage._id,
        ...packageData,
      })
      toast.success("Pacote atualizado com sucesso!")
      setDialogOpen(false)
      setSelectedPackage(null)
    } catch (error) {
      console.error("Erro ao atualizar pacote:", error)
      toast.error("Erro ao atualizar pacote")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeletePackage = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este pacote?")) {
      try {
        await deletePackage({ id: id as Id<"packages"> })
        toast.success("Pacote excluído com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir pacote:", error)
        toast.error("Erro ao excluir pacote")
      }
    }
  }
  
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await toggleStatus({ id: id as Id<"packages">, isActive })
      toast.success(isActive ? "Pacote ativado!" : "Pacote desativado!")
    } catch (error) {
      console.error("Erro ao alterar status do pacote:", error)
      toast.error("Erro ao alterar status")
    }
  }
  
  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await toggleFeatured({ id: id as Id<"packages">, isFeatured })
      toast.success(isFeatured ? "Pacote destacado!" : "Destaque removido!")
    } catch (error) {
      console.error("Erro ao alterar destaque do pacote:", error)
      toast.error("Erro ao alterar destaque")
    }
  }

  const handleDuplicate = async (pkg: any) => {
    try {
      const newName = `${pkg.name} - Cópia`
      const newSlug = `${pkg.slug}-copia-${Date.now()}`
      
      await duplicatePackage({
        id: pkg._id,
        newName,
        newSlug,
      })
      toast.success("Pacote duplicado com sucesso!")
    } catch (error) {
      console.error("Erro ao duplicar pacote:", error)
      toast.error("Erro ao duplicar pacote")
    }
  }
  
  // Dialog handlers
  const openCreateDialog = () => {
    setSelectedPackage(null)
    setDialogOpen(true)
  }
  
  const openEditDialog = (pkg: any) => {
    setSelectedPackage(pkg)
    setDialogOpen(true)
  }
  
  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedPackage(null)
  }
  
  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])
  
  return (
    <motion.div 
      className="relative space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50 pointer-events-none -z-10" />
      <div className="fixed top-1/4 right-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000 pointer-events-none -z-10" />

      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pacotes</h1>
              <p className="text-gray-600">Gerencie os pacotes de viagem</p>
            </div>
          </div>
          
          <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pacote
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <PackagesStats />

      {/* Filters and Search */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar pacotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "Todos", icon: Package },
              { key: "active", label: "Ativos", icon: Power },
              { key: "featured", label: "Destacados", icon: Star },
              { key: "inactive", label: "Inativos", icon: Eye },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(key)}
                className={filter === key ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mt-4">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredPackages.length === 0
            ? "Nenhum pacote encontrado"
            : `${filteredPackages.length} pacote${filteredPackages.length === 1 ? "" : "s"} encontrado${filteredPackages.length === 1 ? "" : "s"}`
          }
        </span>
        {totalPages > 1 && (
          <span>
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/70 rounded-xl p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Packages Grid */}
      {!isLoading && filteredPackages.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {paginatedPackages.map((pkg) => (
              <PackageCard
                key={pkg._id}
                package={pkg}
                onEdit={() => openEditDialog(pkg)}
                onDelete={() => handleDeletePackage(pkg._id)}
                onToggleStatus={(isActive) => handleToggleStatus(pkg._id, isActive)}
                onToggleFeatured={(isFeatured) => handleToggleFeatured(pkg._id, isFeatured)}
                onDuplicate={() => handleDuplicate(pkg)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty State */}
      {!isLoading && filteredPackages.length === 0 && (
        <motion.div 
          className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filter !== "all" ? "Nenhum pacote encontrado" : "Nenhum pacote criado"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filter !== "all" 
              ? "Tente ajustar seus filtros ou termo de busca" 
              : "Comece criando seu primeiro pacote de viagem"
            }
          </p>
          {(!searchQuery && filter === "all") && (
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Pacote
            </Button>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {page}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Package Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPackage ? "Editar Pacote" : "Novo Pacote"}
            </DialogTitle>
            <DialogDescription>
              {selectedPackage 
                ? "Atualize as informações do pacote" 
                : "Crie um novo pacote de viagem combinando hospedagens, atividades, restaurantes e eventos"
              }
            </DialogDescription>
          </DialogHeader>
          
          <PackageForm
            package={selectedPackage}
            onSubmit={selectedPackage ? handleUpdatePackage : handleCreatePackage}
            onCancel={closeDialog}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  )
} 