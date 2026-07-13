"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentLess,
  indentMore,
} from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorState, type Extension } from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import {
  generateFileMarkdown,
  getAllowedFileTypesAccept,
  uploadFile,
} from "@/lib/api";
import {
  applyTableOperation,
  type TableOperation,
} from "@/lib/markdown-table";
import { editorTheme } from "./editor-theme";
import { FloatingToolbar, type ToolbarAction } from "./floating-toolbar";
import { TableToolbar } from "./table-toolbar";
import { findTableAt, type TableInfo } from "./table-range";
import {
  addUploadEffect,
  createUploadId,
  findUploadPos,
  removeUploadEffect,
  uploadPlaceholderField,
} from "./upload-placeholder";
import { useFloatingToolbar } from "./use-floating-toolbar";

// URL detection regex
const URL_REGEX = /^https?:\/\/[^\s]+$/;

function isUrl(text: string): boolean {
  return URL_REGEX.test(text.trim());
}

const TABLE_TEMPLATE = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
|          |          |          |
|          |          |          |
`;

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Auto-convert pasted URLs to Markdown links */
  autoLinkOnPaste?: boolean;
  /** Callback when a file is uploaded, receives the blob signed_id */
  onFileUploaded?: (signedId: string) => void;
  /** Reports scroll position as a 0-1 ratio (for preview sync) */
  onScrollRatio?: (ratio: number) => void;
}

function sameTable(a: TableInfo | null, b: TableInfo | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.from === b.from &&
    a.to === b.to &&
    a.isHeaderRow === b.isHeaderRow &&
    a.totalRows === b.totalRows &&
    a.totalCols === b.totalCols
  );
}

/** Wrap the current selection with a markdown mark, or insert an empty pair */
function toggleWrap(view: EditorView, mark: string): void {
  const { from, to } = view.state.selection.main;
  if (from === to) {
    view.dispatch({
      changes: { from, insert: mark + mark },
      selection: { anchor: from + mark.length },
    });
  } else {
    const selected = view.state.sliceDoc(from, to);
    view.dispatch({
      changes: { from, to, insert: `${mark}${selected}${mark}` },
      selection: { anchor: from, head: to + mark.length * 2 },
    });
  }
  view.focus();
}

function insertLink(view: EditorView, url?: string): void {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const text = selected || "";
  const href = url ?? "url";
  const link = `[${text}](${href})`;
  view.dispatch({
    changes: { from, to, insert: link },
    // Place cursor on the part the user still needs to fill in
    selection: url
      ? { anchor: from + 1, head: from + 1 + text.length }
      : { anchor: from + text.length + 3, head: from + text.length + 3 + href.length },
  });
  view.focus();
}

export function MarkdownEditor({
  value = "",
  onChange,
  placeholder = "Write something...",
  className,
  autoLinkOnPaste = true,
  onFileUploaded,
  onScrollRatio,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialValueRef = useRef(value);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  // Bumped on editor scroll so the table toolbar follows the table
  const [, setScrollTick] = useState(0);

  // Latest callbacks accessible from stable CodeMirror extensions
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onFileUploadedRef = useRef(onFileUploaded);
  onFileUploadedRef.current = onFileUploaded;
  const onScrollRatioRef = useRef(onScrollRatio);
  onScrollRatioRef.current = onScrollRatio;
  const autoLinkOnPasteRef = useRef(autoLinkOnPaste);
  autoLinkOnPasteRef.current = autoLinkOnPaste;

  const uploadAndInsertFile = useCallback(async (file: File) => {
    const view = viewRef.current;
    if (!view) return;

    const id = createUploadId();
    setIsUploading(true);
    setUploadError(null);

    // Reserve the current cursor position; the placeholder decoration
    // maps through any edits made while the upload is in flight.
    view.dispatch({
      effects: addUploadEffect.of({ id, pos: view.state.selection.main.head }),
    });

    try {
      const uploaded = await uploadFile(file);
      const insertText = generateFileMarkdown(uploaded) + "\n\n";
      const pos = findUploadPos(view.state, id) ?? view.state.selection.main.head;

      view.dispatch({
        changes: { from: pos, insert: insertText },
        effects: removeUploadEffect.of({ id }),
        selection: { anchor: pos + insertText.length },
        scrollIntoView: true,
      });

      onFileUploadedRef.current?.(uploaded.signed_id);
    } catch (error) {
      console.error("Failed to upload file:", error);
      view.dispatch({ effects: removeUploadEffect.of({ id }) });
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadAndInsertFileRef = useRef(uploadAndInsertFile);
  uploadAndInsertFileRef.current = uploadAndInsertFile;

  // Initialize CodeMirror once; props are read through refs
  useEffect(() => {
    if (!containerRef.current) return;

    const handlePaste = (event: ClipboardEvent, view: EditorView): boolean => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return false;

      // Images / files in clipboard (screenshots, copied files)
      const fileItems = [...clipboardData.items].filter((item) =>
        item.type.startsWith("image/")
      );
      const files = fileItems.length > 0
        ? (fileItems.map((item) => item.getAsFile()).filter(Boolean) as File[])
        : [...clipboardData.files];

      if (files.length > 0) {
        event.preventDefault();
        (async () => {
          for (const file of files) {
            await uploadAndInsertFileRef.current(file);
          }
        })();
        return true;
      }

      // Auto-link pasted URLs
      if (!autoLinkOnPasteRef.current) return false;
      const text = clipboardData.getData("text/plain");
      if (!text || !isUrl(text)) return false;

      event.preventDefault();
      const url = text.trim();
      const { from, to } = view.state.selection.main;
      if (from !== to) {
        // Turn the selected text into a link to the pasted URL
        insertLink(view, url);
      } else {
        view.dispatch({
          changes: { from, insert: `[${url}](${url})` },
          selection: { anchor: from + url.length * 2 + 4 },
        });
      }
      return true;
    };

    const extensions: Extension[] = [
      history(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      placeholderExt(placeholder),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      editorTheme,
      uploadPlaceholderField,
      keymap.of([
        { key: "Mod-b", run: (view) => (toggleWrap(view, "**"), true) },
        { key: "Mod-i", run: (view) => (toggleWrap(view, "*"), true) },
        { key: "Mod-Shift-x", run: (view) => (toggleWrap(view, "~~"), true) },
        { key: "Tab", run: indentMore, shift: indentLess },
        // Mod-/ is the floating toolbar shortcut (handled by a container
        // keydown listener); swallow defaultKeymap's toggleComment so it
        // doesn't also insert an HTML comment
        { key: "Mod-/", run: () => true },
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString());
        }
        if (update.docChanged || update.selectionSet) {
          const pos = update.state.selection.main.head;
          const next = findTableAt(update.state, pos);
          setTableInfo((prev) => (sameTable(prev, next) ? prev : next));
        }
      }),
      EditorView.domEventHandlers({
        paste: (event, view) => handlePaste(event, view),
      }),
    ];

    const view = new EditorView({
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions,
      }),
      parent: containerRef.current,
    });
    viewRef.current = view;

    // Scroll events fire on scrollDOM and don't bubble, so
    // EditorView.domEventHandlers (registered on contentDOM) can't see them
    const handleScroll = () => {
      const dom = view.scrollDOM;
      const scrollable = dom.scrollHeight - dom.clientHeight;
      if (scrollable > 0) {
        onScrollRatioRef.current?.(dom.scrollTop / scrollable);
      }
      setScrollTick((tick) => tick + 1);
    };
    view.scrollDOM.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      view.scrollDOM.removeEventListener("scroll", handleScroll);
      view.destroy();
      viewRef.current = null;
    };
    // The view is created exactly once; live props are read via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect external value updates only when they differ from the doc.
  // Normal typing flows editor -> onChange -> value and is a no-op here,
  // so selection, undo history, and IME composition stay intact.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Floating toolbar (Cmd/Ctrl + /)
  const { isOpen, position, close } = useFloatingToolbar({
    containerRef,
    toolbarRef,
  });

  const handleToolbarAction = useCallback((action: ToolbarAction) => {
    const view = viewRef.current;
    if (!view) return;

    switch (action) {
      case "bold":
        toggleWrap(view, "**");
        break;
      case "strikethrough":
        toggleWrap(view, "~~");
        break;
      case "checkbox": {
        const { from } = view.state.selection.main;
        const insert = "\n- [ ] ";
        view.dispatch({
          changes: { from, insert },
          selection: { anchor: from + insert.length },
        });
        view.focus();
        break;
      }
      case "table": {
        const { from } = view.state.selection.main;
        view.dispatch({
          changes: { from, insert: TABLE_TEMPLATE },
          selection: { anchor: from + TABLE_TEMPLATE.indexOf("Column 1") },
        });
        view.focus();
        break;
      }
      case "link":
        insertLink(view);
        break;
      case "upload":
        fileInputRef.current?.click();
        break;
    }
  }, []);

  // Table operations (row/column add/delete via celldown)
  const handleTableOperation = useCallback((operation: TableOperation) => {
    const view = viewRef.current;
    if (!view) return;

    const info = findTableAt(view.state, view.state.selection.main.head);
    if (!info) return;

    try {
      const result = applyTableOperation(
        info.text,
        { line: info.cursorLine, ch: info.cursorCh },
        operation
      );

      const tableStartLine = view.state.doc.lineAt(info.from).number;
      view.dispatch({
        changes: { from: info.from, to: info.to, insert: result.table },
      });

      // Restore the cursor to the same cell (celldown reports the new position)
      const targetLine = view.state.doc.line(
        Math.min(tableStartLine + result.cursor.line, view.state.doc.lines)
      );
      const anchor = Math.min(targetLine.from + result.cursor.ch, targetLine.to);
      view.dispatch({ selection: { anchor } });
      view.focus();
    } catch (error) {
      console.error("Failed to apply table operation:", error);
    }
  }, []);

  const getTableToolbarPosition = useCallback((): { top: number; left: number } => {
    const view = viewRef.current;
    if (!view || !tableInfo) return { top: 0, left: 0 };

    const coords = view.coordsAtPos(tableInfo.from);
    if (!coords) return { top: 0, left: 0 };

    const toolbarHeight = 36;
    const toolbarWidth = 280;
    const padding = 8;

    let top = coords.top - toolbarHeight - padding;
    let left = coords.left;

    if (top < padding) {
      top = coords.bottom + padding;
    }
    if (left + toolbarWidth > window.innerWidth - padding) {
      left = window.innerWidth - toolbarWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    return { top, left };
  }, [tableInfo]);

  // Drag and drop file upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node | null;
    if (!containerRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    for (const file of Array.from(e.dataTransfer.files)) {
      await uploadAndInsertFileRef.current(file);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input so the same file can be selected again
      e.target.value = "";
      await uploadAndInsertFileRef.current(file);
    },
    []
  );

  return (
    <div
      className="relative h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div ref={containerRef} className={`h-full ${className ?? ""}`} lang="ja" />
      {isOpen && (
        <FloatingToolbar
          ref={toolbarRef}
          position={position}
          onAction={handleToolbarAction}
          onClose={close}
        />
      )}
      {tableInfo && (
        <TableToolbar
          position={getTableToolbarPosition()}
          onOperation={handleTableOperation}
          isHeaderRow={tableInfo.isHeaderRow}
          totalRows={tableInfo.totalRows}
          totalCols={tableInfo.totalCols}
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
      {uploadError && (
        <div className="absolute bottom-2 right-2 bg-red-500/10 px-3 py-1 rounded text-sm text-red-500 z-20">
          {uploadError}
        </div>
      )}
    </div>
  );
}
