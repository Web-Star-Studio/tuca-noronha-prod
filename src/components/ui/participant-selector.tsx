"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserIcon, Baby } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParticipantSelectorProps {
  adults: number
  childrenCount: number
  onAdultsChange: (adults: number) => void
  onChildrenChange: (children: number) => void
  minAdults?: number
  maxAdults?: number
  maxChildren?: number
  minTotal?: number
  maxTotal?: number
  className?: string
  title?: string
  description?: string
  showSummary?: boolean
  showLimits?: boolean
}

export function ParticipantSelector({
  adults,
  childrenCount,
  onAdultsChange,
  onChildrenChange,
  minAdults = 1,
  maxAdults = 20,
  maxChildren = 10,
  minTotal,
  maxTotal,
  className,
  title = "Número de Participantes",
  description = "Crianças até 5 anos podem ter preços diferenciados ou gratuitos",
  showSummary = true,
  showLimits = true,
}: ParticipantSelectorProps) {
  const totalParticipants = adults + childrenCount

  const canDecreaseAdults = adults > minAdults && (!minTotal || totalParticipants > minTotal)
  const canIncreaseAdults = adults < maxAdults && (!maxTotal || totalParticipants < maxTotal)
  const canDecreaseChildren = childrenCount > 0
  const canIncreaseChildren = childrenCount < maxChildren && (!maxTotal || totalParticipants < maxTotal)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          {title}
        </Label>
        {description && (
          <p className="text-xs text-gray-500">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <UserIcon className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Adultos</p>
            <p className="text-xs text-gray-500">A partir de 6 anos</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onAdultsChange(adults - 1)}
            disabled={!canDecreaseAdults}
          >
            -
          </Button>
          <div className="flex items-center justify-center w-8 h-8 border rounded-md bg-white">
            <span className="text-sm font-medium">{adults}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onAdultsChange(adults + 1)}
            disabled={!canIncreaseAdults}
          >
            +
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
        <div className="flex items-center space-x-2">
          <Baby className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Crianças</p>
            <p className="text-xs text-gray-500">Até 5 anos de idade</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChildrenChange(childrenCount - 1)}
            disabled={!canDecreaseChildren}
          >
            -
          </Button>
          <div className="flex items-center justify-center w-8 h-8 border rounded-md bg-white">
            <span className="text-sm font-medium">{childrenCount}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChildrenChange(childrenCount + 1)}
            disabled={!canIncreaseChildren}
          >
            +
          </Button>
        </div>
      </div>

      {showSummary && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total de participantes:</span>
          <span className="font-semibold text-gray-900">{totalParticipants}</span>
        </div>
      )}

      {showLimits && (minTotal || maxTotal) && (
        <p className="text-xs text-gray-500">
          {minTotal && maxTotal
            ? `Mín: ${minTotal} | Máx: ${maxTotal} participantes`
            : minTotal
            ? `Mínimo: ${minTotal} participantes`
            : maxTotal
            ? `Máximo: ${maxTotal} participantes`
            : ""}
        </p>
      )}
    </div>
  )
}
