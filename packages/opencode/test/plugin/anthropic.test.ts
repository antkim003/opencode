import { describe, expect, test } from "bun:test"
import { buildAuthorizeUrl, generatePKCE } from "../../src/plugin/anthropic"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { ProviderAuth } from "../../src/provider/auth"
import { ProviderID } from "../../src/provider/schema"

describe("plugin.anthropic", () => {
  test("buildAuthorizeUrl includes Anthropic OAuth PKCE parameters", () => {
    const url = new URL(
      buildAuthorizeUrl({
        redirectUri: "http://localhost:53692/callback",
        challenge: "challenge-value",
        state: "state-value",
      }),
    )

    expect(url.origin).toBe("https://claude.ai")
    expect(url.pathname).toBe("/oauth/authorize")
    expect(url.searchParams.get("client_id")).toBe("9d1c250a-e61b-44d9-88ed-5944d1962f5e")
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:53692/callback")
    expect(url.searchParams.get("code_challenge")).toBe("challenge-value")
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("state")).toBe("state-value")
    const scope = url.searchParams.get("scope")
    expect(scope).toContain("user:inference")
    expect(scope).toContain("user:sessions:claude_code")
  })

  test("generatePKCE returns a verifier and challenge", async () => {
    const pkce = await generatePKCE()
    expect(pkce.verifier.length).toBeGreaterThan(40)
    expect(pkce.challenge.length).toBeGreaterThan(20)
  })

  test("registers anthropic OAuth method in ProviderAuth", async () => {
    await using tmp = await tmpdir()
    const methods = await Instance.provide({
      directory: tmp.path,
      fn: async () => ProviderAuth.methods(),
    })
    const anthropic = methods[ProviderID.make("anthropic")]
    expect(anthropic).toBeDefined()
    expect(anthropic.some((item) => item.type === "oauth")).toBe(true)
    expect(anthropic.some((item) => item.label === "Login with Claude")).toBe(true)
  }, 30000)
})
