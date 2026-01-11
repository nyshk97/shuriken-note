# 0003 Adopt Active Storage for Attachments and Use Direct Upload

Date: 2026-01-11

## Status
Proposed

---

## Context

Shuriken Note allows users to attach images to notes.
Since image uploads occur from both Web (Next.js) and iOS (SwiftUI) clients, the upload mechanism must satisfy the following requirements:

- Be easy to implement from both Web and iOS clients
- Provide reliable uploads (handling timeouts and retries)
- Avoid excessive load on the application server (bandwidth, CPU, memory)
- Keep operations simple and maintenance costs low
- Assume a standard S3-compatible object storage

Under these conditions, we considered:

- Whether to adopt Rails Active Storage
- Whether to upload files via the application server or use Direct Upload
- Whether to generate image variants (thumbnails, resized images) from the beginning

---

## Decision

- Attachments will be implemented using Rails Active Storage
- The upload method will use Direct Upload (client → object storage)
- The application server will not proxy file uploads and will only handle metadata operations such as issuing signed URLs
- Image transformations (thumbnails, variants) are not required in the initial scope and will be added only if needed

---

## Rationale

### Why Active Storage

- Fully integrated Rails standard feature, keeping implementation and operations simple
- Handles common attachment requirements such as linking, retrieval, and deletion
- Works seamlessly with S3-compatible storage and managed cloud services
- Provides built-in extensibility for future image variants

---

### Why Direct Upload

- File data does not pass through the application server, significantly reducing bandwidth and CPU load
- Clients can implement retries and resumable uploads more easily in unstable network environments
- The application server focuses on lightweight responsibilities such as issuing signed URLs, improving scalability
- Presigned URL–based uploads are a common and well-supported approach for both Web and iOS clients

---

## Alternatives Considered

### Alternative A: Upload via Application Server (multipart POST)

**Pros**
- Client implementation can be simpler (single endpoint)
- Storage details can be hidden behind the server

**Cons**
- Increases application server bandwidth and CPU usage
- Retry and timeout handling becomes more complex
- Raises scaling requirements and operational cost

---

### Alternative B: Custom Implementation Without Active Storage

**Pros**
- Full control over data models and URL design
- Can optimize for vendor-specific storage features

**Cons**
- Higher implementation and operational cost
- Increased risk of bugs and edge cases
- Reinvents functionality already provided by Rails standard features

---

### Alternative C: Generate Image Variants from the Beginning

**Pros**
- Improves UX for list views and previews
- Can reduce transfer size for some use cases

**Cons**
- Requires an image processing pipeline (Active Job / workers / storage configuration)
- Adds operational components and increases initial system complexity

---

## Consequences

### Positive

- Simple implementation and operations using Rails standard features
- Reduced application server load and improved scalability
- Common and well-supported upload flow for both Web and iOS clients
- Easy extensibility for future image processing requirements

### Negative / Constraints

- Direct Upload requires client-side implementation
  (request signed URL → upload directly to storage → notify server to attach)
- Initial UX may be minimal since image variants are postponed

---

## Notes

- Storage is assumed to be S3-compatible (e.g., AWS S3)

- The Direct Upload flow follows these three steps:

  1. The client sends an “upload preparation request” to the application server
     including file metadata such as filename, content type, and file size

  2. The application server issues a presigned URL via Active Storage
     and returns it to the client

  3. The client uploads the file directly to object storage using the presigned URL,
     then notifies the application server with the uploaded file identifier (e.g., blob_id)
     to finalize attachment association

  This approach ensures that file data never passes through the application server,
  enabling secure and efficient uploads.

- If image transformations (e.g., thumbnails) become necessary,
  image variants will be managed using Active Storage variants,
  and generation will be performed asynchronously via background jobs
  (Active Job / Sidekiq, etc.).

  This design keeps image processing out of web request cycles,
  prevents response latency and server load concentration,
  and achieves stable image management within standard Rails features.

---
