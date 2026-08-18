"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(
        "flex h-9 w-full rounded-lg border border-default bg-surface-3 px-3 text-sm text-primary transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:border-strong focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-danger",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export interface FieldProps {
  label: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, error, htmlFor, className, children }: FieldProps) {
  const id = React.useId();
  const fieldId = htmlFor ?? id;
  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-xs font-medium text-secondary"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export { Input };
