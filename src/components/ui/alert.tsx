import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-2.5 rounded-lg border-l-2 p-3 text-sm text-primary [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        error: "border-danger bg-danger-subtle [&_svg]:text-danger",
        success: "border-success bg-success-subtle [&_svg]:text-success",
        warning: "border-warning bg-warning-subtle [&_svg]:text-warning",
        info: "border-strong bg-surface-3 [&_svg]:text-secondary"
      }
    },
    defaultVariants: { variant: "info" }
  }
);

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  const Icon = icons[variant ?? "info"];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
