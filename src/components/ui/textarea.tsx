import * as React from "react"
import { cn } from "@/lib/utils"
import { formStyles } from "@/lib/ui-config"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  error?: string
}

function Textarea({ 
  className, 
  variant = "default", 
  size = "default",
  error,
  ...props 
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base styles from config
        formStyles.textarea.base,
        
        // Size variations
        size === "sm" && "min-h-12 px-2 py-1 text-xs",
        size === "default" && "min-h-16 px-3 py-2 text-sm",
        size === "lg" && "min-h-20 px-4 py-3 text-base",
        
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

export { Textarea }
