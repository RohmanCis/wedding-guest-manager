"use client";

import { useEffect, useState } from "react";

/**
 * true when viewport < 640px. SSR guard: always false on the server and
 * first client paint, then corrects after mount — prefer CSS breakpoints
 * for layout that must not flash; use this only for JS-only branches.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isMobile;
}
