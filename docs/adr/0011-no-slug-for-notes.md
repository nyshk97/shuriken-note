# 0011 No Slug for Notes - Use UUID Only

Date: 2026-01-15

## Status

Accepted

## Context

Issue #14 proposed implementing automatic slug generation for notes to provide URL-friendly identifiers. Slugs are typically used for:

- SEO optimization (search engines can infer content from URLs)
- Human-readable URLs for sharing
- Memorable URLs for direct access

However, after analysis, we determined that slugs are not necessary for this application:

1. **Personal notes don't need SEO** - The primary use case is personal note-taking (`status: personal`), which doesn't benefit from search engine optimization.

2. **UUID is sufficient for identification** - UUIDs provide globally unique, collision-free identifiers without additional logic for handling duplicates.

3. **Many successful apps use UUID-only URLs** - Notion, Google Docs, and Figma all use opaque IDs rather than slugs.

4. **Slug implementation adds complexity** - Duplicate handling (suffixes like `-1`, `-2`), format validation, and scope decisions (user-level vs global uniqueness) add unnecessary code.

5. **Future flexibility** - If published notes require slugs later, they can be added specifically for that feature when requirements are clearer.

## Decision

Remove the `slug` column from the `notes` table and use only UUID for note identification.

## Alternatives Considered

1. **Implement slugs as planned** - Would add SEO-friendly URLs but increases implementation complexity for unclear benefit.

2. **Optional slugs for published notes only** - More targeted approach, but published note requirements are not yet defined.

3. **Hybrid approach (UUID + slug)** - Keep both identifiers, but this adds redundancy without clear use case.

## Consequences

### Benefits

- Simpler codebase with less validation logic
- No edge cases for duplicate slug handling
- Faster note creation (no slug generation)
- Cleaner API responses

### Trade-offs

- URLs are not human-readable (`/notes/550e8400-...` vs `/notes/my-note`)
- If published notes need SEO-friendly URLs in the future, slug support will need to be re-implemented
- Slightly harder to identify notes from URLs alone

### Migration

- Remove `slug` column and associated index
- Remove slug generation logic from `Note` model
- Update API responses and tests
