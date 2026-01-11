# 0004 Adopt JWT-Based Token Authentication

Date: 2026-01-11

## Status
Accepted

---

## Context

Shuriken Note is built around a Rails-based API server and is accessed by
a Web client (Next.js) and an iOS client (SwiftUI).

Therefore, the authentication mechanism must satisfy the following requirements:

- Be usable through a common approach across both Web and iOS clients
- Align with an API-first architecture
- Allow easy session management and scalability
- Meet basic security requirements (token expiration and renewal)
- Be adaptable to future client additions (e.g., desktop apps)

Under these conditions, the following authentication approaches were considered:

- Rails standard Cookie / Session-based authentication
- JWT-based Bearer token authentication
- External authentication providers (Auth0, Firebase Auth, etc.)

---

## Decision

- Authentication will use JWT-based Bearer token authentication
- The same authentication method will be used for both Web and iOS clients
- Access tokens and refresh tokens will be issued and managed separately
- Tokens will be sent via the Authorization header
- External authentication providers will not be introduced at this stage

---

## Rationale

### Why JWT-Based Authentication

- A single authentication flow can be shared across Web and iOS clients
- Bearer tokens in the Authorization header naturally fit an API-first architecture
- Cookie / Session authentication is designed primarily for browsers;
  using it in native mobile applications requires manual cookie management and CSRF handling,
  resulting in unnecessary complexity
- JWT enables the API server to remain stateless, improving scalability and operational simplicity
- The same mechanism can be reused if additional clients (e.g., desktop applications) are introduced in the future

---

### Why Refresh Tokens

- Short-lived access tokens reduce risk in case of token leakage
- Long-lived sessions can be maintained without forcing frequent re-login
- Provides a natural login experience for mobile applications

---

### Why External Authentication Providers Are Not Introduced

- Adds external service dependencies and operational overhead
- Increases system complexity
- Represents an over-engineered solution for the current project scope

---

## Alternatives Considered

### Alternative A: Rails Cookie / Session Authentication

**Pros**
- Simple to implement using Rails standard features
- Server-side session control is straightforward

**Cons**
- Designed for browser-based workflows;
  native mobile clients require manual cookie handling and CSRF protection
- Leads to separate authentication mechanisms for Web and iOS
- Less aligned with an API-first architecture

---

### Alternative B: External Authentication Providers (Auth0, Firebase Auth, etc.)

**Pros**
- Offloads authentication implementation
- Easy integration of social login features

**Cons**
- Adds external dependencies
- Introduces additional costs
- Reduces flexibility in customizing authentication flows

---

## Consequences

### Positive

- A unified authentication mechanism across Web and iOS clients
- Stateless API server with improved scalability
- Explicit and understandable authentication flow
- Easy adaptability for future client expansions

### Negative / Constraints

- Requires implementation of token lifecycle management (expiration and renewal)
- Secure token storage must be properly designed
  (Web: HttpOnly Cookie or secure storage strategy / iOS: Keychain)

---

## Notes

- Access tokens will be short-lived (e.g., 15–30 minutes) and used for API authorization
- Refresh tokens will be long-lived and used only to obtain new access tokens
- Refresh tokens will be invalidated on logout
- Token signing algorithm (HS256 / RS256, etc.) and key management strategy will be defined during implementation

---
