import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

const JAPANESE_SANS = [
  '"Noto Sans JP"',
  '"Hiragino Kaku Gothic ProN"',
  '"Hiragino Sans"',
  '"Yu Gothic UI"',
  '"Meiryo"',
  "-apple-system",
  "BlinkMacSystemFont",
  "sans-serif",
].join(", ");

const MONOSPACE = ['"SF Mono"', '"Fira Code"', '"Consolas"', '"Menlo"', "monospace"].join(
  ", "
);

const workspaceTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      backgroundColor: "transparent",
      color: "var(--workspace-text-primary)",
      fontSize: "1rem",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      fontFamily: JAPANESE_SANS,
      lineHeight: "1.8",
    },
    ".cm-content": {
      padding: "8px 0 50vh",
      caretColor: "var(--workspace-text-primary)",
    },
    ".cm-line": {
      padding: "0 4px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--workspace-text-primary)",
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection":
      {
        backgroundColor: "rgba(35, 131, 226, 0.28)",
      },
    ".cm-placeholder": {
      color: "var(--workspace-text-tertiary)",
    },
    ".cm-upload-placeholder": {
      color: "var(--workspace-text-secondary)",
      fontStyle: "italic",
      padding: "0 2px",
    },
  },
  { dark: true }
);

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "700", color: "#ffffff" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.link, color: "var(--workspace-accent)" },
  { tag: tags.url, color: "var(--workspace-accent)" },
  { tag: tags.monospace, fontFamily: MONOSPACE, fontSize: "0.9em" },
  { tag: tags.quote, color: "var(--workspace-text-secondary)" },
  { tag: tags.processingInstruction, color: "var(--workspace-text-secondary)" },
  { tag: tags.meta, color: "var(--workspace-text-secondary)" },
  { tag: tags.contentSeparator, color: "var(--workspace-text-secondary)" },
]);

export const editorTheme = [workspaceTheme, syntaxHighlighting(markdownHighlightStyle)];
