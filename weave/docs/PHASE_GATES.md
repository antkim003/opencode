# Weave Fork Phase Gates

This checklist operationalizes the execution gates for the OpenCode fork in this repository.

## Gate A - Fork Setup

- [x] `origin` points to `antkim003/opencode`
- [x] `upstream` points to `anomalyco/opencode`
- [x] default working branch is `dev`
- [x] fork sync workflow is documented in team workflow notes

## Gate B - Architecture Decision Sign-off

- [x] `OPENCODE_ARCHITECTURE_DECISIONS.md` has a named owner
- [x] sign-off approver and date are recorded
- [x] storage/message/tool-id choices are marked final (not provisional)

## Gate C - Weave Seam Activation

- [x] `packages/opencode/src/session/weave/` namespace exists
- [x] prompt assembly routes through Weave context builder seam
- [x] no baseline command regressions in startup, chat, and tool execution

## Gate D - Core Weave Runtime

- [x] dual-store persistence migrations run successfully
- [x] context, threads, episodes, and compaction primitives persist to Weave store
- [x] retrieval tools operate on Weave-owned records

## Gate E - Parity and OAuth

- [x] CLI/TUI parity matrix passes
- [x] OAuth conformance matrix passes for streaming and non-streaming

## Gate F - Cutover Readiness

- [x] cutover scorecard compares `weave_ex` and `weave_opencode`
- [x] go/no-go criteria documented
- [x] rollback procedure documented and tested
