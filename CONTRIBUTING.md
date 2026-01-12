# Development Conventions

This document describes the development rules I follow in this project to maintain consistency and quality.

## Branch naming

Branches follow this format:

`{type}/{issueNumber}-{short-slug}`

Example:

`feat/12-ai-dev-workflow`

### Types

- feat: new features
- fix: bug fixes
- docs: documentation-only changes
- refactor: internal code improvements without behavior change
- chore: tooling / infrastructure / dependency updates
- spike: investigations and experiments

---

## Commit messages

Commits follow the Conventional Commits style:

`type(scope): summary`

Example:

`feat(note): implement autosave API`

---

## Issue-driven workflow

As a general rule, development work starts from a GitHub Issue.

Typical flow:

1. Create or select an Issue
2. Create a branch from the Issue number
3. Implement changes
4. Open a Pull Request linked to the Issue

---

## Documentation

The `docs/` directory is the source of truth for product and architecture decisions.
Implementation should follow documented decisions whenever possible.

---

## Testing

All changes should pass the CI pipeline before merging.
