# Product Vision — Shuriken Note

## Purpose

Shuriken Note is a personal product built to create a note system optimized for my own needs — a system that contains only the features I truly require.

Existing multi-functional note tools (especially Notion) are powerful and well-designed, but they introduce recurring friction:

- Too many features leading to unnecessary complexity
- Heavy and slow interactions
- Unused options and UI elements constantly visible

These small frustrations accumulate into a simple desire:
to have a note system tailored specifically to myself.

Shuriken Note is my attempt to build:

**“The ultimate memo app I actually want to use.”**

It is a personally tuned note environment designed around clarity, speed, and focus.

---

## Core Concept

- A simple note experience with unnecessary features removed
- Always fast, never waiting for interactions
- A UI that minimizes visual noise and preserves focus
- The ability to publish pages externally when needed

Rather than maximizing functionality, Shuriken Note prioritizes:

**“No confusion, fast interaction, quiet interface, deep focus.”**

---

## Design Principles

- Keep features minimal
  New features are added cautiously, never by default.

- Minimize on-screen information
  Avoid unnecessary menus, options, and decoration.

- Keep page structure simple
  No complex hierarchies or database-style content management.

- Ensure core interactions are always fast
  Browsing, searching, and editing notes must feel instantaneous.

---

## Editor Experience

Shuriken Note does not adopt the typical split-view Markdown editor
with raw text on the left and preview on the right.

Instead, it uses a:

**Single-column, in-place editing experience where Markdown input is transformed into formatted content in real time.**

This approach is inspired by the strengths of Notion’s editor:

- Minimal eye movement
- Writing and reading happen in the same space
- No need to consciously switch into “preview mode”

Shuriken Note aims to combine the expressive power of Markdown
with immediate visual feedback close to a WYSIWYG experience.

---

## Persistence (Auto-save)

Shuriken Note is designed so that users never have to think about saving.

Edits are automatically persisted in near real-time,
allowing writing to flow without interruption.

- True real-time sync is not required
- Auto-save intervals of roughly 3–5 seconds are sufficient
- The key requirement is that content is never lost

This is based on the belief that note-taking is primarily an act of thinking,
and explicit save operations introduce unnecessary cognitive noise.

---

## Non-Goals

Shuriken Note intentionally does **not** implement:

- Block-based editors like Notion
- Team workspaces or collaborative editing
- Mentions or inline comments
- Database-style tables and views
- Complex page layouts or custom content blocks
- Large-scale permission management systems

These features tend to introduce complexity that conflicts with the core philosophy of simplicity and focus.

---

## Markdown Policy

Notes are written in Markdown.

Standard Markdown syntax is broadly supported so that everyday memo writing, technical notes, checklists, and code snippets can be created without friction.

In particular, the following are required:

- Checklists
- Code blocks with language-specific syntax highlighting
- Natural Japanese input and text rendering

At the same time, Shuriken Note avoids proprietary block syntax or highly interactive block-level editor mechanics found in tools like Notion.

Avoiding excessive Markdown extensions is essential to preserving simplicity.

---

## Target User

The primary user is **myself**.

However, the project also aims to be usable by others who share a similar mindset —
by cloning the repository and hosting their own instance.

In that sense, Shuriken Note also seeks to provide:

**A reproducible, personally optimized note environment.**

---

## Future Considerations

Future expansion is not rejected,
but any additions must remain consistent with this Vision and the Design Principles.
