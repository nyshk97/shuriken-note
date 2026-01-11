# 0007 Error Handling Strategy

Date: 2026-01-11

## Status

Proposed

---

## Context

The backend API of Shuriken Note adopts REST + OpenAPI (ADR 0001).
Both Web (Next.js) and iOS (SwiftUI) clients consume the same backend API.

Error responses directly affect client implementation, debugging, and monitoring.
However, Rails exceptions and validation errors do not provide a consistent response format by default, which can lead to inconsistent API error representations across endpoints.

Therefore, it is necessary to define an error handling strategy that satisfies the following:

* Error response format is consistent across all endpoints
* HTTP status code usage is clearly defined
* Clients can programmatically distinguish error types
* Debugging information is available without leaking sensitive details
* The format can be described in OpenAPI

---

## Decision

The following error handling strategy is adopted.

* Error responses are unified into a single JSON format
* All errors include `error.code` for programmatic identification
* Client-facing messages are stored in `error.message`
* Field-level validation errors are stored in `error.details` as an array
* Internal exception details (e.g., stack traces) are not included in responses
* Exceptions are centrally handled using Rails `rescue_from`
* `request_id` is included in responses to allow log correlation

---

## Rationale

### Reason for unifying into a single format

* Error handling can be shared between Web and iOS clients
* Prevents inconsistent error response shapes across endpoints
* Enables stable specification through OpenAPI

### Reason for requiring `error.code`

* Avoids breaking clients when message text changes
* Allows client-side branching based on stable codes
* Enables classification for monitoring and error tracking

### Reason for including `request_id`

* Enables correlation between client error reports and server logs
* Simplifies root-cause investigation during incidents

---

## Error Response Format

### Common format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": [
      {
        "field": "string",
        "code": "string",
        "message": "string"
      }
    ]
  },
  "request_id": "string"
}
```

* `error.code`: Machine-readable error code (required)
* `error.message`: Human-readable summary message (required)
* `error.details`: Field-level details (optional, primarily used for 422)
* `request_id`: Request correlation ID (required)

### Usage of `error.details`

* Used for validation errors (HTTP 422)
* Omitted for other error types

---

## HTTP Status Mapping

* 400 Bad Request: Invalid request format (e.g., JSON parse error)
* 401 Unauthorized: Authentication required or invalid token
* 403 Forbidden: Authorization failure
* 404 Not Found: Resource does not exist
* 409 Conflict: State conflict (e.g., uniqueness violation, concurrent update)
* 422 Unprocessable Entity: Validation error
* 429 Too Many Requests: Rate limiting
* 500 Internal Server Error: Unexpected server error

---

## Error Code Conventions

* Lowercase snake_case
* Prefix by domain boundary when appropriate (e.g., `auth_`, `notes_`, `files_`)
* Name codes based on business meaning rather than exception class

Examples:

* `invalid_request`
* `unauthorized`
* `forbidden`
* `not_found`
* `validation_failed`
* `conflict`
* `rate_limited`
* `internal_error`

---

## Alternatives Considered

### Alternative A: Rely on default Rails exception responses

**Pros**

* Simplest implementation

**Cons**

* Error responses become inconsistent
* Client implementations become more complex
* Risk of leaking sensitive exception details

---

### Alternative B: Adopt RFC 7807 (Problem Details)

**Pros**

* Standardized error response specification
* High interoperability with external tools and clients

**Cons**

* This project requires explicit `error.code` and structured `details` handling
* Validation error representation becomes more complex in practice

---

## Consequences

### Positive

* Unified error handling simplifies Web and iOS client implementations
* Clear error classification improves monitoring and incident investigation
* OpenAPI documentation becomes easier to define and maintain

### Negative / Constraints

* Explicit mapping from exceptions to HTTP status and `error.code` is required
* Error code changes must consider backward compatibility

---

## Notes

* In production, `error.message` must not include internal exception details
* Full exception details are logged and sent only to error tracking systems
* OpenAPI defines a shared error schema and response examples
* `request_id` is generated in middleware and also returned via response headers
