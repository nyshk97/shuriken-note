# Feature Matrix — Shuriken Note

## Principles

Features are organized into four status categories:

- **Now**   — Must be implemented in the MVP
- **Next**  — Planned immediately after MVP
- **Later** — Possible future additions
- **Never** — Explicit non-goals

When in doubt, Vision and Note Organization documents take priority.

---

## Feature List

| Feature                                   | Status | Why                           | Notes                                            |
| ----------------------------------------- | ------ | ----------------------------- | ------------------------------------------------ |
| Create / edit notes                       | Now    | Core note-taking capability   | Markdown-based                                   |
| Auto-save (3–5s interval)                 | Now    | Remove manual save friction   | No explicit save action                          |
| Sidebar (Private / Public / Archived)     | Now    | Minimal navigation structure  | No user-defined folders                          |
| Public note publishing                    | Now    | External sharing              | Read-only                                        |
| Public note URL (`/p/{slug}-{uuid}`)      | Now    | External sharing              | Slug for readability, UUID for stability         |
| Note archiving                            | Now    | Reduce UI noise               | Parent → child propagation, reversible           |
| Permanent note deletion                   | Later  | Data cleanup                  | Only from Archived state, parent → child cascade |
| Standard Markdown support                 | Now    | Daily and technical notes     | Checklists, code blocks with syntax highlighting |
| In-place Markdown editor                  | Now    | Notion-like editing flow      | No split preview                                 |
| Full-text search                          | Now    | Primary note retrieval        | PostgreSQL Full Text Search                      |
| Internal note identifier (UUID)           | Now    | Prevent link breakage         | Internal references always use UUID              |
| Automatic slug generation                 | Now    | Human-readable URLs           | Derived from title, changeable                   |
| Web application                           | Now    | Browser access                | Next.js                                          |
| iOS application                           | Next   | Mobile access and editing     | SwiftUI                                          |
| Internal note linking `[[...]]`           | Later  | Navigate to sub-notes         | Allows unresolved links, UUID-based internally   |
| Parent-child note structure (max depth 2) | Later  | Semantic grouping             | parent_note_id                                   |
| Permission inheritance                    | Later  | Avoid ACL complexity          | Child follows parent visibility                  |
| Archive inheritance                       | Later  | Unified lifecycle handling    | Child follows parent archive state               |
| Private share links (`/s/{token}`)        | Later  | Limited sharing               | Random token based                               |
| Block-based editor                        | Never  | Introduces complexity         | Non-goal                                         |
| Unlimited folder hierarchy                | Never  | Structural overhead           | Non-goal                                         |
| Database-style views                      | Never  | Notion-like complexity        | Non-goal                                         |
| Collaborative editing                     | Never  | Against personal optimization | Non-goal                                         |

---

## Notes

- Features in **Later** move to **Next** only when their necessity becomes clear
- **Non-goals** remain excluded unless Vision changes
- If structural policy changes, update **Note Organization** before modifying this list
