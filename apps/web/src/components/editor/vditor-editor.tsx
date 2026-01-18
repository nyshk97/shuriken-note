"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type Vditor from "vditor";
import "vditor/dist/index.css";
import { useFloatingToolbar } from "./use-floating-toolbar";
import { FloatingToolbar, type ToolbarAction } from "./floating-toolbar";
import {
  uploadFile,
  generateFileMarkdown,
  getAllowedFileTypesAccept,
} from "@/lib/api";

// URL detection regex
const URL_REGEX = /^https?:\/\/[^\s]+$/;

// Check if text is a URL
function isUrl(text: string): boolean {
  return URL_REGEX.test(text.trim());
}

// Convert URL to Markdown link format
function urlToMarkdownLink(url: string): string {
  const trimmedUrl = url.trim();
  return `[${trimmedUrl}](${trimmedUrl})`;
}

export interface VditorEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  className?: string;
  /** Auto-convert pasted URLs to Markdown links */
  autoLinkOnPaste?: boolean;
  /** Callback when a file is uploaded, receives the blob signed_id */
  onFileUploaded?: (signedId: string) => void;
  /** @deprecated Use onFileUploaded instead */
  onImageUploaded?: (signedId: string) => void;
}

export function VditorEditor({
  value = "",
  onChange,
  placeholder = "Write something...",
  height = 400,
  className,
  autoLinkOnPaste = true,
  onFileUploaded,
  onImageUploaded,
}: VditorEditorProps) {
  // Support both onFileUploaded and legacy onImageUploaded
  const handleFileUploadedCallback = onFileUploaded ?? onImageUploaded;
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Vditor | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialValueRef = useRef(value);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Store callbacks in refs to avoid useEffect re-runs
  const uploadAndInsertFileRef = useRef<((file: File) => Promise<void>) | null>(null);
  const handlePasteRef = useRef<((e: ClipboardEvent) => Promise<void>) | null>(null);
  const handleInputRef = useRef<((value: string) => void) | null>(null);

  // Upload a file and insert markdown at cursor position
  const uploadAndInsertFile = useCallback(
    async (file: File) => {
      if (!editorRef.current) return;

      setIsUploading(true);
      try {
        const uploaded = await uploadFile(file);
        const markdown = generateFileMarkdown(uploaded);
        editorRef.current.insertValue(markdown);
        handleFileUploadedCallback?.(uploaded.signed_id);
        editorRef.current.focus();
      } catch (error) {
        console.error("Failed to upload file:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        editorRef.current.insertValue(`<!-- Upload error: ${errorMessage} -->`);
      } finally {
        setIsUploading(false);
      }
    },
    [handleFileUploadedCallback]
  );

  // Keep ref updated with latest callback
  uploadAndInsertFileRef.current = uploadAndInsertFile;

  // Floating toolbar state
  const { isOpen, position, close } = useFloatingToolbar({
    containerRef,
    toolbarRef,
  });

  const handleInput = useCallback(
    (newValue: string) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/752089b4-f884-414a-9d2e-40082b87b892', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'vditor-editor.tsx:handleInput', message: 'handleInput called', data: { newValue: newValue?.substring(0, 50) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'D' }) }).catch(() => { });
      // #endregion
      onChange?.(newValue);
    },
    [onChange]
  );

  // Keep ref updated with latest callback
  handleInputRef.current = handleInput;

  // Paste handler for images and auto-linking URLs
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!editorRef.current) return;

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check for image files in clipboard (screenshots, copied images)
      const items = clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation();

          const file = item.getAsFile();
          if (file) {
            // Use ref to get latest callback without causing re-renders
            await uploadAndInsertFileRef.current?.(file);
          }
          return;
        }
      }

      // Check for pasted files
      const files = clipboardData.files;
      if (files.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        for (const file of files) {
          await uploadAndInsertFileRef.current?.(file);
        }
        return;
      }

      // Auto-link URLs
      if (!autoLinkOnPaste) return;

      const pastedText = clipboardData.getData("text/plain");
      if (!pastedText) return;

      // Check if the pasted text is a URL
      if (isUrl(pastedText)) {
        e.preventDefault();
        e.stopPropagation();

        // Insert as Markdown link
        const markdownLink = urlToMarkdownLink(pastedText);
        editorRef.current.insertValue(markdownLink);
      }
    },
    [autoLinkOnPaste] // Removed uploadAndInsertFile dependency - using ref instead
  );

  // Keep ref updated with latest callback
  handlePasteRef.current = handlePaste;

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the container entirely
    const relatedTarget = e.relatedTarget as Node | null;
    if (!containerRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await uploadAndInsertFile(file);
      }
    },
    [uploadAndInsertFile]
  );

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/752089b4-f884-414a-9d2e-40082b87b892', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'vditor-editor.tsx:useEffect-init', message: 'Editor init useEffect triggered', data: { placeholder, height }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A', runId: 'post-fix-2' }) }).catch(() => { });
    // #endregion
    if (!containerRef.current) return;

    let vditor: Vditor | null = null;
    let isCancelled = false;

    // Stable paste handler that delegates to ref
    const stablePasteHandler = (e: ClipboardEvent) => {
      handlePasteRef.current?.(e);
    };

    // Stable input handler that delegates to ref
    const stableInputHandler = (value: string) => {
      handleInputRef.current?.(value);
    };

    const initEditor = async () => {
      const VditorClass = (await import("vditor")).default;

      // Prevent double initialization (React StrictMode)
      if (!containerRef.current || isCancelled) return;

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/752089b4-f884-414a-9d2e-40082b87b892', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'vditor-editor.tsx:initEditor', message: 'Creating new Vditor instance', data: { initialValue: initialValueRef.current?.substring(0, 50), isCancelled }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A,C', runId: 'post-fix-2' }) }).catch(() => { });
      // #endregion

      vditor = new VditorClass(containerRef.current, {
        mode: "ir", // Instant Rendering mode (Typora-like)
        value: initialValueRef.current,
        placeholder,
        height: typeof height === "number" ? height : undefined,
        minHeight: typeof height === "number" ? height : 300,
        theme: "dark",
        icon: "ant",
        lang: "en_US",
        toolbar: [],
        toolbarConfig: {
          hide: true,
        },
        cache: {
          enable: false,
        },
        preview: {
          theme: {
            current: "dark",
          },
          hljs: {
            style: "github-dark",
            lineNumber: true,
          },
          markdown: {
            codeBlockPreview: true,
            mathBlockPreview: true,
            autoSpace: true,
          },
        },
        input: stableInputHandler,
        after: () => {
          if (isCancelled) {
            vditor?.destroy();
            return;
          }
          editorRef.current = vditor;

          // Add paste event listener using stable handler
          if (containerRef.current) {
            containerRef.current.addEventListener("paste", stablePasteHandler, true);
          }
        },
      });
    };

    initEditor();

    return () => {
      isCancelled = true;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/752089b4-f884-414a-9d2e-40082b87b892', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'vditor-editor.tsx:useEffect-cleanup', message: 'Editor cleanup triggered', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A', runId: 'post-fix-2' }) }).catch(() => { });
      // #endregion
      // Remove paste event listener
      if (containerRef.current) {
        containerRef.current.removeEventListener("paste", stablePasteHandler, true);
      }
      if (vditor) {
        vditor.destroy();
        editorRef.current = null;
      }
    };
  }, [placeholder, height]); // Removed handleInput - using ref instead

  // Update editor value when prop changes (external update)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/752089b4-f884-414a-9d2e-40082b87b892', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'vditor-editor.tsx:useEffect-setValue', message: 'setValue called due to value prop change', data: { propValue: value?.substring(0, 50), editorValue: editorRef.current.getValue()?.substring(0, 50) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'B,D' }) }).catch(() => { });
      // #endregion
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Handle file selection for upload
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be selected again
      e.target.value = "";

      await uploadAndInsertFile(file);
    },
    [uploadAndInsertFile]
  );

  // Handle toolbar actions
  const handleToolbarAction = useCallback((action: ToolbarAction) => {
    if (!editorRef.current) return;

    switch (action) {
      case "strikethrough": {
        const selection = editorRef.current.getSelection();
        if (selection) {
          editorRef.current.updateValue(`~~${selection}~~`);
        } else {
          editorRef.current.insertValue("~~~~");
        }
        break;
      }
      case "checkbox": {
        editorRef.current.insertValue("\n- [ ] ");
        break;
      }
      case "table": {
        const table = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
|          |          |          |
|          |          |          |
`;
        editorRef.current.insertValue(table);
        break;
      }
      case "link": {
        const selection = editorRef.current.getSelection();
        if (selection) {
          editorRef.current.updateValue(`[${selection}](url)`);
        } else {
          editorRef.current.insertValue("[](url)");
        }
        break;
      }
      case "upload": {
        // Open file picker
        fileInputRef.current?.click();
        break;
      }
    }

    // Focus back to editor (except for upload which opens file picker)
    if (action !== "upload") {
      editorRef.current.focus();
    }
  }, []);

  return (
    <div
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div ref={containerRef} className={className} lang="ja" />
      {isOpen && (
        <FloatingToolbar
          ref={toolbarRef}
          position={position}
          onAction={handleToolbarAction}
          onClose={close}
        />
      )}
      {/* Hidden file input for file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAllowedFileTypesAccept()}
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded flex items-center justify-center z-10 pointer-events-none">
          <div className="text-primary font-medium">Drop files here</div>
        </div>
      )}
      {/* Upload indicator */}
      {isUploading && (
        <div className="absolute top-2 right-2 bg-background/80 px-3 py-1 rounded text-sm text-muted-foreground z-20">
          Uploading...
        </div>
      )}
    </div>
  );
}
