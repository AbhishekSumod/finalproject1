import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all ease-in-out duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-neutral-300", 
  {
    variants: {
      variant: {
        default: 
          "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:scale-105 hover:shadow-xl hover:opacity-90 active:scale-100 active:opacity-100 dark:bg-gradient-to-r dark:from-blue-700 dark:to-purple-800 dark:text-white dark:hover:scale-105 dark:hover:shadow-xl dark:hover:opacity-90",
        destructive: 
          "bg-red-500 text-white shadow-lg hover:scale-105 hover:shadow-xl hover:opacity-90 active:scale-100 active:opacity-100 dark:bg-red-600 dark:text-white dark:hover:scale-105 dark:hover:shadow-xl dark:hover:opacity-90",
        outline: 
          "border-2 border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        secondary: 
          "bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700",
        ghost: 
          "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        link: 
          "text-blue-500 underline-offset-4 hover:underline dark:text-blue-300",
      },
      size: {
        default: "h-12 px-8 text-lg",
        sm: "h-8 px-4 text-sm",
        lg: "h-14 px-10 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
