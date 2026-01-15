"use client";

import dynamic from "next/dynamic";
import type { VditorEditorProps } from "./vditor-editor";

// Dynamic import with SSR disabled - Vditor requires browser APIs
export const VditorEditor = dynamic<VditorEditorProps>(
  () => import("./vditor-editor").then((mod) => mod.VditorEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] border rounded-md bg-muted/50">
        <span className="text-muted-foreground">Loading editor...</span>
      </div>
    ),
  }
);

export type { VditorEditorProps };
