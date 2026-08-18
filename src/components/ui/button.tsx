"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./loading";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-gold font-semibold text-inverse shadow-1 hover:bg-accent-gold-hover hover:shadow-2",
        secondary:
          "border border-default bg-surface-3 text-primary hover:bg-surface-4",
        ghost: "text-secondary hover:bg-surface-3 hover:text-primary",
        danger: "bg-danger text-white hover:opacity-90",
        link: "h-auto rounded p-0 text-accent-gold underline underline-offset-2 hover:text-accent-gold-hover"
      },
      size: {
        sm: "h-7 rounded-md px-3 text-xs",
        md: "h-9 rounded-lg px-4 text-sm",
        lg: "h-10 rounded-lg px-5 text-sm",
        icon: "size-8 rounded-lg"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        loading && "opacity-70",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4 text-current" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
