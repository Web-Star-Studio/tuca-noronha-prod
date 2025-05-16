"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"
import { formStyles } from "@/lib/ui-config"

function Switch({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  variant?: "default" | "primary" | "success";
}) {
  const variantStyles = {
    default: "",
    primary: "data-[state=checked]:bg-blue-600",
    success: "data-[state=checked]:bg-green-600",
  }

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        formStyles.switch.base,
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={formStyles.switch.thumb}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }