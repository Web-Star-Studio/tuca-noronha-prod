import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date object to a readable string in Portuguese format
 */
/**
 * Convert different date inputs (string/number/Date) to a Date object without
 * applying unintended timezone offsets for date-only ISO strings.
 */
export function parseDateInput(date: Date | number | string): Date | null {
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof date === "number") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof date === "string") {
    const isoDate = date.split("T")[0];

    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [year, month, day] = isoDate.split("-").map(Number);
      const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function formatDate(date: Date | number | string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  const parsed = parseDateInput(date);
  if (!parsed) return "Data inválida";

  return parsed.toLocaleDateString("pt-BR", options);
}

/**
 * Format a number as currency in Brazilian Real (R$) format
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
