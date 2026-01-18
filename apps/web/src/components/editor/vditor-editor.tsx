"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type Vditor from "vditor";
import "vditor/dist/index.css";
import { useFloatingToolbar } from "./use-floating-toolbar";
import { FloatingToolbar, type ToolbarAction } from "./floating-toolbar";
import { uploadImage } from "@/lib/api";

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
  /** Callback when an image is uploaded, receives the blob signed_id */
  onImageUploaded?: (signedId: string) => void;
}

export function VditorEditor({
  value = "",
  onChange,
  placeholder = "Write something...",
  height = 400,
  className,
  autoLinkOnPaste = true,
  onImageUploaded,
}: VditorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Vditor | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialValueRef = useRef(value);
  const [isUploading, setIsUploading] = useState(false);

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

  // Handle file selection for upload
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;

      // Reset input so same file can be selected again
      e.target.value = "";

      setIsUploading(true);
      try {
        const uploaded = await uploadImage(file);

        // Insert Markdown image syntax
        const markdown = `![${file.name}](${uploaded.url})`;
        editorRef.current.insertValue(markdown);

        // Notify parent of uploaded image
        onImageUploaded?.(uploaded.signed_id);

        editorRef.current.focus();
      } catch (error) {
        console.error("Failed to upload image:", error);
        // Show error in editor as comment
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        editorRef.current.insertValue(`<!-- Upload error: ${errorMessage} -->`);
      } finally {
        setIsUploading(false);
      }
    },
    [onImageUploaded]
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
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      {/* Upload indicator */}
      {isUploading && (
        <div className="absolute top-2 right-2 bg-background/80 px-3 py-1 rounded text-sm text-muted-foreground">
          Uploading...
        </div>
      )}
    </div>
  );
}
