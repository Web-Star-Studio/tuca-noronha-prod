import * as React from "react"
import { cn } from "@/lib/utils"
import { formStyles } from "@/lib/ui-config"

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  error?: string
}

function Input({ 
  className, 
  type, 
  variant = "default", 
  size = "default",
  error,
  ...props 
}: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base styles from config
        formStyles.input.base,
        
        // Size variations
        size === "sm" && "h-8 px-2 py-1 text-xs",
        size === "default" && "h-9 px-3 py-1 text-sm",
        size === "lg" && "h-10 px-4 py-2 text-base",
        
        // Variant styles
        variant === "outline" && "shadow-none border border-input",
        variant === "ghost" && "shadow-none hover:bg-accent",
        
        // Focus and validation states
        "focus-visible:border-ring",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        error && "border-destructive ring-destructive/20",
        
        className
      )}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  )
}

export { Input }
