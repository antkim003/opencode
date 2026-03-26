# Claude OAuth Conformance Matrix

This matrix tracks OAuth parity requirements for Anthropic Claude Code identity behavior.

## Login lifecycle

- [x] OAuth login link generation is available via provider auth (`provider=anthropic`, method `Login with Claude`).
- [x] OAuth callback hook is wired through provider auth `authorize`/`callback`.
- [ ] OAuth login flow succeeds end-to-end in a live interactive environment.
- [ ] Auth status reflects valid/invalid token state accurately.
- [ ] Logout clears stored credentials.
- [ ] Expired token recovery path is validated.

## Request contract (non-streaming)

- [x] Required OAuth headers are injected for Anthropic OAuth mode.
- [x] Full Claude Code beta set is included.
- [x] Claude Code identity string is prepended to system prompt.
- [x] PascalCase tool naming transform is applied before request dispatch.

## Request contract (streaming)

- [x] Streaming uses the same OAuth header contract as non-streaming.
- [x] Streaming uses the same system prompt identity behavior.
- [x] Streaming uses the same tool-name mapping behavior.

## Tool protocol

- [x] Outbound tool names are PascalCase in OAuth mode.
- [ ] Inbound tool naming round-trip is verified with live Anthropic OAuth calls.
- [ ] Tool result message shape verified against live API expectations.

## Mode isolation

- [x] OAuth-only headers are gated to Anthropic OAuth mode.
- [x] Non-OAuth flows continue using existing provider behavior.

## 2026-03-26 verification notes

- Added/ran `test/session/llm-oauth-contract.test.ts` to assert:
  - Claude Code identity prefix contract is present.
  - Required Anthropic beta header set is present.
  - PascalCase tool transform path is present and wired.
- Added `src/plugin/anthropic.ts` and internal registration so Anthropic OAuth follows OpenCode plugin OAuth lifecycle (link + callback + refresh).
- Added `test/plugin/anthropic.test.ts` to verify authorize URL contract, PKCE generation, and method registration in `ProviderAuth.methods()`.
- Remaining unchecked items require live Anthropic OAuth credentials/session for runtime validation.
