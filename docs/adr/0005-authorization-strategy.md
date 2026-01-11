# 0005 Authorization Uses Owner Access + Shared Link–Based Limited Access

Date: 2026-01-11

## Status
Accepted

---

## Context

Shuriken Note is a personal note-taking application where a single authenticated user creates and manages their own notes.
Creating, updating, and deleting notes are performed only by authenticated users.

In addition, the following usage is part of the initial requirements:

- Anyone who possesses a shared link can access the corresponding note without logging in
- Depending on the type of shared link, the external user may have read-only or edit access

This project does not include advanced multi-user management features such as:

- Team or group-based collaboration
- Role-based access control (RBAC)
- Organization-level permission management

Therefore, the system must satisfy the current requirement of
“full access by the owner + limited access via shared links,”
while keeping the design simple and avoiding unnecessary over-engineering.

---

## Decision

- All note resources grant full access to their owner (authenticated user)
- External users accessing via a valid shared link are granted permissions based on link type:
  - Read-only access, or
  - Edit access
- Authorization checks are performed centrally at the API level
- RBAC and group-based permission systems are not introduced

---

## Rationale

### Why the Owner + Shared Link Model

- It is sufficient and natural for a personal note application
- Keeps the authorization model simple and easy to reason about
- Reduces implementation complexity and security risks
- Shared links provide explicit, intentional access paths, lowering the risk of unintended exposure
- API behavior remains intuitive and easy for third parties to understand

---

### Why RBAC and Team Features Are Not Introduced

- They are out of scope for this project
- They require additional data models, policy layers, and UI complexity
- They would significantly increase implementation and maintenance cost
- Over-abstraction at this stage would reduce clarity rather than improve design

---

### Why Authorization Logic Is Centralized

- Prevents duplicated and inconsistent authorization checks
- Reduces the risk of security gaps and missing validations
- Limits future change scope if new access patterns are introduced

---

## Alternatives Considered

### Alternative A: Role-Based Access Control (RBAC) from the Start

**Pros**
- Ready for large-scale multi-user and team collaboration

**Cons**
- Over-engineered for current requirements
- Increases implementation, operational, and UI complexity

---

### Alternative B: Authentication Only (No Authorization Layer)

**Pros**
- Simplest implementation

**Cons**
- Cannot prevent unauthorized viewing or modification of notes
- Does not meet basic security requirements

---

## Consequences

### Positive

- Simple and secure authorization model
- Easy-to-implement and easy-to-review access control
- Enables sharing functionality without introducing heavy permission systems

### Negative / Constraints

- No support for team or organization-based permission management
- Major authorization redesign may be required if complex collaboration features are introduced in the future

---

## Notes

- All API endpoints must allow access only when one of the following conditions is met:

  - The authenticated user is the owner of the target note
  - A valid shared-link token is presented, granting appropriate permission (read or edit)

- Shared links use unguessable random tokens embedded in URLs
- Shared links can be revoked or reissued when necessary

- Authorization checks are implemented in a centralized application-layer component
  rather than scattered across controllers or models

---
