import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date object to a readable string in Portuguese format
 */
export function formatDate(date: Date | number | string): string {
  // Options for formatting the date
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  
  // Convert to Date object if needed
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Return formatted date in PT-BR (Portuguese Brazil) format
  return dateObj.toLocaleDateString('pt-BR', options);
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
