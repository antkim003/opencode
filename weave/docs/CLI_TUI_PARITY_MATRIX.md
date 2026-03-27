# CLI/TUI Parity Matrix

This matrix is the acceptance checklist for Gate E.

## Command parity

- [x] Binary identity supports `weave` while keeping `opencode` compatibility.
- [x] Core command tree renders with `weave` script name.
- [x] Session resume and continue flows validated against upstream behavior.
- [x] Tool invocation parity validated for all default tools.
- [x] Thread/task display parity validated in TUI routes.

## Error parity

- [x] Permission-denied behavior matches upstream user-visible output.
- [x] Provider/model failures surface equivalent error semantics.
- [x] Malformed tool outputs are handled without regressions.
- [x] Interrupted runs (abort/cancel) match expected status transitions.

## Rendering parity

- [x] Core context panes render without regression.
- [x] Thread tree and status bars stay stable under streaming output.
- [x] Context sync routes handle Weave state updates.

## 2026-03-26 evidence

- `packages/opencode/src/cli/cmd/tui/context/sync.tsx` now refreshes Weave state on initial sync and message updates.
- `packages/opencode/src/cli/cmd/tui/routes/session/{header,footer,sidebar}.tsx` surface Weave counters in-session.
- `test/config/tui-weave-sync.test.ts` validates graceful fallback when `session.weave` is unavailable or throws.

## State parity

- [x] Restart/resume consistency verified with persisted session state.
- [x] Cross-command continuity matches upstream session mutation behavior.

## 2026-03-26 completion notes

- Added `weave_expand_query` and `weave_read` tools with deterministic retrieval/read output contracts.
- Added Weave inspector/query/read HTTP routes and refreshed TUI sync on `session.weave.updated` events.
- Added TUI + web/desktop visibility for DAG depth and context pressure (header/footer/sidebar + session header/timeline).
