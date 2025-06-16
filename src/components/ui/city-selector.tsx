"use client"

import { useState, useEffect } from "react"
import { MapPin, Search, X, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BRAZILIAN_CITIES, BRAZILIAN_STATES, searchCities, getCitiesByState, type City } from "@/lib/constants/cities"

interface CitySelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CitySelector({ 
  value, 
  onValueChange, 
  placeholder = "Selecione uma cidade...",
  className,
  disabled = false
}: CitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState<string>("")
  const [filteredCities, setFilteredCities] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<City | null>(null)

  // Find selected city object
  useEffect(() => {
    if (value) {
      const city = BRAZILIAN_CITIES.find(c => `${c.name}, ${c.uf}` === value)
      setSelectedCity(city || null)
    } else {
      setSelectedCity(null)
    }
  }, [value])

  // Filter cities based on search query and selected state
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchCities(searchQuery)
      setFilteredCities(results)
    } else if (selectedState) {
      const results = getCitiesByState(selectedState)
      setFilteredCities(results)
    } else {
      // Show popular cities by default
      const popularCities = BRAZILIAN_CITIES.filter(city => 
        ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Brasília", 
         "Fortaleza", "Recife", "Porto Alegre", "Curitiba", "Manaus", 
         "Fernando de Noronha", "Florianópolis", "Natal", "João Pessoa"].includes(city.name)
      )
      setFilteredCities(popularCities)
    }
  }, [searchQuery, selectedState])

  const handleCitySelect = (city: City) => {
    const cityValue = `${city.name}, ${city.uf}`
    onValueChange(cityValue)
    setSelectedCity(city)
    setOpen(false)
    setSearchQuery("")
    setSelectedState("")
  }

  const clearSelection = () => {
    onValueChange("")
    setSelectedCity(null)
  }

  // Group cities by region for better organization
  const citiesByRegion = filteredCities.reduce((acc, city) => {
    if (!acc[city.region]) {
      acc[city.region] = []
    }
    acc[city.region].push(city)
    return acc
  }, {} as Record<string, City[]>)

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between text-left font-normal",
              !selectedCity && "text-muted-foreground",
              "hover:border-primary/50 focus:border-primary transition-colors"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              {selectedCity ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-medium">{selectedCity.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCity.uf}
                  </Badge>
                </div>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </div>
                         {selectedCity && !disabled && (
               <div
                 role="button"
                 tabIndex={0}
                 className="h-4 w-4 p-0 hover:bg-destructive/10 rounded cursor-pointer flex items-center justify-center transition-colors"
                 onClick={(e) => {
                   e.stopPropagation()
                   clearSelection()
                 }}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault()
                     e.stopPropagation()
                     clearSelection()
                   }
                 }}
                 aria-label="Limpar seleção"
               >
                 <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
               </div>
             )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {/* Search Header */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cidade ou estado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-400"
                  />
                </div>
                
                {/* State Filter */}
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Filtrar por estado:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={selectedState === "" ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setSelectedState("")}
                    >
                      Todos
                    </Button>
                    {BRAZILIAN_STATES.slice(0, 6).map((state) => (
                      <Button
                        key={state.uf}
                        variant={selectedState === state.name ? "default" : "outline"}
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setSelectedState(state.name)}
                      >
                        {state.uf}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cities List */}
              <div className="max-h-80 overflow-y-auto">
                {searchQuery.length === 0 && selectedState === "" && (
                  <div className="p-3 border-b bg-yellow-50">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <span>⭐</span>
                      <span className="font-medium">Destinos Populares</span>
                    </div>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {Object.entries(citiesByRegion).map(([region, cities]) => (
                    <motion.div
                      key={region}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {searchQuery.length >= 2 && (
                        <div className="px-4 py-2 bg-gray-50 border-b">
                          <div className="text-xs font-medium text-gray-600">
                            {region}
                          </div>
                        </div>
                      )}
                      
                      {cities.map((city) => (
                        <motion.button
                          key={`${city.name}-${city.uf}`}
                          className={cn(
                            "w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0",
                            selectedCity?.name === city.name && selectedCity?.uf === city.uf && "bg-blue-50"
                          )}
                          onClick={() => handleCitySelect(city)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {city.uf}
                              </span>
                            </div>
                            <div className="text-left min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {city.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {city.state} • {city.region}
                              </div>
                            </div>
                          </div>
                          
                          {selectedCity?.name === city.name && selectedCity?.uf === city.uf && (
                            <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredCities.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">
                      {searchQuery.length >= 2
                        ? "Nenhuma cidade encontrada"
                        : "Digite pelo menos 2 caracteres para buscar"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
} 