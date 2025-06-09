"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  variant?: "default" | "info" | "success" | "warning" | "danger"
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  variant = "default",
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-variant={variant}
        sideOffset={sideOffset}
        className={cn(
          // Base styles
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance shadow-md",
          
          // Variant styles
          variant === "default" && "bg-white text-foreground border border-border",
          variant === "info" && "bg-blue-500/90 text-white dark:bg-blue-600/90",
          variant === "success" && "bg-emerald-500/90 text-white dark:bg-emerald-600/90",
          variant === "warning" && "bg-amber-500/90 text-white dark:bg-amber-600/90", 
          variant === "danger" && "bg-destructive/90 text-white dark:bg-destructive/90",
          
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow 
          className={cn(
            "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]",
            variant === "default" && "bg-white fill-white border border-border",
            variant === "info" && "bg-blue-500/90 fill-blue-500 dark:bg-blue-600/90 dark:fill-blue-600",
            variant === "success" && "bg-emerald-500/90 fill-emerald-500 dark:bg-emerald-600/90 dark:fill-emerald-600",
            variant === "warning" && "bg-amber-500/90 fill-amber-500 dark:bg-amber-600/90 dark:fill-amber-600",
            variant === "danger" && "bg-destructive/90 fill-destructive dark:bg-destructive/90 dark:fill-destructive"
          )} 
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
