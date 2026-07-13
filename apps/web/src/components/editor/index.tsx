"use client";

import dynamic from "next/dynamic";
import type { MarkdownWorkspaceProps } from "./markdown-workspace";

// Dynamic import with SSR disabled - CodeMirror requires browser APIs
export const MarkdownWorkspace = dynamic<MarkdownWorkspaceProps>(
  () => import("./markdown-workspace").then((mod) => mod.MarkdownWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <span className="text-[var(--workspace-text-secondary)]">
          Loading editor...
        </span>
      </div>
    ),
  }
);

export type { MarkdownWorkspaceProps, WorkspaceMode } from "./markdown-workspace";
