import celldown from "celldown.js";
import type { CelldownCursor, CelldownResult } from "celldown.js";

export type { CelldownCursor };

export interface TableRange {
  /** Start line index in the full markdown (0-based) */
  startLine: number;
  /** End line index in the full markdown (0-based, inclusive) */
  endLine: number;
  /** The table markdown text */
  text: string;
}

/**
 * Extract a markdown table from the full content based on cursor position.
 * Returns the table text and its line range within the full content.
 */
export function extractTableAtCursor(
  markdown: string,
  cursorLine: number
): TableRange | null {
  const lines = markdown.split("\n");

  // Check if cursor is on a table line
  if (!isTableLine(lines[cursorLine])) {
    return null;
  }

  // Find table boundaries by expanding up and down
  let startLine = cursorLine;
  let endLine = cursorLine;

  // Expand upward to find table start
  while (startLine > 0 && isTableLine(lines[startLine - 1])) {
    startLine--;
  }

  // Expand downward to find table end
  while (endLine < lines.length - 1 && isTableLine(lines[endLine + 1])) {
    endLine++;
  }

  // Validate it's actually a table (needs at least header + separator)
  const tableLines = lines.slice(startLine, endLine + 1);
  if (tableLines.length < 2) {
    return null;
  }

  // Check for separator row (second line should be like |---|---|)
  const separatorIndex = 1;
  if (!isSeparatorLine(tableLines[separatorIndex])) {
    return null;
  }

  return {
    startLine,
    endLine,
    text: tableLines.join("\n"),
  };
}

/**
 * Check if a line looks like part of a markdown table
 */
function isTableLine(line: string | undefined): boolean {
  if (!line) return false;
  // A table line contains at least one pipe and is not empty
  return line.includes("|") && line.trim().length > 0;
}

/**
 * Check if a line is a table separator (e.g., |---|---|)
 */
function isSeparatorLine(line: string): boolean {
  // Separator line contains only |, -, :, and whitespace
  return /^[\s|:\-]+$/.test(line) && line.includes("-");
}

/**
 * Replace a table in the full markdown content with a new table.
 */
export function replaceTableInMarkdown(
  markdown: string,
  range: TableRange,
  newTable: string
): string {
  const lines = markdown.split("\n");
  const before = lines.slice(0, range.startLine);
  const after = lines.slice(range.endLine + 1);

  return [...before, newTable, ...after].join("\n");
}

/**
 * Convert cursor position from full markdown to table-relative position.
 */
export function toTableCursor(
  fullCursorLine: number,
  fullCursorCh: number,
  tableStartLine: number
): CelldownCursor {
  return {
    line: fullCursorLine - tableStartLine,
    ch: fullCursorCh,
  };
}

/**
 * Convert cursor position from table-relative to full markdown position.
 */
export function toFullCursor(
  tableCursor: CelldownCursor,
  tableStartLine: number
): { line: number; ch: number } {
  return {
    line: tableCursor.line + tableStartLine,
    ch: tableCursor.ch,
  };
}

export type TableOperation =
  | "addRowAbove"
  | "addRowBelow"
  | "deleteRow"
  | "addColLeft"
  | "addColRight"
  | "deleteCol";

/**
 * Apply a table operation using celldown.
 * Returns the new table text and updated cursor position.
 */
export function applyTableOperation(
  tableText: string,
  cursor: CelldownCursor,
  operation: TableOperation
): CelldownResult {
  const table = celldown.fromText(tableText, cursor);

  switch (operation) {
    case "addRowAbove":
      table.addRowsBeforeCursor(1);
      break;
    case "addRowBelow":
      table.addRowsAfterCursor(1);
      break;
    case "deleteRow":
      // Pass null to delete at cursor position
      table.removeRows(null, 1);
      break;
    case "addColLeft":
      table.addColsBeforeCursor(1);
      break;
    case "addColRight":
      table.addColsAfterCursor(1);
      break;
    case "deleteCol":
      // Pass null to delete at cursor position
      table.removeCols(null, 1);
      break;
  }

  return table.beautify().get();
}

/**
 * Get the cursor line and character position from the editor value and DOM selection.
 * This converts the DOM selection position to line/character coordinates.
 */
export function getCursorPositionInMarkdown(
  markdown: string,
  selection: Selection
): { line: number; ch: number } | null {
  if (!selection.anchorNode) return null;

  // Get the text content up to the cursor
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();

  // Find the contenteditable container
  let container: Node | null = selection.anchorNode;
  while (
    container &&
    !(container instanceof HTMLElement && container.contentEditable === "true")
  ) {
    container = container.parentNode;
  }

  if (!container) return null;

  preCaretRange.selectNodeContents(container);
  preCaretRange.setEnd(range.startContainer, range.startOffset);

  // Count characters up to cursor
  const textBeforeCursor = preCaretRange.toString();
  const totalChars = textBeforeCursor.length;

  // Convert to line/ch
  const lines = markdown.split("\n");
  let charCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1; // +1 for newline
    if (charCount + lineLength > totalChars) {
      return {
        line: i,
        ch: totalChars - charCount,
      };
    }
    charCount += lineLength;
  }

  // Cursor at end
  return {
    line: lines.length - 1,
    ch: lines[lines.length - 1].length,
  };
}
