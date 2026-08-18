import type { Variants } from "framer-motion";

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
