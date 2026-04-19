import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-8 w-full rounded border border-panel-border bg-surface/50 px-3 py-1 text-sm text-text-primary placeholder:text-text-muted",
      "focus:outline-none focus:border-accent-cyan/60 focus:ring-1 focus:ring-accent-cyan/20",
      "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
