# Synaply Memory

## High Priority Performance Work

These items are explicitly marked as high priority and should be handled before lower-leverage performance polish.

### 1. Docs tree read path must be split into lightweight structure reads and content/detail reads

Priority: High

- Current `Docs` tree loading still fetches the whole tree in one request.
- The backend tree query is still heavy for sidebar usage and includes fields that are too expensive for navigation-only rendering.
- Target direction:
  - separate tree structure from document content/detail
  - add incremental loading by parent node
  - avoid loading latest content snapshots in tree/sidebar reads

Why this is high priority:

- This is one of the biggest remaining opportunities for large, user-visible speedups on both frontend and backend.

### 2. Realtime invalidation must become event-specific instead of broad query invalidation

Priority: High

- Current realtime handlers still invalidate broad groups like `issues`, `my-work`, `inbox`, `inbox-summary`, and `project-summary`.
- This causes redundant refetches and limits the benefit of the caching work already done.
- Target direction:
  - narrow invalidation by event type
  - prefer local cache patching or exact query invalidation where possible
  - reduce duplicate refreshes triggered by both mutation success and realtime broadcasts

Why this is high priority:

- This affects nearly every active page and is one of the main remaining sources of unnecessary requests.

### 3. AI thread loading and streaming must move to incremental cache updates

Priority: High

- AI thread pages still do extra fetching across thread list, thread detail, and messages.
- After streaming completes, the app still invalidates and refetches data that is already locally available.
- Target direction:
  - keep thread list warm in cache
  - fetch current thread detail only when needed
  - append streamed messages into cache directly
  - avoid full message-list refetch after a successful stream

Why this is high priority:

- This is the clearest next performance win for the AI experience after virtualizing large chat/message lists.

### 4. Issue / My Work / Inbox list reads need summary-oriented backend projections

Priority: High

- Some list-style surfaces are still backed by relatively heavy issue payloads.
- `Issue` list reads currently include more relational detail than necessary for list rendering.
- `My Work` and `Inbox` still have room to move further away from heavy shared issue reads toward purpose-built projections.
- Target direction:
  - create summary/lightweight list queries for issue lists
  - create dedicated projections for `My Work` and `Inbox` signals
  - keep detailed relational payloads for detail views only

Why this is high priority:

- This is a structural backend optimization with direct impact on query cost, response size, and list rendering speed.

## Recommended Execution Order

1. Docs tree lightweight loading and incremental expansion
2. Realtime invalidation deduping and narrowing
3. AI thread incremental cache updates
4. Issue / My Work / Inbox summary projections
