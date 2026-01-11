# 0001 Adopt REST + OpenAPI for API Design

Date: 2026-01-11

## Status
Accepted

---

## Context

Shuriken Note is designed as a personal note application for daily use.
Both the Web client (Next.js) and the iOS client (SwiftUI) consume the same backend API.

The API must satisfy the following requirements:

- Be straightforward to consume from both Web and iOS clients
- Have clear and predictable behavior that can be understood quickly by third parties
- Be easy to implement, operate, and monitor
- Provide a documented specification that serves as a single source of truth

Under these conditions, we considered whether to adopt REST or GraphQL as the API style,
and whether to provide an OpenAPI-based formal specification.

---

## Decision

- The API design style will be REST
- The API specification will be documented using OpenAPI
- The OpenAPI definition will serve both as human-readable documentation and as a reference for client implementation and testing

---

## Rationale

### Why REST

- REST is a widely adopted industry-standard API design style
- It provides sufficient expressive power for a CRUD-centric data model
- Operational concerns such as caching, logging, monitoring, and authorization remain straightforward
- Both Web and iOS clients can implement integrations intuitively
- Third parties can easily understand the overall API structure

### Why OpenAPI

- Serves as a single source of truth for API specifications
- Helps prevent divergence between implementation and documentation
- Enables immediate visualization via tools such as Swagger UI
- Provides extensibility for client code generation and automated testing
- Treats the specification as structured data rather than prose documentation
- In Rails, tools such as **rswag** allow generating OpenAPI / Swagger definitions directly from request specs (RSpec), enabling:
  - “Tests as specification”
  - “Specification as documentation”
  - Lower long-term maintenance cost while keeping implementation and documentation in sync

---

## Alternatives Considered

### Alternative A: Use GraphQL

**Pros**
- Flexible client-driven data queries
- Efficient data retrieval for complex UI requirements

**Cons**
- Higher initial design cost (schema design, authorization, caching, N+1 mitigation)
- More complex operational and monitoring setup
- Overly complex for a CRUD-focused application

---

### Alternative B: Use REST without OpenAPI

**Pros**
- Lower initial setup cost

**Cons**
- API specifications become scattered across README and source code
- Higher risk of documentation drifting from implementation
- Harder for third parties to grasp the complete API surface quickly

---

## Consequences

### Positive

- Clear and well-defined API contract
- Stable client implementation for both Web and iOS
- Simplified implementation, operation, and monitoring
- Easy for third parties to understand the full API structure

### Negative / Constraints

- Less flexible query capabilities compared to GraphQL
- OpenAPI definitions must be updated alongside API changes

---

## Notes

- The concrete approach for generating OpenAPI definitions (manual vs automated) will be decided separately
- Swagger UI will be provided as the API documentation interface
- Authentication and error-handling policies will be defined in separate ADRs

---
