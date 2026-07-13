"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Columns2, Eye, Pencil } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { MarkdownEditor } from "./codemirror-editor";

export type WorkspaceMode = "edit" | "split" | "view";

const MODE_STORAGE_KEY = "note-editor-mode";
const PREVIEW_DEBOUNCE_MS = 300;

export interface MarkdownWorkspaceProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFileUploaded?: (signedId: string) => void;
  /** Rendered above the mode toggle, inside the width-constrained container */
  header?: React.ReactNode;
  /** Rendered below the editor area */
  footer?: React.ReactNode;
}

const MODE_OPTIONS: { mode: WorkspaceMode; icon: React.ReactNode; label: string }[] = [
  { mode: "edit", icon: <Pencil size={14} />, label: "Edit" },
  { mode: "split", icon: <Columns2 size={14} />, label: "Split" },
  { mode: "view", icon: <Eye size={14} />, label: "View" },
];

export function MarkdownWorkspace({
  value,
  onChange,
  placeholder,
  onFileUploaded,
  header,
  footer,
}: MarkdownWorkspaceProps) {
  // This component is loaded with ssr: false, so reading browser state
  // in the initializer is safe (no server markup to mismatch).
  const [mode, setMode] = useState<WorkspaceMode>(() => {
    if (typeof window === "undefined") return "split";
    const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
    return saved === "edit" || saved === "split" || saved === "view"
      ? saved
      : "split";
  });
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const selectMode = useCallback((next: WorkspaceMode) => {
    setMode(next);
    window.localStorage.setItem(MODE_STORAGE_KEY, next);
  }, []);

  // Split is not available on mobile; fall back to edit
  const effectiveMode: WorkspaceMode =
    isMobile && mode === "split" ? "edit" : mode;

  // Debounced preview so fast typing doesn't re-render markdown
  // (and remount LinkCards) on every keystroke
  const [previewValue, setPreviewValue] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(
      () => setPreviewValue(value),
      PREVIEW_DEBOUNCE_MS
    );
    return () => clearTimeout(timeout);
  }, [value]);

  // One-way scroll sync: editor scroll ratio -> preview
  const previewRef = useRef<HTMLDivElement>(null);

  const handleScrollRatio = useCallback((ratio: number) => {
    const el = previewRef.current;
    if (!el) return;
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  }, []);

  const modeOptions = isMobile
    ? MODE_OPTIONS.filter((option) => option.mode !== "split")
    : MODE_OPTIONS;

  const containerWidth =
    effectiveMode === "split"
      ? "max-w-[1600px] px-6 sm:px-10"
      : "max-w-[900px] px-12 sm:px-24";

  const editorPane =
    effectiveMode === "edit"
      ? "flex-1 min-w-0 min-h-0"
      : effectiveMode === "split"
        ? "w-1/2 min-w-0 min-h-0"
        : "hidden";

  const previewPane =
    effectiveMode === "view"
      ? "flex-1 min-w-0 min-h-0 overflow-y-auto workspace-scrollbar"
      : effectiveMode === "split"
        ? "w-1/2 min-w-0 min-h-0 overflow-y-auto workspace-scrollbar"
        : "hidden";

  return (
    <div
      className={`mx-auto w-full h-full flex flex-col pt-12 ${containerWidth}`}
    >
      {header}

      {/* Mode toggle */}
      <div className="flex items-center justify-end mb-2">
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--workspace-hover)]">
          {modeOptions.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => selectMode(option.mode)}
              title={option.label}
              aria-label={option.label}
              aria-pressed={mode === option.mode}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                mode === option.mode
                  ? "bg-[var(--workspace-active)] text-[var(--workspace-text-primary)]"
                  : "text-[var(--workspace-text-secondary)] hover:text-[var(--workspace-text-primary)]"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panes: both stay mounted so editor state (undo history,
          selection) survives mode switches */}
      <div className="flex-1 min-h-0 flex gap-6">
        <div className={editorPane}>
          <MarkdownEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFileUploaded={onFileUploaded}
            onScrollRatio={effectiveMode === "split" ? handleScrollRatio : undefined}
          />
        </div>
        <div ref={previewRef} className={previewPane}>
          {/* Light surface so the preview looks exactly like the
              published page (.znc styles assume a light background) */}
          <div
            className={`bg-white rounded-lg px-8 py-10 min-h-full ${
              effectiveMode === "view" ? "max-w-[760px] mx-auto" : ""
            }`}
          >
            <MarkdownViewer content={previewValue} variant="public" />
          </div>
        </div>
      </div>

      {footer}
    </div>
  );
}
