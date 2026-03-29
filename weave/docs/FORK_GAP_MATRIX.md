# Weave Fork Gap Matrix

Last updated: 2026-03-26

This matrix compares documented fork targets in `weave_ex/docs` with the current TypeScript fork under `weave_opencode`.

## Legend

- Implemented: shipped in fork code with clear evidence
- Partial: present but incomplete vs documented target
- Missing: not present in fork code

## Matrix

| Capability | Target Source | Current Fork Status | Evidence |
|---|---|---|---|
| Weave namespace seam in session runtime | `weave_ex/docs/OPENCODE_FORK_PLAN.md` | Implemented | `packages/opencode/src/session/weave/index.ts`, `runtime.ts`, `context.ts`, `db.ts`, `types.ts` |
| Full namespace module set (`summarize`, `condense`, `retrieval`, `retrieval-facade`, `dispatch`, `scope`, `orchestrator`, `config`, `migration`) | `weave_ex/docs/OPENCODE_FORK_PLAN.md` | Partial | Missing files under `packages/opencode/src/session/weave/` (only 9 files currently) |
| Memory retrieval tools (`weave_grep`, `weave_describe`, `weave_expand`) | `weave_ex/docs/OPENCODE_FORK_PLAN.md`, `weave_ex/docs/SPEC.md` | Implemented | `packages/opencode/src/tool/weave-grep.ts`, `weave-describe.ts`, `weave-expand.ts` |
| Additional memory tools (`weave_expand_query`, `weave_read`) | `weave_ex/docs/SPEC.md` | Missing | No `weave-expand-query.ts` or `weave-read.ts` in `packages/opencode/src/tool/` |
| Dispatch tools (`dispatch_thread`, `dispatch_threads`) | `weave_ex/docs/OPENCODE_FORK_PLAN.md` | Implemented | `packages/opencode/src/tool/dispatch-thread.ts`, `dispatch-threads.ts` |
| Operator tools (`llm_map`, `agentic_map`) | `weave_ex/docs/SPEC.md`, `weave_ex/docs/SYNTHESIS.md` | Implemented (baseline) | `packages/opencode/src/tool/llm-map.ts`, `agentic-map.ts`; deeper parity still pending |
| Prompt assembly routed through Weave seam | `weave_opencode/weave/docs/PHASE_GATES.md` Gate C | Implemented | Gate C checklist marks prompt routing as complete |
| Baseline startup/chat/tool regression pass | `weave_opencode/weave/docs/PHASE_GATES.md` Gate C | Missing | Gate C third item unchecked |
| CLI/TUI parity matrix pass | `weave_opencode/weave/docs/PHASE_GATES.md` Gate E | Missing | Gate E first item unchecked |
| OAuth conformance matrix pass | `weave_opencode/weave/docs/PHASE_GATES.md` Gate E | Missing | Gate E second item unchecked |
| Cutover scorecard + go/no-go + rollback verified | `weave_opencode/weave/docs/PHASE_GATES.md` Gate F | Missing | Gate F items unchecked |
| Architecture decisions signed off | `weave_opencode/weave/docs/PHASE_GATES.md` Gate B | Missing | Gate B items unchecked |
| Slate-style visible thread orchestration and episodes in TUI | `weave_ex/docs/SPEC.md` section 6 | Partial | TUI has session/thread surfaces; full thread-status panel + DAG overlay + operator bars not complete |
| Volt/LCM parity for richer DAG/compaction controls in fork UI | `weave_ex/docs/SPEC.md`, `weave_ex/docs/SYNTHESIS.md` | Partial | Core Weave store/state exists; complete UI parity and operator-progress visualization pending |

## Summary

- Implemented foundation: seam, primary Weave tools, dispatch tools, operator baseline.
- Main gaps: missing memory tools (`weave_expand_query`, `weave_read`), missing module coverage in `session/weave`, incomplete parity/cutover gates, and incomplete Slate/Volt UX parity in TUI.
