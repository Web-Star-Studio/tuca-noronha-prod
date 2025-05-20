import * as React from "react"
import { cn } from "@/lib/utils"
import { cardStyles } from "@/lib/ui-config"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "interactive" | "solid" | "outline";
    size?: "default" | "sm" | "lg";
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  // Variantes do card
  const variantStyles = {
    default: cardStyles.base,
    interactive: `${cardStyles.base} ${cardStyles.hover.default} cursor-pointer`,
    solid: "bg-secondary rounded-xl shadow transition-all duration-300 overflow-hidden",
    outline: "bg-white rounded-xl shadow-sm transition-all duration-300 overflow-hidden",
  }
  
  // Tamanhos do card
  const sizeStyles = {
    sm: "p-3",
    default: "p-5",
    lg: "p-6",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "default" | "sm" | "lg";
  }
>(({ className, size = "default", ...props }, ref) => {
  const sizeStyles = {
    sm: "space-y-1 px-0 pb-2",
    default: "space-y-1.5 px-0 pb-3",
    lg: "space-y-2 px-0 pb-4",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col", 
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "default" | "sm" | "lg";
  }
>(({ className, size = "default", ...props }, ref) => {
  const sizeStyles = {
    sm: "text-lg",
    default: "text-xl",
    lg: "text-2xl",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(cardStyles.content.default, className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    separator?: boolean;
  }
>(({ className, separator = false, ...props }, ref) => {
  const footerStyle = separator ? cardStyles.footer.separated : cardStyles.footer.flush
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between", 
        footerStyle,
        className
      )}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }