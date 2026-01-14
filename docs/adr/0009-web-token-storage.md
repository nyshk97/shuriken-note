# 0009 Web Client Token Storage Strategy

Date: 2026-01-14

## Status
Accepted

---

## Context

ADR-0004 established JWT-based token authentication for the Shuriken Note application.
That decision noted that secure token storage must be properly designed for each client,
specifically mentioning "HttpOnly Cookie or secure storage strategy" for the Web client.

This ADR defines the concrete token storage strategy for the Next.js Web client.

### Requirements

- Store access tokens securely (minimize XSS exposure)
- Persist refresh tokens across page reloads
- Enable Next.js Middleware to check authentication status for route protection
- Keep implementation complexity manageable for a personal project

### Constraints

- Rails API runs on `localhost:3000`, Next.js on `localhost:3001` (different origins)
- HttpOnly cookies set by Rails cannot be shared across different origins without CORS complexity
- Next.js Middleware runs on the server and cannot access localStorage

---

## Decision

- **Access Token**: Stored in memory (JavaScript variable)
- **Refresh Token**: Stored in localStorage
- **Auth Flag Cookie**: A simple flag cookie (`has_refresh_token=1`) is set client-side
  to allow Next.js Middleware to check authentication status

### Implementation Details

| Token         | Storage               | Accessible By          | Purpose                  |
| ------------- | --------------------- | ---------------------- | ------------------------ |
| Access Token  | Memory                | Client JS only         | API authorization        |
| Refresh Token | localStorage          | Client JS only         | Obtain new access tokens |
| Auth Flag     | Cookie (non-HttpOnly) | Client JS + Middleware | Route protection         |

---

## Rationale

### Why Not HttpOnly Cookie for Refresh Token

HttpOnly cookies are the most secure option for token storage, as they cannot be accessed
by JavaScript and are therefore immune to XSS attacks. However, implementing this requires:

1. **Same-origin setup**: Either a reverse proxy or BFF (Backend for Frontend) pattern
2. **CORS complexity**: Cross-origin cookies require `SameSite=None; Secure`,
   which mandates HTTPS even in development
3. **Architecture changes**: Rails would need to set cookies, or Next.js API routes
   would need to proxy all authentication requests

For a personal note-taking application with limited attack surface, this complexity
is not justified at the current stage.

### Why localStorage + Flag Cookie

- **localStorage**: Simple, persistent storage that survives page reloads
- **Flag Cookie**: Lightweight solution for Middleware route protection
  - Only contains a flag (`"1"`), not the actual token
  - Even if manipulated, API calls will fail without valid tokens
  - Provides "soft" protection to prevent unauthorized page access

### Security Trade-offs Accepted

| Risk                           | Mitigation                                            |
| ------------------------------ | ----------------------------------------------------- |
| XSS could steal refresh token  | React's built-in XSS protection; CSP headers (future) |
| Flag cookie can be spoofed     | API authorization still requires valid tokens         |
| Token in localStorage persists | Cleared on logout; 30-day expiry on refresh token     |

---

## Alternatives Considered

### Alternative A: HttpOnly Cookie via Rails

**Approach**: Rails sets HttpOnly cookie containing refresh token

**Pros**
- Most secure against XSS
- Industry best practice

**Cons**
- Requires same-origin setup or complex CORS configuration
- Development environment needs HTTPS for `Secure` cookies
- Significant architecture changes required

**Verdict**: Over-engineered for current scope

---

### Alternative B: Next.js API Routes as BFF

**Approach**: Next.js proxies all auth requests and manages HttpOnly cookies server-side

**Pros**
- Cookies stay on same origin
- Secure token storage

**Cons**
- All API calls must go through Next.js
- Increased complexity and latency
- Duplicates authentication logic

**Verdict**: Over-engineered for current scope

---

### Alternative C: localStorage Only (No Middleware Protection)

**Approach**: Store tokens in localStorage, protect routes client-side only

**Pros**
- Simplest implementation
- No cookie management

**Cons**
- Page flicker on protected routes (client checks auth after render)
- Poor UX for unauthenticated users accessing protected pages

**Verdict**: UX is not acceptable

---

## Consequences

### Positive

- Simple implementation with minimal dependencies
- Route protection works without page flicker
- Easy to understand and maintain
- Can be upgraded to HttpOnly cookies in the future if needed

### Negative / Risks

- Refresh token is vulnerable to XSS attacks (mitigated by React's protections)
- Not following the strictest security best practices
- Requires discipline to prevent XSS vulnerabilities in the codebase

### Future Considerations

If any of the following occur, migration to HttpOnly cookies should be reconsidered:

- Application becomes publicly available with multiple users
- Sensitive data beyond personal notes is stored
- Security audit identifies XSS vulnerabilities
- Infrastructure changes make same-origin setup easier

---

## References

- ADR-0004: JWT-Based Token Authentication
- OWASP: [JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- Auth0: [Token Storage](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)

---
