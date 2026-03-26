import { describe, expect, test } from "bun:test"
import path from "path"

const llmPath = path.join(import.meta.dir, "../../src/session/llm.ts")

const IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude."
const BETA_STRING =
  "claude-code-20250219,oauth-2025-04-20,fine-grained-tool-streaming-2025-05-14,interleaved-thinking-2025-05-14"

function toPascalCase(input: string) {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

function splitSystemForOAuth(combined: string): string[] {
  const raw = combined ?? ""
  const rest = raw.startsWith(IDENTITY) ? raw.slice(IDENTITY.length).replace(/^\n+/, "") : raw
  const system: string[] = [IDENTITY]
  if (rest) system.push(rest)
  return system
}

describe("anthropic oauth contract", () => {
  test("source contains all required OAuth constants", async () => {
    const src = await Bun.file(llmPath).text()
    expect(src).toContain(IDENTITY)
    expect(src).toContain(BETA_STRING)
    expect(src).toContain('"anthropic-dangerous-direct-browser-access": "true"')
    expect(src).toContain('"anthropic-version": "2023-06-01"')
    expect(src).toContain('"user-agent": "claude-cli/')
    expect(src).toContain('"x-app": "cli"')
    expect(src).toContain("isAnthropicOauth")
  })

  test("source wires PascalCase tool transform", async () => {
    const src = await Bun.file(llmPath).text()
    expect(src).toContain("mapToolsToPascalCase")
    expect(src).toContain("split(/[^a-zA-Z0-9]+/)")
    expect(src).toContain("transformed[toPascalCase(name)] = value")
  })

  test("toPascalCase converts standard tool names", () => {
    expect(toPascalCase("bash")).toBe("Bash")
    expect(toPascalCase("file_read")).toBe("FileRead")
    expect(toPascalCase("file_write")).toBe("FileWrite")
    expect(toPascalCase("grep")).toBe("Grep")
    expect(toPascalCase("glob")).toBe("Glob")
    expect(toPascalCase("list_directory")).toBe("ListDirectory")
  })

  test("toPascalCase preserves already-PascalCase names", () => {
    expect(toPascalCase("Bash")).toBe("Bash")
    expect(toPascalCase("FileRead")).toBe("FileRead")
    expect(toPascalCase("LLMMap")).toBe("LLMMap")
  })

  test("system prompt splits identity into first block", () => {
    const prompt = "You are OpenCode, the best coding agent on the planet.\n\nMore instructions here."
    const blocks = splitSystemForOAuth(prompt)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toBe(IDENTITY)
    expect(blocks[1]).toBe(prompt)
  })

  test("system prompt deduplicates identity if already present", () => {
    const prompt = `${IDENTITY}\nYou are OpenCode, the best coding agent on the planet.`
    const blocks = splitSystemForOAuth(prompt)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toBe(IDENTITY)
    expect(blocks[1]).toBe("You are OpenCode, the best coding agent on the planet.")
  })

  test("system prompt handles identity-only input", () => {
    const blocks = splitSystemForOAuth(IDENTITY)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toBe(IDENTITY)
  })

  test("system prompt handles empty input", () => {
    const blocks = splitSystemForOAuth("")
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toBe(IDENTITY)
  })
})
