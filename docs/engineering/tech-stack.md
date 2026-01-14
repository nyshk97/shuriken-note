# Tech Stack

This document outlines the technology choices for Shuriken Note.

---

## Backend (API)

| Category          | Technology              | Rationale                                                |
| ----------------- | ----------------------- | -------------------------------------------------------- |
| Language          | Ruby 3.4                | Mature ecosystem, rapid development                      |
| Framework         | Rails 8 (API mode)      | Convention over configuration, well-suited for REST APIs |
| Database          | PostgreSQL 17 + pg_bigm | Robust RDBMS, Japanese full-text search support          |
| Authentication    | JWT (HS256)             | Stateless, simple for single API server                  |
| API Documentation | OpenAPI + rswag         | Single source of truth, auto-generated from specs        |
| Testing           | RSpec + FactoryBot      | Industry standard for Rails                              |
| Linter            | Rubocop                 | Code style consistency                                   |
| Security          | Brakeman, Bundler Audit | Static analysis, dependency scanning                     |

---

## Frontend (Web)

| Category      | Technology               | Rationale                                        |
| ------------- | ------------------------ | ------------------------------------------------ |
| Runtime       | Node.js 22.x LTS         | Latest security release                          |
| Framework     | Next.js 15 (App Router)  | React-based, SSR/SSG support, Vercel integration |
| Language      | TypeScript               | Type safety, better DX                           |
| Styling       | Tailwind CSS v4          | Utility-first, fast iteration                    |
| UI Components | shadcn/ui                | Radix UI-based, customizable, industry standard  |
| Icons         | Lucide Icons             | Consistent with shadcn/ui                        |
| Font          | Noto Sans JP (next/font) | Japanese support, automatic optimization         |
| Data Fetching | TanStack Query           | Optimistic updates, retry, caching for auto-save |
| Linter        | ESLint                   | Code quality, included in create-next-app        |
| Deployment    | Vercel                   | Zero-config deployment for Next.js               |

---

## Intentionally Not Using

| Technology        | Reason                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- |
| GraphQL           | Overkill for CRUD-focused app; REST is simpler to implement and operate                 |
| Prettier          | ESLint handles formatting sufficiently for this project                                 |
| Storybook         | Component catalog is excessive for solo development; maintenance cost outweighs benefit |
| Docker (frontend) | Local Node.js is simpler; Docker reserved for backend services                          |
| Dark mode         | Keeping UI simple; may revisit later                                                    |
| Redux / Zustand   | React built-in state is sufficient initially; will adopt if complexity grows            |
| i18n              | Japanese only; personal use app                                                         |

---

## Deferred Decisions

| Topic            | Current Approach          | Future Consideration                    |
| ---------------- | ------------------------- | --------------------------------------- |
| State Management | React useState/useContext | Zustand or Jotai if needed              |
| Form Management  | Native forms              | React Hook Form + Zod for complex forms |
| Token Storage    | In-memory + Refresh Token | HttpOnly cookies if API supports        |

---

## References

- [ADR 0001: REST + OpenAPI](../adr/0001-rest-openapi.md)
- [ADR 0004: Authentication Strategy](../adr/0004-authentication-strategy.md)
- [Feature Matrix](../product/features.md)
