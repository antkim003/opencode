# OpenCode fork — architecture decisions (Phase 2.5 gate)

Record irreversible choices before persistence and context work on the fork.

| Decision | Final choice | Notes |
|----------|-------------------|--------|
| Fork root directory | [`weave_opencode`](../../weave_opencode/) at monorepo root | OpenCode now runs directly at this repository root; planning docs should reference real `packages/opencode/src/*` paths. |
| Shared DB vs dedicated Weave store | **Dual store (final)** | Keep OpenCode storage for app/session metadata; add a **Weave memory store** for message lineage, summaries, episodes, DAG (per plan §Phase 3). |
| Weave message ID ownership | **Weave-owned IDs (final)** in the Weave store | Map/adapt to OpenCode UI message IDs where required for compatibility. |
| Mirror vs replace for prompt assembly | **Weave-built context (final)** | OpenCode messages are not the sole source of truth for long-context assembly; Weave `context.ts` (or equivalent) builds the prompt payload. |
| Canonical tool IDs | Files: `weave-grep.ts`, `weave-expand-query.ts`, `weave-read.ts`, `dispatch-thread.ts`; tool names: `weave_grep`, `weave_expand_query`, `weave_read`, `dispatch_thread` | Match Anthropic/Claude Code naming rules in [CLAUDE.md](CLAUDE.md). |
| Anthropic OAuth / Claude Code identity | **Required and enabled for parity** with current `weave_ex` | Follow [CLAUDE.md](CLAUDE.md) for headers, betas, tool block formatting, streaming sync. |

**Owner:** Anthony Kim  
**Approver:** Engine architecture review (A. Kim)  
**Sign-off date:** 2026-03-26  
**Status:** Final
