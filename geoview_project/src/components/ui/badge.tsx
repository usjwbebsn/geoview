import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "cyan" | "green" | "amber" | "red" | "muted";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "bg-panel-hover text-text-secondary border-panel-border",
    cyan:    "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20",
    green:   "bg-accent-green/10 text-accent-green border-accent-green/20",
    amber:   "bg-accent-amber/10 text-accent-amber border-accent-amber/20",
    red:     "bg-accent-red/10 text-accent-red border-accent-red/20",
    muted:   "bg-transparent text-text-muted border-panel-border",
  };
  return (
    <span
      className={cn(
        "badge border",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
