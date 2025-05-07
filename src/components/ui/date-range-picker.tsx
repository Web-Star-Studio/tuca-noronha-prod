"use client"

import * as React from "react"
import { format, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import {DateRange} from 'react-day-picker'
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export type DateRangePickerProps = {
  dateRange: DateRange | undefined
  onDateRangeChange: (dateRange: DateRange | undefined) => void
  className?: string
  align?: "center" | "start" | "end"
  placeholder?: string
  disabled?: boolean
  minimumStay?: number
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = "center",
  placeholder = "Selecione as datas",
  disabled = false,
  minimumStay = 1,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const disabledDays = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { before: today };
  }, []);
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from || new Date()}
            selected={dateRange}
            onSelect={(range: DateRange | undefined) => {
              onDateRangeChange(range);
              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            disabled={(date: Date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return isBefore(date, today);
            }}
            locale={ptBR}
            classNames={{
              day_selected: "bg-blue-600 text-white",
              day_range_start: "bg-blue-600 text-white rounded-l-full",
              day_range_end: "bg-blue-600 text-white rounded-r-full",
              day_range_middle: "bg-blue-100",
            }}
            modifiers={{
              disabled: disabledDays
            }}
            footer={
              <div className="p-3 border-t text-center text-sm text-gray-500">
                Estadia mínima: {minimumStay} noite{minimumStay !== 1 ? 's' : ''}
              </div>
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
