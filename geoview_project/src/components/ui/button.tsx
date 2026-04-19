import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-cyan disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default:  "bg-accent-cyan text-surface hover:bg-accent-cyan/90",
        ghost:    "text-text-secondary hover:bg-panel-hover hover:text-text-primary",
        outline:  "border border-panel-border bg-transparent text-text-secondary hover:bg-panel-hover hover:text-text-primary",
        danger:   "bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20",
        active:   "bg-panel-hover border border-accent-cyan/30 text-accent-cyan",
      },
      size: {
        sm:   "h-7 px-2.5 text-xs",
        md:   "h-8 px-3 text-sm",
        lg:   "h-9 px-4 text-sm",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
