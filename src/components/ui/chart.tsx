"use client"

import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const chartVariants = cva("", {
  variants: {
    variant: {
      default: "text-primary",
      secondary: "text-secondary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface ChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chartVariants> {
  config?: Record<string, { label: string; color: string }>
}

const ChartContext = React.createContext<ChartProps>({})

const ChartContainer = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ className, variant, config, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ variant, config }}>
        <div
          ref={ref}
          className={cn(chartVariants({ variant }), className)}
          {...props}
        />
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute rounded-lg border bg-background px-3 py-2 text-sm shadow-md",
      className
    )}
    {...props}
  />
))
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    payload?: Array<{ name: string; value: number }>
    label?: string
    hideLabel?: boolean
  }
>(({ className, payload, label, hideLabel = false, ...props }, ref) => {
  const { config } = React.useContext(ChartContext)

  if (!payload?.length) {
    return null
  }

  return (
    <div ref={ref} className={cn("space-y-1", className)} {...props}>
      {!hideLabel && <p className="font-medium">{label}</p>}
      {payload.map((item, index) => (
        <div key={index} className="flex items-center">
          <div
            className="mr-2 h-2 w-2 rounded-full"
            style={{
              backgroundColor: config?.[item.name]?.color ?? "currentColor",
            }}
          />
          <span className="font-medium">{config?.[item.name]?.label ?? item.name}:</span>
          <span className="ml-1">{item.value}</span>
        </div>
      ))}
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }

