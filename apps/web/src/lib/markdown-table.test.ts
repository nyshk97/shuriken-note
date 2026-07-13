import { describe, expect, it } from "vitest";
import { applyTableOperation } from "./markdown-table";

const TABLE = `| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |`;

function rowsOf(table: string): string[] {
  return table.split("\n").filter((line) => line.trim().length > 0);
}

describe("applyTableOperation", () => {
  it("adds a row below the cursor row", () => {
    const result = applyTableOperation(TABLE, { line: 2, ch: 2 }, "addRowBelow");

    expect(rowsOf(result.table)).toHaveLength(5); // header + delimiter + 3 rows
    expect(result.table).toContain("Alice");
    expect(result.table).toContain("Bob");
  });

  it("adds a row above the cursor row", () => {
    const result = applyTableOperation(TABLE, { line: 2, ch: 2 }, "addRowAbove");

    const rows = rowsOf(result.table);
    expect(rows).toHaveLength(5);
    // The new empty row sits between the delimiter and Alice
    expect(rows[3]).toContain("Alice");
  });

  it("deletes the cursor row", () => {
    const result = applyTableOperation(TABLE, { line: 2, ch: 2 }, "deleteRow");

    expect(result.table).not.toContain("Alice");
    expect(result.table).toContain("Bob");
  });

  it("adds a column to the right of the cursor column", () => {
    const result = applyTableOperation(TABLE, { line: 0, ch: 2 }, "addColRight");

    const header = rowsOf(result.table)[0];
    expect(header.split("|").filter((cell) => cell !== "").length).toBe(3);
    expect(header).toContain("Name");
  });

  it("deletes the cursor column", () => {
    const result = applyTableOperation(TABLE, { line: 0, ch: 2 }, "deleteCol");

    expect(result.table).not.toContain("Name");
    expect(result.table).toContain("Age");
  });

  it("reports the updated cursor position", () => {
    const result = applyTableOperation(TABLE, { line: 2, ch: 2 }, "addRowAbove");

    expect(result.cursor.line).toBeGreaterThanOrEqual(0);
    expect(typeof result.cursor.ch).toBe("number");
  });
});
