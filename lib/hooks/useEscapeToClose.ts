"use client";

import { useEffect } from "react";

type Options = {
  enabled: boolean;
  isBlocked?: boolean;
  onClose: () => void;
};

export function useEscapeToClose({
  enabled,
  isBlocked = false,
  onClose,
}: Options) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isBlocked) {
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, isBlocked, onClose]);
}
