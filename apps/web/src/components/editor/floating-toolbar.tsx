"use client";

import { forwardRef } from "react";
import {
  Strikethrough,
  CheckSquare,
  Table,
  Link,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolbarPosition } from "./use-floating-toolbar";

export type ToolbarAction =
  | "strikethrough"
  | "checkbox"
  | "table"
  | "link"
  | "upload";

export interface FloatingToolbarProps {
  position: ToolbarPosition;
  onAction: (action: ToolbarAction) => void;
  onClose: () => void;
}

const toolbarItems: { id: ToolbarAction; icon: React.ReactNode; label: string }[] = [
  {
    id: "strikethrough",
    icon: <Strikethrough className="h-4 w-4" />,
    label: "Strikethrough",
  },
  {
    id: "checkbox",
    icon: <CheckSquare className="h-4 w-4" />,
    label: "Checkbox",
  },
  {
    id: "table",
    icon: <Table className="h-4 w-4" />,
    label: "Table",
  },
  {
    id: "link",
    icon: <Link className="h-4 w-4" />,
    label: "Link",
  },
  {
    id: "upload",
    icon: <Upload className="h-4 w-4" />,
    label: "Upload",
  },
];

export const FloatingToolbar = forwardRef<HTMLDivElement, FloatingToolbarProps>(
  function FloatingToolbar({ position, onAction, onClose }, ref) {
    const handleAction = (action: ToolbarAction) => {
      onAction(action);
      onClose();
    };

    return (
      <div
        ref={ref}
        className="fixed z-50 flex items-center gap-1 p-1.5 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        role="toolbar"
        aria-label="Formatting toolbar"
      >
        {toolbarItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-accent"
            onClick={() => handleAction(item.id)}
            title={item.label}
            aria-label={item.label}
          >
            {item.icon}
          </Button>
        ))}
      </div>
    );
  }
);
