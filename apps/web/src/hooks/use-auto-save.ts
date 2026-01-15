"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  /** Data to be saved */
  data: T;
  /** Original data to compare for changes */
  originalData: T;
  /** Save function that returns a promise */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 3000) */
  delay?: number;
  /** Comparison function (default: JSON.stringify comparison) */
  isEqual?: (a: T, b: T) => boolean;
}

interface UseAutoSaveReturn {
  /** Current save status */
  status: AutoSaveStatus;
  /** Whether there are unsaved changes (including pending debounce) */
  hasUnsavedChanges: boolean;
  /** Flush pending changes immediately */
  flush: () => void;
  /** Last error if status is 'error' */
  error: Error | null;
}

/**
 * Auto-save hook with 3s debounce.
 * Uses local state as source of truth during editing.
 * Triggers save automatically when data changes.
 */
export function useAutoSave<T>({
  data,
  originalData,
  onSave,
  delay = 3000,
  isEqual = defaultIsEqual,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  // Refs to track debounce timer and pending data
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);

  // Check if current data differs from original
  const hasChanges = !isEqual(data, originalData);

  // Determine if there are unsaved changes (either pending or actual changes)
  const hasUnsavedChanges = hasChanges || status === "pending" || status === "saving";

  // Perform the actual save
  const performSave = useCallback(
    async (dataToSave: T) => {
      if (isSavingRef.current) return;

      isSavingRef.current = true;
      setStatus("saving");
      setError(null);

      try {
        await onSave(dataToSave);
        setStatus("saved");

        // Reset to idle after a short delay
        setTimeout(() => {
          setStatus((current) => (current === "saved" ? "idle" : current));
        }, 2000);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err : new Error("Save failed"));
      } finally {
        isSavingRef.current = false;
        pendingDataRef.current = null;
      }
    },
    [onSave]
  );

  // Flush pending changes immediately
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (pendingDataRef.current !== null) {
      performSave(pendingDataRef.current);
    } else if (hasChanges && !isSavingRef.current) {
      performSave(data);
    }
  }, [data, hasChanges, performSave]);

  // Debounced save effect
  useEffect(() => {
    // Don't trigger save if no changes or currently saving
    if (!hasChanges || isSavingRef.current) {
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set pending status and store pending data
    setStatus("pending");
    pendingDataRef.current = data;

    // Set up debounced save
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (pendingDataRef.current !== null) {
        performSave(pendingDataRef.current);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, hasChanges, delay, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    status,
    hasUnsavedChanges,
    flush,
    error,
  };
}

// Default equality check using JSON.stringify
function defaultIsEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
