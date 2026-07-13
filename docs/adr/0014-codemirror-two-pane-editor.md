# 0014 Switch to a CodeMirror 6 Two-Pane Markdown Editor

Date: 2026-07-13

## Status

Accepted

Supersedes [0010 Markdown Editor Library Selection](0010-markdown-editor-selection.md)

## Context

ADR 0010 adopted Vditor in IR (Instant Rendering) mode to provide a Typora-like single-column editing experience. After roughly six months of daily use, structural problems with the IR approach became clear.

### Problems observed in production use

1. **Editing bugs rooted in Markdown-DOM synchronization**: Operations frequently misbehaved — for example, list items that could not be deleted with backspace. The root cause is IR mode itself: every edit must be synchronized between the Markdown source and the rich DOM, and that sync layer is where the bugs live.
2. **Accumulated workarounds**: Because `insertValue`/`setValue` destroy the cursor and scroll position, the wrapper needed multi-step hacks — inserting marker strings, restoring the cursor with a `TreeWalker`, saving/restoring `scrollTop` — including a dependency on the private `vditor.vditor.ir.element` API.
3. **DOM-based table detection**: Table editing could not be trusted to the IR DOM, so the wrapper re-parsed the Markdown text and replaced the whole document (~400 lines of detour code).
4. **CSS override burden**: More than 36 `!important` overrides in `globals.css` were needed to fight Vditor's styles.
5. **Editor / published view divergence**: The editor rendering (Vditor) and the public page rendering (react-markdown) were separate implementations that never looked quite the same.

## Decision

Move to a **two-pane layout: plain-Markdown editing with CodeMirror 6 on the left, and a live preview rendered by the exact pipeline used on public pages on the right.**

- Left pane: CodeMirror 6 (`@codemirror/lang-markdown` with the GFM syntax tree, list continuation, a custom dark theme)
- Right pane: the existing `MarkdownViewer variant="public"` on a light surface, so the preview looks literally identical to the published page
- Edit / Split / View mode toggle (persisted to localStorage; single pane with tabs on mobile)

### Design highlights

1. **Separate editing from rendering**: Plain-text editing eliminates the Markdown-DOM sync problem class entirely rather than patching individual bugs.
2. **Parity with public pages**: The preview shares the react-markdown pipeline with public pages, guaranteeing that what you see while editing is what gets published.
3. **Async upload position tracking**: A `StateField` with a widget decoration reserves the insertion point when an upload starts. CodeMirror's position mapping keeps the reservation correct through typing, undo, and concurrent uploads — replacing the old marker-string hack.
4. **Syntax-tree-based table detection**: Tables are identified via the GFM parser's `Table` nodes, so pipes inside code blocks or prose are never misdetected.
5. **Controlled-update contract**: The `EditorView` is created exactly once; the `value` prop is applied only for genuine external updates. Normal typing never resets the document, keeping IME composition, undo history, and selection intact.

## Alternatives Considered

### Vditor `sv` (split view) mode

- **Pros**: Minimal change
- **Cons**: Keeps the Vditor dependency, and its preview still renders differently from public pages
- **Conclusion**: Does not address the root cause

### Another IR/WYSIWYG library (Milkdown, Tiptap, etc.)

- **Pros**: Preserves the single-column experience
- **Cons**: Japanese IME issues were already a concern in the ADR 0010 evaluation, and the sync problem class inherent to instant rendering remains
- **Conclusion**: High risk of repeating the same failure mode

### Plain textarea + preview

- **Pros**: Zero dependencies
- **Cons**: Syntax highlighting, list continuation, undo management, and position tracking would all need to be hand-rolled
- **Conclusion**: CodeMirror 6's primitives (position mapping, syntax tree) provide exactly the infrastructure this feature set needs

## Consequences

### Benefits

- The synchronization layer that caused the editing bugs is gone
- Roughly 1,000 lines of workarounds and all Vditor CSS overrides were deleted
- Preview and published output are rendered by the same code path
- The position-mapping and table-detection helpers are pure and now covered by unit tests (vitest was introduced with this change)

### Drawbacks / Risks

- The Typora-like "formatting as you type" experience is gone; markup stays visible in the editing pane
- Images are only visible in the preview pane
- Split mode consumes horizontal space (mobile falls back to tabbed single-pane)
