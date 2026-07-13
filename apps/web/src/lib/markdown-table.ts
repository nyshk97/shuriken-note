import celldown from "celldown.js";
import type { CelldownCursor, CelldownResult } from "celldown.js";

export type { CelldownCursor, CelldownResult };

export type TableOperation =
  | "addRowAbove"
  | "addRowBelow"
  | "deleteRow"
  | "addColLeft"
  | "addColRight"
  | "deleteCol";

/**
 * Apply a table operation using celldown.
 *
 * `tableText` must be a valid markdown table (header + delimiter +
 * rows); locating the table inside a document is the caller's job
 * (see components/editor/table-range.ts, which uses the markdown
 * syntax tree so pipes in code blocks or prose are never mistaken
 * for tables).
 *
 * `cursor` is relative to the table text (line 0 = header row).
 * Returns the new table text and the updated cursor position.
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
