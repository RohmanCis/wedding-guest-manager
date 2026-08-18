import type { Variants } from "motion/react";

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" }
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: "easeOut" } }
};

/** pageVariants with motion zeroed out when the user prefers reduced motion. */
export function getVariants(reducedMotion: boolean): Variants {
  if (!reducedMotion) return pageVariants;
  return {
    initial: { opacity: 0, y: 0 },
    animate: { opacity: 1, y: 0, transition: { duration: 0 } },
    exit: { opacity: 0, y: 0, transition: { duration: 0 } }
  };
}

/** Row enter/exit motion for the guest table; zeroed for reduced motion. */
type RowMotion = {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number; transition: { duration: number; ease?: "easeOut" } };
  exit: { opacity: number; y: number; transition: { duration: number; ease?: "easeOut" } };
};
export function getRowVariants(reducedMotion: boolean): RowMotion {
  if (reducedMotion) {
    return {
      initial: { opacity: 0, y: 0 },
      animate: { opacity: 1, y: 0, transition: { duration: 0 } },
      exit: { opacity: 0, y: 0, transition: { duration: 0 } }
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeOut" } }
  };
}
