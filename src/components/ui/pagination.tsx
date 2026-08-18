"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { MoreHorizontal as MoreHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Pagination({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav aria-label="pagination" className={className} {...props} />
  );
}

export function PaginationContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex items-center gap-1", className)} {...props} />
  );
}

export function PaginationItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={className} {...props} />;
}

export interface PaginationLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  asChild?: boolean;
}

export const PaginationLink = React.forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(function PaginationLink(
  { className, isActive, asChild, children, ...props },
  ref
) {
  const classes = cn(
    "tabular-nums",
    isActive && "border border-accent-gold bg-accent-gold-subtle text-accent-cream",
    className
  );

  if (asChild) {
    return (
      <Slot className={classes} ref={ref} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={classes}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
    </Button>
  );
});
PaginationLink.displayName = "PaginationLink";

export function PaginationEllipsis({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("flex items-center text-muted", className)}
      {...props}
    >
      <MoreHorizontalIcon className="text-muted size-4" aria-hidden="true" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
