# 0012 Separate Note Visibility from Lifecycle State

Date: 2026-03-03

## Status

Proposed

---

## Context

The Note model in Shuriken Note manages both visibility and lifecycle through a single `status` column.

```ruby
enum :status, { personal: 'personal', published: 'published', archived: 'archived' }
```

- `personal`: Only the owner can view and edit
- `published`: Anyone with the URL can view (`/p/:id`)
- `archived`: Soft-deleted (hidden from active views)

This design has the following problems.

### 1. Mixed Concerns in a Single Column

`personal` and `published` represent **visibility** (who can access the note),
while `archived` represents **lifecycle** (whether the note is active).
These two orthogonal concerns are packed into a single enum, preventing them from being changed independently.

For example, when a published note is archived and later restored,
the original visibility state is lost because archiving overwrites it.

### 2. Special-Casing in `effective_status`

The current `effective_status` method handles `archived?` as a special case before evaluating visibility,
implicitly acknowledging that lifecycle and visibility are fundamentally different concerns.

```ruby
def effective_status
  return 'archived' if archived?
  return parent.effective_status if parent.present?
  status
end
```

### 3. Need for a New Visibility Tier

A new feature is planned to publicly list notes under `/articles` (blog-style publishing).
This introduces a third visibility level.

| Level | Meaning |
|-------|---------|
| `personal` | Only the owner can access |
| `unlisted` | Anyone with the URL can access (current `published` behavior) |
| `public` | Listed on `/articles` and accessible by anyone |

Adding `public` to the existing `status` enum would result in four values
(`personal`, `unlisted`, `public`, `archived`), further deepening the mixed-concern problem.

---

## Decision

Replace the `status` column with two independent fields.

### visibility

| Value | Meaning |
|-------|---------|
| `personal` | Only the owner can access (default) |
| `unlisted` | Anyone with the URL can access |
| `public` | Listed on `/articles` and accessible by anyone |

- Type: string enum
- NOT NULL, default: `personal`

### archived

| Value | Meaning |
|-------|---------|
| `false` | Active note (default) |
| `true` | Archived (hidden) |

- Type: boolean
- NOT NULL, default: `false`

### Routing and Visibility Mapping

| Path | Target | Authentication |
|------|--------|----------------|
| `/p/:id` | Notes with `visibility: unlisted` or `public` | Not required |
| `/articles` | List of notes with `visibility: public` | Not required |
| `/articles/:id` | Single note with `visibility: public` | Not required |

### Model Changes

`effective_status` is replaced by `effective_visibility` and `effectively_archived?`.
Since `archived` becomes an independent field, the special-casing is eliminated.

```ruby
# Before
def effective_status
  return 'archived' if archived?
  return parent.effective_status if parent.present?
  status
end

# After
def effective_visibility
  return parent.effective_visibility if parent.present?
  visibility
end

def effectively_archived?
  return true if archived?
  return parent.effectively_archived? if parent.present?
  false
end
```

---

## Rationale

### Separation of Concerns

"Who can access a note" and "whether a note is active" are independent concepts.
Managing them in separate fields ensures that changes to one do not affect the other.

### Orthogonal State

The separation allows all combinations to be represented naturally.

| visibility | archived | Meaning |
|------------|----------|---------|
| personal | false | Normal personal note |
| personal | true | Archived personal note |
| unlisted | false | Shared via URL |
| unlisted | true | Archived while preserving share state (no re-publishing needed on restore) |
| public | false | Listed on `/articles` |
| public | true | Archived while preserving listing state (no re-listing needed on restore) |

The current `status` enum cannot represent states like "published and archived",
causing the original visibility to be lost when a note is archived.

### Future Extensibility

New visibility values (e.g., `team`) can be added without affecting the `archived` logic.

---

## Alternatives Considered

### Alternative A: Add `blog` to the Existing `status` Enum

```ruby
enum :status, { personal, published, blog, archived }
```

**Pros**
- Minimal change (one migration + small code updates)
- Low impact on existing tests and API

**Cons**
- Further deepens the mixed-concern problem
- Cannot represent "blog and archived" state
- `effective_status` special-casing becomes more complex
- The same problem recurs if additional visibility levels are needed

---

### Alternative B: Keep `status` and Add a `listed` Boolean

```ruby
# status: personal | published | archived
# listed: boolean (shown on /articles when published and listed)
```

**Pros**
- No changes to the existing `status` column
- Smaller change scope

**Cons**
- `listed` is only meaningful when `status` is `published`, creating an implicit dependency
- Does not resolve the mixed-concern problem between `archived` and visibility
- Defers the fundamental design issue rather than solving it

---

## Consequences

### Positive

- Visibility and lifecycle become independent operations
- Original visibility is preserved across archive/restore cycles
- `/articles` listing page can be implemented naturally
- Adding new visibility levels in the future is straightforward
- Extends the authorization model from ADR 0005 with a new public listing tier

### Negative / Constraints

- Requires migration from the existing `status` column
  - Data conversion: `personal` → `visibility: personal`, `published` → `visibility: unlisted`, `archived` → `archived: true`
  - API response changes (`status` → `visibility` + `archived`)
  - Frontend updates (sidebar, header, etc.)
- May require revisiting ADR 0011 (No Slug for Notes)
  - Whether to use UUID or introduce slugs for `/articles/:id`

---

## Notes

- This ADR extends ADR 0005 (Authorization Strategy)
  - The authorization model gains a new tier: public listing for unauthenticated users
- ADR 0011 (No Slug for Notes) noted that "if published notes require slugs later, they can be added specifically for that feature when requirements are clearer" — the introduction of `/articles` may be the right time to revisit that decision
- The migration must be designed to be reversible

---
