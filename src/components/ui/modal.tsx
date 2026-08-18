"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Lets ModalContent drive AnimatePresence from the Root's open state. */
const ModalOpenContext = React.createContext(false);

function Modal({
  open,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <ModalOpenContext.Provider value={!!open}>
      <DialogPrimitive.Root open={open} {...props} />
    </ModalOpenContext.Provider>
  );
}
const ModalClose = DialogPrimitive.Close;

function ModalContent({
  className,
  children,
  size = "md",
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  size?: "sm" | "md";
}) {
  const open = React.useContext(ModalOpenContext);
  const reducedMotion = useReducedMotion();
  return (
    <DialogPrimitive.Portal forceMount>
      <AnimatePresence>
        {open ? (
          <React.Fragment key="modal-content">
            <DialogPrimitive.Overlay
              forceMount
              className="fixed inset-0 z-50 bg-surface-overlay/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
            />
            <DialogPrimitive.Content
              forceMount
              asChild
              className={cn(
                "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] rounded-2xl border border-default bg-surface-4 p-6 text-primary shadow-modal",
                size === "sm" ? "max-w-sm" : "max-w-md",
                className
              )}
              {...props}
            >
              <motion.div
                initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ x: "-50%", y: "-50%" }}
              >
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </React.Fragment>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Portal>
  );
}

function ModalHeader({
  title,
  description,
  onClose
}: {
  title: string;
  description?: string;
  onClose?: () => void;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="space-y-1">
        <DialogPrimitive.Title className="text-base font-semibold text-accent-cream">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="text-xs text-secondary">
            {description}
          </DialogPrimitive.Description>
        )}
      </div>
      {onClose && (
        <DialogPrimitive.Close asChild>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex size-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-3 hover:text-primary focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-4"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function ModalBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

function ModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex justify-end gap-2", className)}
      {...props}
    />
  );
}

export { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose };
