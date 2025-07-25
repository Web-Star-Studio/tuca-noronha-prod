"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "Selecionar data",
  className 
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange(new Date(value));
    } else {
      onDateChange(undefined);
    }
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  return (
    <Input
      type="date"
      value={formatDateForInput(date)}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn("w-full", className)}
    />
  );
} 