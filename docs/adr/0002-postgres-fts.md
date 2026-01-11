# 0002 Adopt PostgreSQL as the Database and Use Full Text Search for Note Search

Date: 2026-01-11

## Status
Accepted

---

## Context

Shuriken Note is designed to store notes and enable efficient retrieval and reuse through search.
Therefore, the ability to perform fast and flexible full-text search on note content is a core feature.

The data store must satisfy the following requirements:

- Reliably handle relational data such as notes, users, and attachments
- Scale with future data growth
- Provide mature solutions for operations, backups, and monitoring
- Enable full-text search with minimal additional implementation and infrastructure cost

Under these conditions, we considered:

- Whether to adopt PostgreSQL as the primary database
- Whether to implement search using PostgreSQL Full Text Search (FTS)
- Whether to introduce an external search engine such as Elasticsearch

---

## Decision

- PostgreSQL will be adopted as the primary database
- Note search will be implemented using PostgreSQL Full Text Search
- External search engines (e.g., Elasticsearch) will not be introduced at this stage

---

## Rationale

### Why PostgreSQL

- A highly reliable and proven open-source RDBMS
- Rich managed service offerings (RDS, Cloud SQL, etc.) simplify operations
- Strong compatibility with Rails, enabling efficient development
- Mature backup, replication, and monitoring ecosystems

In addition, PostgreSQL provides powerful features around indexing, search, and JSON handling, allowing flexible future expansion.

- GIN indexes on JSONB enable efficient key-based and conditional searches inside JSON structures
- Extensions such as `pg_trgm` and GIN/GiST indexes allow optimization of partial-match searches
- Expression indexes and partial indexes enable index designs tailored to real data characteristics

These capabilities allow not only standard relational data management, but also search and optimization strategies to be completed consistently within PostgreSQL itself.

---

### Why Full Text Search

- Enables full-text search without introducing additional infrastructure
- Search conditions can be expressed at the SQL level, keeping application structure simple
- Indexes provide sufficient performance for typical search workloads
- Built-in ranking and ordering of search results
- For small to medium data sizes, external search engines are unnecessary

---

### Why External Search Engines Are Not Introduced Now

- Require separate infrastructure, increasing system complexity
- Introduce operational overhead such as data synchronization, index rebuilds, and failure handling
- Represent an over-engineered solution for the expected data volume and search requirements
- A simpler PostgreSQL FTS-based approach is prioritized for initial completeness and maintainability

---

## Alternatives Considered

### Alternative A: Use MySQL

**Pros**
- Widely adopted with extensive operational experience
- Many managed service options

**Cons**
- Full Text Search is less flexible and extensible than PostgreSQL
- PostgreSQL provides richer JSON, indexing, and search-related features

---

### Alternative B: Introduce External Search Engines (e.g., Elasticsearch)

**Pros**
- Advanced full-text search, ranking, and scalability
- High performance for very large datasets

**Cons**
- Requires separate infrastructure and operational management
- Adds complexity in data synchronization and index maintenance
- Overly complex for this project's requirements

---

### Alternative C: Use Simple LIKE-based Search

**Pros**
- Easiest to implement

**Cons**
- Poor performance as data grows
- No ranking or flexible search expressions

---

## Consequences

### Positive

- Stable relational data management
- Full-text search without additional infrastructure
- Simple operational architecture and lower maintenance cost
- Smooth integration with Rails

### Negative / Constraints

- Not suitable for extremely large-scale search workloads
- Advanced search UI features (synonyms, ranking tuning, multilingual optimization) require additional implementation

---

## Notes

- Search target columns and index design will be defined during implementation
- Search condition construction will be centralized in a single location (model `search` method or a Query object)
- If external search engines are introduced in the future, the search implementation will be refactored in stages to allow replacement with limited impact

---
