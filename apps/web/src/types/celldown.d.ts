declare module "celldown.js" {
  export interface CelldownCursor {
    line: number;
    ch: number;
  }

  export interface CelldownResult {
    table: string;
    cursor: CelldownCursor;
  }

  export interface CelldownTable {
    addRows(index: number | null, count?: number): CelldownTable;
    addCols(index: number | null, count?: number): CelldownTable;
    addRowsBeforeCursor(count?: number): CelldownTable;
    addRowsAfterCursor(count?: number): CelldownTable;
    addColsBeforeCursor(count?: number): CelldownTable;
    addColsAfterCursor(count?: number): CelldownTable;
    /** Remove rows starting at index. If index is null, uses cursor position. */
    removeRows(index: number | null, count?: number): CelldownTable;
    /** Remove columns starting at index. If index is null, uses cursor position. */
    removeCols(index: number | null, count?: number): CelldownTable;
    beautify(): CelldownTable;
    get(): CelldownResult;
  }

  export interface CelldownConfig {
    rows?: number;
    cols?: number;
    extraPipes?: boolean;
    extraSpaces?: boolean;
    autoBeautify?: boolean;
  }

  export interface Celldown {
    fromText(text: string, cursor?: CelldownCursor): CelldownTable;
    empty(cols?: number, rows?: number): CelldownTable;
    setConfig(config: CelldownConfig): void;
  }

  const celldown: Celldown;
  export default celldown;
}
