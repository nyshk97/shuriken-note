"use client";

import { useEffect, useRef, useCallback } from "react";
import type Vditor from "vditor";
import "vditor/dist/index.css";

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
  const initialValueRef = useRef(value);

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
        toolbar: [
          "headings",
          "bold",
          "strike",
          "|",
          "list",
          "ordered-list",
          "check",
          "|",
          "quote",
          "code",
          "inline-code",
          "|",
          "link",
          "upload",
          "|",
          "undo",
          "redo",
        ],
        toolbarConfig: {
          pin: true,
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

  return <div ref={containerRef} className={className} lang="ja" />;
}
