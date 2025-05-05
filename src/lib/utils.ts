import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date object to a readable string in Portuguese format
 */
export function formatDate(date: Date): string {
  // Options for formatting the date
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  
  // Return formatted date in PT-BR (Portuguese Brazil) format
  return date.toLocaleDateString('pt-BR', options);
}
