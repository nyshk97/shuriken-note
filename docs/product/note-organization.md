# Note Organization

## Background

- The experience of “escaping into separate pages” in Notion is valuable for organizing complex thoughts.
- However, Notion’s block-based editor model and deeply nested hierarchy management introduce complexity that Shuriken Note intentionally avoids.
- The product Vision prioritizes simplicity, speed, and minimal UI noise, which must be preserved.

## Sidebar Structure Decision

- The sidebar contains only three fixed top-level categories:
  - Private
  - Public
  - Archived
- Users cannot create arbitrary folders.
- This ensures users never have to decide “where to place a note” beyond these minimal, meaningful categories.

## Note Hierarchy Policy

- Notes are stored in a fundamentally flat structure.
- Each note may optionally have a `parent_note_id`.
- Maximum hierarchy depth is limited to two levels (parent → child; no grandchildren).
- The parent-child relationship exists to provide semantic grouping and to support permission and archive state inheritance.

## Inline Child Note Linking

- Notes may reference child notes from arbitrary positions within their content.
- Block-based page embedding (as seen in Notion) is not adopted.
- Instead, child notes are referenced via a Markdown-style internal link syntax:
  - Example: `[[child-note-title]]`
- These references are rendered as normal links; clicking navigates to the child note.

- If a referenced child note does not yet exist, it is displayed as an unresolved link, leaving room for future behavior such as offering to create a new note on interaction.

## Permission and Archive Inheritance

- Child notes inherit the visibility (Private / Public) of their parent.
- When a parent note is moved to Archived, its child notes are treated as Archived as well.
- This avoids introducing complex access-control or lifecycle management rules.

## Rejected Alternatives

- Unlimited depth tree hierarchies
- Drag-and-drop hierarchical organization
- Block-level embedded sub-pages
- Tag-based multi-level classification systems

These alternatives were rejected to prevent structural and UI complexity from growing beyond the intended simplicity of the product.

## Future Revisit Conditions

- If the total number of notes grows to a point where search or listing becomes insufficient.
- If long-term personal usage reveals a strong need for deeper hierarchical organization.
