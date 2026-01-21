"use client";

import { forwardRef } from "react";
import {
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TableOperation } from "@/lib/markdown-table";

export interface TableToolbarProps {
  /** Position for the toolbar */
  position: { top: number; left: number };
  /** Callback when an operation is selected */
  onOperation: (operation: TableOperation) => void;
  /** Whether the cursor is in the header row (disables row deletion) */
  isHeaderRow?: boolean;
  /** Total number of rows (disables deletion if only 1 data row) */
  totalRows?: number;
  /** Total number of columns (disables deletion if only 1 column) */
  totalCols?: number;
}

interface ToolbarItem {
  id: TableOperation;
  icon: React.ReactNode;
  label: string;
  group: "row" | "col";
  isDestructive?: boolean;
}

const toolbarItems: ToolbarItem[] = [
  {
    id: "addRowAbove",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
    label: "Add row above",
    group: "row",
  },
  {
    id: "addRowBelow",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
    label: "Add row below",
    group: "row",
  },
  {
    id: "deleteRow",
    icon: <Minus className="h-3.5 w-3.5" />,
    label: "Delete row",
    group: "row",
    isDestructive: true,
  },
  {
    id: "addColLeft",
    icon: <ArrowLeft className="h-3.5 w-3.5" />,
    label: "Add column left",
    group: "col",
  },
  {
    id: "addColRight",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
    label: "Add column right",
    group: "col",
  },
  {
    id: "deleteCol",
    icon: <Minus className="h-3.5 w-3.5" />,
    label: "Delete column",
    group: "col",
    isDestructive: true,
  },
];

export const TableToolbar = forwardRef<HTMLDivElement, TableToolbarProps>(
  function TableToolbar(
    { position, onOperation, isHeaderRow = false, totalRows = 3, totalCols = 2 },
    ref
  ) {
    const rowItems = toolbarItems.filter((item) => item.group === "row");
    const colItems = toolbarItems.filter((item) => item.group === "col");

    // Can only delete rows if:
    // - Not in header row
    // - More than 1 data row (totalRows > 2: header + at least 2 data rows)
    const canDeleteRow = !isHeaderRow && totalRows > 2;

    // Can only delete columns if more than 1 column
    const canDeleteCol = totalCols > 1;

    const isDisabled = (item: ToolbarItem): boolean => {
      if (item.id === "deleteRow") return !canDeleteRow;
      if (item.id === "deleteCol") return !canDeleteCol;
      // Cannot add row above header
      if (item.id === "addRowAbove" && isHeaderRow) return true;
      return false;
    };

    return (
      <div
        ref={ref}
        className="fixed z-50 flex items-center gap-0.5 p-1 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        role="toolbar"
        aria-label="Table editing toolbar"
      >
        {/* Row operations */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-border">
          <span className="text-[10px] text-muted-foreground px-1">Row</span>
          {rowItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 hover:bg-accent ${item.isDestructive ? "hover:text-destructive" : ""
                }`}
              onClick={() => onOperation(item.id)}
              title={item.label}
              aria-label={item.label}
              disabled={isDisabled(item)}
            >
              {item.icon}
            </Button>
          ))}
        </div>

        {/* Column operations */}
        <div className="flex items-center gap-0.5 pl-1.5">
          <span className="text-[10px] text-muted-foreground px-1">Col</span>
          {colItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 hover:bg-accent ${item.isDestructive ? "hover:text-destructive" : ""
                }`}
              onClick={() => onOperation(item.id)}
              title={item.label}
              aria-label={item.label}
              disabled={isDisabled(item)}
            >
              {item.icon}
            </Button>
          ))}
        </div>
      </div>
    );
  }
);
