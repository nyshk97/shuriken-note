import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";

/**
 * Table lookup backed by the markdown syntax tree (GFM).
 *
 * Using the tree instead of scanning for `|` characters means pipes
 * inside fenced code blocks, blockquotes, or plain prose are never
 * mistaken for a table.
 */

export interface TableInfo {
  /** Document offset where the table starts */
  from: number;
  /** Document offset where the table ends */
  to: number;
  /** The table markdown text */
  text: string;
  /** Whether the cursor is on the header row */
  isHeaderRow: boolean;
  /** Header + data rows (delimiter row not counted) */
  totalRows: number;
  /** Number of columns in the header row */
  totalCols: number;
  /** Cursor line relative to the table start (0 = header) */
  cursorLine: number;
  /** Cursor character offset within its line */
  cursorCh: number;
}

const PARSE_TIMEOUT_MS = 100;

function tableNodeAt(state: EditorState, pos: number): SyntaxNode | null {
  const tree =
    ensureSyntaxTree(state, state.doc.length, PARSE_TIMEOUT_MS) ??
    syntaxTree(state);

  for (
    let node: SyntaxNode | null = tree.resolveInner(pos, -1);
    node;
    node = node.parent
  ) {
    if (node.name === "Table") return node;
  }
  return null;
}

export function findTableAt(state: EditorState, pos: number): TableInfo | null {
  const table = tableNodeAt(state, pos);
  if (!table) return null;

  const header = table.getChild("TableHeader");
  const dataRows = table.getChildren("TableRow");
  const headerCells = header?.getChildren("TableCell") ?? [];

  const tableStartLine = state.doc.lineAt(table.from);
  const cursorLineInfo = state.doc.lineAt(pos);
  const cursorLine = cursorLineInfo.number - tableStartLine.number;

  return {
    from: table.from,
    to: table.to,
    text: state.sliceDoc(table.from, table.to),
    isHeaderRow: cursorLine === 0,
    totalRows: 1 + dataRows.length,
    totalCols: Math.max(headerCells.length, 1),
    cursorLine,
    cursorCh: pos - cursorLineInfo.from,
  };
}
