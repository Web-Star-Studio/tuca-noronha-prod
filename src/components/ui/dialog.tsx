"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: "sm" | "default" | "lg" | "xl" | "full"
  variant?: "default" | "destructive"
}

function DialogContent({
  className,
  children,
  size = "default",
  variant = "default",
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-size={size}
        data-variant={variant}
        className={cn(
          // Base styles - sempre com background branco por padrão
          "bg-white border border-border fixed top-[50%] left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg p-6 shadow-md duration-200 overflow-y-auto max-h-[calc(100vh-4rem)]",
          
          // Animation
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          
          // Size variants
          size === "sm" && "w-full max-w-sm",
          size === "default" && "w-full max-w-lg", 
          size === "lg" && "w-full max-w-2xl",
          size === "xl" && "w-full max-w-4xl",
          size === "full" && "w-[calc(100%-2rem)] h-[calc(100%-2rem)]",
          
          // Color variants
          variant === "destructive" && "shadow-destructive/10",
          
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close 
          className={cn(
            "absolute top-4 right-4 rounded-full w-8 h-8 inline-flex items-center justify-center opacity-70 transition-all",
            "hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          )}
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
