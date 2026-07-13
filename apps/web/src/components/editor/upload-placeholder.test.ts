import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import {
  addUploadEffect,
  findUploadPos,
  removeUploadEffect,
  uploadPlaceholderField,
} from "./upload-placeholder";

function createState(doc = ""): EditorState {
  return EditorState.create({ doc, extensions: [uploadPlaceholderField] });
}

function addUpload(state: EditorState, id: number, pos: number): EditorState {
  return state.update({ effects: addUploadEffect.of({ id, pos }) }).state;
}

describe("upload placeholder position tracking", () => {
  it("remembers the reserved position", () => {
    const state = addUpload(createState("hello world"), 1, 5);

    expect(findUploadPos(state, 1)).toBe(5);
  });

  it("returns null for unknown ids", () => {
    const state = addUpload(createState("hello"), 1, 2);

    expect(findUploadPos(state, 99)).toBeNull();
  });

  it("shifts the position when text is inserted before it", () => {
    let state = addUpload(createState("hello world"), 1, 5);
    state = state.update({ changes: { from: 0, insert: ">>> " } }).state;

    expect(findUploadPos(state, 1)).toBe(9);
  });

  it("keeps the position when text is inserted after it", () => {
    let state = addUpload(createState("hello world"), 1, 5);
    state = state.update({ changes: { from: 11, insert: "!!!" } }).state;

    expect(findUploadPos(state, 1)).toBe(5);
  });

  it("follows deletions that remove text before the position", () => {
    let state = addUpload(createState("hello world"), 1, 6);
    state = state.update({ changes: { from: 0, to: 3 } }).state;

    expect(findUploadPos(state, 1)).toBe(3);
  });

  it("survives an insert-then-undo style roundtrip", () => {
    let state = addUpload(createState("hello world"), 1, 5);
    state = state.update({ changes: { from: 2, insert: "abc" } }).state;
    state = state.update({ changes: { from: 2, to: 5 } }).state;

    expect(findUploadPos(state, 1)).toBe(5);
  });

  it("drops the placeholder when the surrounding text is deleted", () => {
    let state = addUpload(createState("hello world"), 1, 5);
    state = state.update({ changes: { from: 2, to: 9 } }).state;

    // The reservation is gone; callers fall back to the current cursor
    expect(findUploadPos(state, 1)).toBeNull();
  });

  it("removes the placeholder on removeUploadEffect", () => {
    let state = addUpload(createState("hello"), 1, 2);
    state = state.update({ effects: removeUploadEffect.of({ id: 1 }) }).state;

    expect(findUploadPos(state, 1)).toBeNull();
  });

  it("tracks concurrent uploads independently", () => {
    let state = createState("first line\nsecond line");
    state = addUpload(state, 1, 3);
    state = addUpload(state, 2, 15);

    // Resolve upload 1: insert markdown at its position and remove it
    state = state.update({
      changes: { from: 3, insert: "![img](url)\n\n" },
      effects: removeUploadEffect.of({ id: 1 }),
    }).state;

    expect(findUploadPos(state, 1)).toBeNull();
    // Upload 2 shifted by the inserted text
    expect(findUploadPos(state, 2)).toBe(15 + "![img](url)\n\n".length);
  });
});
