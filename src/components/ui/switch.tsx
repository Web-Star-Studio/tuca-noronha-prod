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
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300",
    primary: "data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300",
    success: "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300",
    warning: "data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-300",
    danger: "data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-300",
  }

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block h-5 w-5 rounded-full bg-white ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 shadow-sm"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }