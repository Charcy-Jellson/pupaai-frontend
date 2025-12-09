"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * This hook fixes a common issue where Radix UI dialogs/modals
 * can leave the body with pointer-events: none or overflow: hidden
 * after route changes, causing the page to become unresponsive.
 */
export function useBodyScrollLockFix() {
  const pathname = usePathname();

  useEffect(() => {
    // On route change, ensure body is restored to normal state
    const restoreBody = () => {
      // Remove any lingering styles from Radix UI
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      
      // Remove any data attributes that Radix might have left
      document.body.removeAttribute("data-scroll-locked");
      
      // Find and remove any orphaned Radix portals/overlays
      const orphanedOverlays = document.querySelectorAll(
        '[data-radix-portal]:empty, [data-state="closed"]'
      );
      orphanedOverlays.forEach((el) => {
        // Only remove if it's truly orphaned (no visible content)
        if (el.children.length === 0) {
          el.remove();
        }
      });
    };

    // Run immediately on route change
    restoreBody();

    // Also run after a short delay to catch any async issues
    const timeoutId = setTimeout(restoreBody, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);
}

