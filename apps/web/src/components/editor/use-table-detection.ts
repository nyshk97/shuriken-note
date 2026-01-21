"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TableInfo {
  /** The table element in the DOM */
  element: HTMLTableElement;
  /** Current row index (0-based, includes header) */
  rowIndex: number;
  /** Current column index (0-based) */
  colIndex: number;
  /** Total number of rows (includes header and separator) */
  totalRows: number;
  /** Total number of columns */
  totalCols: number;
  /** Whether the cursor is in the header row */
  isHeaderRow: boolean;
}

export interface UseTableDetectionOptions {
  /** Container element to scope selection events */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Debounce delay in ms (default: 100) */
  debounceMs?: number;
}

export interface UseTableDetectionReturn {
  /** Whether the cursor is inside a table */
  isInsideTable: boolean;
  /** Table information (null if not inside a table) */
  tableInfo: TableInfo | null;
  /** Force re-check the cursor position */
  refresh: () => void;
}

/**
 * Find the table element that contains the current cursor
 */
function findTableAtCursor(): HTMLTableElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const anchorNode = selection.anchorNode;
  if (!anchorNode) return null;

  const element =
    anchorNode.nodeType === Node.TEXT_NODE
      ? anchorNode.parentElement
      : (anchorNode as Element);

  return element?.closest("table") as HTMLTableElement | null;
}

/**
 * Get the current cell position within a table
 */
function getCellPosition(
  table: HTMLTableElement
): { rowIndex: number; colIndex: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const anchorNode = selection.anchorNode;
  if (!anchorNode) return null;

  const element =
    anchorNode.nodeType === Node.TEXT_NODE
      ? anchorNode.parentElement
      : (anchorNode as Element);

  const cell = element?.closest("td, th") as HTMLTableCellElement | null;
  if (!cell) return null;

  const row = cell.closest("tr") as HTMLTableRowElement | null;
  if (!row) return null;

  // Get row index
  const rows = Array.from(table.rows);
  const rowIndex = rows.indexOf(row);

  // Get column index
  const colIndex = cell.cellIndex;

  return { rowIndex, colIndex };
}

/**
 * Hook to detect when the cursor is inside a Markdown table
 */
export function useTableDetection({
  containerRef,
  debounceMs = 100,
}: UseTableDetectionOptions): UseTableDetectionReturn {
  const [isInsideTable, setIsInsideTable] = useState(false);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkCursorPosition = useCallback(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const table = findTableAtCursor();

      if (!table) {
        setIsInsideTable(false);
        setTableInfo(null);
        return;
      }

      // Check if the table is within our container
      if (containerRef.current && !containerRef.current.contains(table)) {
        setIsInsideTable(false);
        setTableInfo(null);
        return;
      }

      const position = getCellPosition(table);
      if (!position) {
        setIsInsideTable(false);
        setTableInfo(null);
        return;
      }

      const totalRows = table.rows.length;
      const totalCols = table.rows[0]?.cells.length || 0;

      // In Vditor IR mode, row 0 is thead (header), row 1+ is tbody
      // The separator row (---) is not rendered as a DOM row
      const isHeaderRow = position.rowIndex === 0;

      setIsInsideTable(true);
      setTableInfo({
        element: table,
        rowIndex: position.rowIndex,
        colIndex: position.colIndex,
        totalRows,
        totalCols,
        isHeaderRow,
      });
    }, debounceMs);
  }, [containerRef, debounceMs]);

  const refresh = useCallback(() => {
    checkCursorPosition();
  }, [checkCursorPosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Listen to selection changes
    const handleSelectionChange = () => {
      checkCursorPosition();
    };

    // Listen to keyup for cursor movement via keyboard
    const handleKeyUp = (e: KeyboardEvent) => {
      // Only check on navigation keys
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(
          e.key
        )
      ) {
        checkCursorPosition();
      }
    };

    // Listen to clicks for cursor movement via mouse
    const handleClick = () => {
      checkCursorPosition();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    container.addEventListener("keyup", handleKeyUp);
    container.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      container.removeEventListener("keyup", handleKeyUp);
      container.removeEventListener("click", handleClick);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef, checkCursorPosition]);

  return {
    isInsideTable,
    tableInfo,
    refresh,
  };
}
