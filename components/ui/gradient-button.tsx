"use client"

import * as React from "react"

import { Slot } from "@radix-ui/react-slot"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
  [
    "gradient-button",
    "inline-flex items-center justify-center",
    "rounded-full min-w-[140px] sm:min-w-[140px] px-4 py-2 sm:px-8 sm:py-3.5",
    "text-xs sm:text-sm leading-tight sm:leading-[19px] font-light tracking-tight whitespace-nowrap",
    "font-sans",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: "text-black",
        secondary: "gradient-button-secondary text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants }

