"use client";

import { useEffect, useRef, useCallback } from "react";
import type Vditor from "vditor";
import "vditor/dist/index.css";
import { useFloatingToolbar } from "./use-floating-toolbar";
import { FloatingToolbar, type ToolbarAction } from "./floating-toolbar";

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
}

export function VditorEditor({
  value = "",
  onChange,
  placeholder = "Write something...",
  height = 400,
  className,
  autoLinkOnPaste = true,
}: VditorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Vditor | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef(value);

  // Floating toolbar state
  const { isOpen, position, close } = useFloatingToolbar({
    containerRef,
    toolbarRef,
  });

  const handleInput = useCallback(
    (newValue: string) => {
      onChange?.(newValue);
    },
    [onChange]
  );

  // Paste handler for auto-linking URLs
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!autoLinkOnPaste || !editorRef.current) return;

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

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
    [autoLinkOnPaste]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let vditor: Vditor | null = null;

    const initEditor = async () => {
      const VditorClass = (await import("vditor")).default;

      if (!containerRef.current) return;

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
        input: handleInput,
        after: () => {
          editorRef.current = vditor;

          // Add paste event listener for auto-linking
          if (autoLinkOnPaste && containerRef.current) {
            containerRef.current.addEventListener("paste", handlePaste, true);
          }
        },
      });
    };

    initEditor();

    return () => {
      // Remove paste event listener
      if (containerRef.current) {
        containerRef.current.removeEventListener("paste", handlePaste, true);
      }
      if (vditor) {
        vditor.destroy();
        editorRef.current = null;
      }
    };
  }, [placeholder, height, handleInput, autoLinkOnPaste, handlePaste]);

  // Update editor value when prop changes (external update)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

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
        // TODO: Implement file upload
        // For now, just insert a placeholder
        editorRef.current.insertValue("![](image-url)");
        break;
      }
    }

    // Focus back to editor
    editorRef.current.focus();
  }, []);

  return (
    <div className="relative">
      <div ref={containerRef} className={className} lang="ja" />
      {isOpen && (
        <FloatingToolbar
          ref={toolbarRef}
          position={position}
          onAction={handleToolbarAction}
          onClose={close}
        />
      )}
    </div>
  );
}
