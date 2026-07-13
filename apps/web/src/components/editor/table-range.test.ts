import { describe, expect, it } from "vitest";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { findTableAt } from "./table-range";

const TABLE = `| Name | Age | City |
|------|-----|------|
| Alice | 30 | Tokyo |
| Bob | 25 | Osaka |`;

function stateWith(doc: string): EditorState {
  return EditorState.create({
    doc,
    extensions: [markdown({ base: markdownLanguage })],
  });
}

describe("findTableAt", () => {
  it("finds a table when the cursor is in the header row", () => {
    const state = stateWith(TABLE);
    const pos = TABLE.indexOf("Name");

    const info = findTableAt(state, pos);

    expect(info).not.toBeNull();
    expect(info!.from).toBe(0);
    expect(info!.text).toBe(TABLE);
    expect(info!.isHeaderRow).toBe(true);
    expect(info!.cursorLine).toBe(0);
    expect(info!.totalRows).toBe(3); // header + 2 data rows
    expect(info!.totalCols).toBe(3);
  });

  it("finds a table when the cursor is in a data row", () => {
    const state = stateWith(TABLE);
    const pos = TABLE.indexOf("Bob");

    const info = findTableAt(state, pos);

    expect(info).not.toBeNull();
    expect(info!.isHeaderRow).toBe(false);
    expect(info!.cursorLine).toBe(3); // header, delimiter, Alice, Bob
  });

  it("reports document offsets for a table that is not at the start", () => {
    const prefix = "# Heading\n\nSome intro text.\n\n";
    const doc = prefix + TABLE + "\n\nTrailing paragraph.";
    const state = stateWith(doc);

    const info = findTableAt(state, doc.indexOf("Alice"));

    expect(info).not.toBeNull();
    expect(info!.from).toBe(prefix.length);
    expect(info!.text).toBe(TABLE);
  });

  it("ignores pipes inside fenced code blocks", () => {
    const doc = "```\n| not | a | table |\n|-----|---|-------|\n| a | b | c |\n```";
    const state = stateWith(doc);

    expect(findTableAt(state, doc.indexOf("not"))).toBeNull();
  });

  it("ignores pipes in plain prose", () => {
    const doc = "This sentence contains a pipe | in the middle.";
    const state = stateWith(doc);

    expect(findTableAt(state, doc.indexOf("pipe"))).toBeNull();
  });

  it("ignores pipes in blockquoted prose", () => {
    const doc = "> quoted text with a | pipe\n> and another | one";
    const state = stateWith(doc);

    expect(findTableAt(state, doc.indexOf("pipe"))).toBeNull();
  });

  it("returns null when the cursor is outside the table", () => {
    const doc = "Intro paragraph.\n\n" + TABLE;
    const state = stateWith(doc);

    expect(findTableAt(state, 3)).toBeNull();
  });
});
