"use client";

import { useState, useEffect, useCallback } from "react";

export interface ToolbarPosition {
  top: number;
  left: number;
}

export interface UseFloatingToolbarOptions {
  /** Trigger key (default: "/") */
  triggerKey?: string;
  /** Container element to scope keyboard events */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Toolbar element ref for click-outside detection */
  toolbarRef?: React.RefObject<HTMLElement | null>;
}

export interface UseFloatingToolbarReturn {
  isOpen: boolean;
  position: ToolbarPosition;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Hook to manage floating toolbar visibility and position.
 * Triggers on Cmd/Ctrl + triggerKey (default: /)
 */
export function useFloatingToolbar({
  triggerKey = "/",
  containerRef,
  toolbarRef,
}: UseFloatingToolbarOptions = {}): UseFloatingToolbarReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ToolbarPosition>({ top: 0, left: 0 });

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Calculate position based on cursor/selection
  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Fallback: center of container
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top + 100,
          left: rect.left + rect.width / 2 - 100,
        });
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position slightly above the cursor
    const toolbarHeight = 40;
    const toolbarWidth = 200;
    const padding = 8;

    let top = rect.top - toolbarHeight - padding;
    let left = rect.left;

    // Ensure toolbar stays within viewport
    if (top < padding) {
      top = rect.bottom + padding; // Show below if not enough space above
    }

    if (left + toolbarWidth > window.innerWidth - padding) {
      left = window.innerWidth - toolbarWidth - padding;
    }

    if (left < padding) {
      left = padding;
    }

    setPosition({ top, left });
  }, [containerRef]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === triggerKey) {
        e.preventDefault();
        e.stopPropagation();

        if (isOpen) {
          close();
        } else {
          updatePosition();
          open();
        }
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    };

    const target = containerRef?.current || document;
    target.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      target.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [triggerKey, containerRef, isOpen, open, close, updatePosition]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is outside the toolbar
      if (toolbarRef?.current && !toolbarRef.current.contains(target)) {
        close();
      } else if (!toolbarRef?.current) {
        // No toolbar ref, close on any click
        close();
      }
    };

    // Delay to avoid immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, close, toolbarRef]);

  return {
    isOpen,
    position,
    open,
    close,
    toggle,
  };
}
