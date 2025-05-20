import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonStyles } from "@/lib/ui-config"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-disabled:opacity-50 aria-disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: buttonStyles.variant.default,
        destructive: buttonStyles.variant.destructive,
        outline: buttonStyles.variant.outline,
        secondary: buttonStyles.variant.secondary,
        ghost: buttonStyles.variant.ghost,
        link: buttonStyles.variant.link,
        gradient: buttonStyles.variant.gradient,
        accent: buttonStyles.variant.accent,
        soft: buttonStyles.variant.soft,
        success: buttonStyles.variant.success,
        warning: buttonStyles.variant.warning,
      },
      size: {
        default: buttonStyles.size.default,
        sm: buttonStyles.size.sm,
        lg: buttonStyles.size.lg,
        xl: buttonStyles.size.xl,
        icon: buttonStyles.size.icon,
        "icon-sm": buttonStyles.size["icon-sm"],
        "icon-lg": buttonStyles.size["icon-lg"],
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        none: "rounded-none",
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  rounded,
  fullWidth,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, rounded, fullWidth, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }