# 0002 Adopt PostgreSQL as the Database and Use Full Text Search for Note Search

Date: 2026-01-11
Updated: 2026-01-14

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

### Japanese Full-Text Search Challenge

PostgreSQL's standard Full Text Search is designed for space-delimited languages like English.
Japanese text does not use spaces to separate words, so standard FTS cannot properly tokenize Japanese content.

To enable Japanese full-text search, one of the following approaches is required:

1. **Dedicated extensions**: pg_bigm (2-gram), PGroonga (morphological analysis), etc.
2. **pg_trgm + GIN index**: Partial match search using trigrams
3. **Application-side tokenization**: Tokenize with morphological analyzers (MeCab, Kuromoji, etc.) and store in tsvector

Since this project uses AWS RDS PostgreSQL (see ADR-0006), only extensions supported by RDS are viable options.

---

## Decision

- PostgreSQL will be adopted as the primary database
- Note search will be implemented using PostgreSQL Full Text Search
- External search engines (e.g., Elasticsearch) will not be introduced at this stage
- **Japanese full-text search will be implemented using pg_bigm + GIN index with LIKE/ILIKE queries**

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

### Why pg_bigm for Japanese Full-Text Search

After evaluating options for Japanese full-text search under AWS RDS PostgreSQL constraints, we chose pg_bigm + GIN index.

#### AWS RDS Extension Support

| Extension | Method                  | RDS Support     |
| --------- | ----------------------- | --------------- |
| pg_bigm   | 2-gram                  | ✅ Supported     |
| PGroonga  | Morphological (Groonga) | ❌ Not supported |
| pg_trgm   | 3-gram                  | ✅ Supported     |

#### Reasons for Choosing pg_bigm

1. **Optimized for Japanese**: 2-gram method is ideal for Japanese partial-match search
2. **Supports short search terms**: Index works for 1-2 character queries (e.g., "会議", "DB", "UI")
3. **AWS RDS compatible**: Supported in managed environments
4. **Simple implementation**: No additional morphological analyzers or data synchronization required
5. **Works with English**: Language-agnostic, English text search also functions properly

#### pg_bigm vs pg_trgm Comparison

| Aspect                | pg_bigm     | pg_trgm             |
| --------------------- | ----------- | ------------------- |
| N-gram size           | 2-gram      | 3-gram              |
| Minimum query length  | **1 char+** | 3 chars+            |
| Japanese optimization | ✅ Yes       | △ Works             |
| PostgreSQL standard   | Third-party | contrib (standard)  |
| Similarity search     | ❌ LIKE only | ✅ similarity()      |
| English support       | △ Works     | ✅ Language-agnostic |

As a Japanese note-taking app, we prioritize index effectiveness for short search terms (2 characters), leading to the choice of pg_bigm.

#### pg_bigm Considerations

- Case-sensitive by default; use `ILIKE` or `lower()` for case-insensitive search
- May produce more search noise than pg_trgm for English text, but not an issue at small-to-medium scale
- Does not match the search precision of morphological analysis (PGroonga, etc.)

For the expected data volume of this project (personal note-taking app), these constraints are acceptable.

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

### Alternative C: Use Simple LIKE-based Search (without index)

**Pros**
- Easiest to implement

**Cons**
- Poor performance as data grows
- No ranking or flexible search expressions

---

### Alternative D: Use pg_trgm

**Pros**
- Stable as a PostgreSQL standard contrib module
- Supports similarity search and fuzzy matching
- Language-agnostic, optimized for English text

**Cons**
- Index ineffective for queries under 3 characters
- Poor performance for short Japanese search terms (e.g., "会議", "DB")

---

### Alternative E: Use PGroonga

**Pros**
- Highest search precision with morphological analysis
- Optimized for Japanese full-text search
- Fast and supports all languages

**Cons**
- Not supported on AWS RDS PostgreSQL
- External dependency on Groonga engine
- Tends to produce larger index sizes

---

### Alternative F: Application-side Tokenization + tsvector

**Pros**
- High-precision tokenization using morphological analyzers (MeCab, etc.)
- Full utilization of PostgreSQL standard FTS features (ranking, etc.)

**Cons**
- Adds morphological analyzer dependency to the application
- Tokenization processing overhead
- Increases implementation and operational complexity

---

## Consequences

### Positive

- Stable relational data management
- Full-text search without additional infrastructure
- Simple operational architecture and lower maintenance cost
- Smooth integration with Rails
- Japanese search capability while complying with AWS RDS constraints
- Index effectiveness for 2-character search terms, providing practical search experience

### Negative / Constraints

- Not suitable for extremely large-scale search workloads
- Advanced search UI features (synonyms, ranking tuning) require additional implementation
- Does not match morphological analysis-based search precision
- Similarity search (fuzzy matching) is less flexible than pg_trgm

---

## Notes

### Search Implementation Policy

- Search targets: `notes.title` and `notes.body`
- Index: pg_bigm extension + GIN index
- Search condition construction will be centralized in `Note.search(query)` scope
- Use ILIKE for case-insensitive search

### Index Design

```sql
-- Enable pg_bigm extension
CREATE EXTENSION IF NOT EXISTS pg_bigm;

-- GIN indexes for title and body
CREATE INDEX index_notes_on_title_bigm ON notes USING gin (title gin_bigm_ops);
CREATE INDEX index_notes_on_body_bigm ON notes USING gin (body gin_bigm_ops);
```

### Search Query Example

```sql
-- Search notes containing the search term in title or body
SELECT * FROM notes
WHERE title ILIKE '%search_term%' OR body ILIKE '%search_term%';
```

### Future Expansion Path

- If requirements exceed pg_bigm capabilities (large-scale data, advanced ranking, similarity search, etc.), consider migrating to external search engines such as Elasticsearch
- Centralizing search logic in `Note.search` scope limits the impact of search engine replacement

---
