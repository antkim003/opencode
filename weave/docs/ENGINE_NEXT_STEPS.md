# Engine Next Steps (Slate + Volt Alignment)

Last updated: 2026-03-26

This backlog turns current fork gaps into implementation-ready phases.

## Priority 0: Close Gate B/C blockers

1. Finalize architecture decisions and sign-off
   - Update `weave/docs/OPENCODE_ARCHITECTURE_DECISIONS.md` with owner, approver, date, and final choices.
2. Run baseline regression suite for startup/chat/tool execution
   - Validate and check off Gate C regression item.

## Priority 1: Fill missing Weave memory interfaces

1. Add `weave_expand_query`
   - Path: `packages/opencode/src/tool/weave-expand-query.ts`
   - Register in `packages/opencode/src/tool/registry.ts`
   - Expected: query-based retrieval over compacted/off-context summaries.
2. Add `weave_read`
   - Path: `packages/opencode/src/tool/weave-read.ts`
   - Register in `registry.ts`
   - Expected: stable read access for file references in Weave store.

## Priority 2: Complete `session/weave` module surface

Add missing modules with thin first implementation, then deepen behavior:

- `summarize.ts`
- `condense.ts`
- `retrieval.ts`
- `retrieval-facade.ts`
- `dispatch.ts`
- `scope.ts`
- `orchestrator.ts`
- `config.ts`
- `migration.ts`

Primary folder: `packages/opencode/src/session/weave/`

## Priority 3: Slate-style orchestration UX parity

1. Thread status model exposed to UI
   - Include status, current step/tool, elapsed time, tokens, and completion state.
2. TUI thread panel and episode visibility
   - Target paths under `packages/opencode/src/cli/cmd/tui/routes/session/` and `.../context/`.
3. Operator progress bars for `llm_map` / `agentic_map`
   - Live per-item progress and retries.

## Priority 4: Volt/LCM context visibility parity

1. Surface context-window pressure and DAG depth in CLI/TUI and desktop/web.
2. Add summary/DAG inspector routes in session server API.
3. Ensure deterministic retrievability metadata is visible and queryable.

Primary integration path: `packages/opencode/src/server/routes/session.ts`

## Priority 5: Gate E/F readiness and cutover

1. Pass CLI/TUI parity matrix (`weave/docs/CLI_TUI_PARITY_MATRIX.md`).
2. Pass OAuth conformance matrix (`weave/docs/CLAUDE_OAUTH_CONFORMANCE.md`).
3. Complete cutover scorecard and rollback proof:
   - `weave/docs/CUTOVER_SCORECARD.md`
   - Go/no-go and rollback runbook verification.

## Recommended Execution Order

1. Gate B/C completion
2. Missing memory tools
3. `session/weave` module completion
4. Slate-style TUI orchestration visibility
5. Volt/LCM visibility and API parity
6. Gate E/F cutover
