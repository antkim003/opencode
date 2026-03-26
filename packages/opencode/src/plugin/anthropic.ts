import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { Auth, OAUTH_DUMMY_KEY } from "@/auth"
import { Log } from "@/util/log"

const log = Log.create({ service: "plugin.anthropic" })

const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
const AUTHORIZE_URL = "https://claude.ai/oauth/authorize"
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token"
const OAUTH_PORT = 53692
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000
const OAUTH_EXPIRY_SAFETY_MS = 60_000
const OAUTH_SCOPES = [
  "org:create_api_key",
  "user:profile",
  "user:inference",
  "user:sessions:claude_code",
  "user:mcp_servers",
  "user:file_upload",
]

type PkcePair = {
  verifier: string
  challenge: string
}

type TokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

type PendingOAuth = {
  state: string
  resolve: (value: { code: string; state: string }) => void
  reject: (error: Error) => void
}

let oauthServer: ReturnType<typeof Bun.serve> | undefined
let pendingOAuth: PendingOAuth | undefined

export function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes)
    .map((byte) => chars[byte % chars.length])
    .join("")
}

export async function generatePKCE(): Promise<PkcePair> {
  const verifier = generateRandomString(64)
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  return {
    verifier,
    challenge: base64UrlEncode(digest),
  }
}

export function buildAuthorizeUrl(input: { redirectUri: string; challenge: string; state: string }) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: input.redirectUri,
    scope: OAUTH_SCOPES.join(" "),
    code_challenge: input.challenge,
    code_challenge_method: "S256",
    state: input.state,
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

async function exchangeCodeForTokens(input: { code: string; state: string; verifier: string; redirectUri: string }) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code: input.code,
      state: input.state,
      redirect_uri: input.redirectUri,
      code_verifier: input.verifier,
    }),
  })
  if (!response.ok) throw new Error(`Anthropic token exchange failed (${response.status})`)
  return (await response.json()) as TokenResponse
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  })
  if (!response.ok) throw new Error(`Anthropic token refresh failed (${response.status})`)
  return (await response.json()) as TokenResponse
}

async function startOAuthServer() {
  if (oauthServer) {
    return { redirectUri: `http://localhost:${OAUTH_PORT}/callback` }
  }

  oauthServer = Bun.serve({
    port: OAUTH_PORT,
    fetch(request) {
      const url = new URL(request.url)
      if (url.pathname !== "/callback") return new Response("Not found", { status: 404 })

      const code = url.searchParams.get("code")
      const state = url.searchParams.get("state")
      const error = url.searchParams.get("error")

      if (!pendingOAuth) {
        return new Response("No OAuth request in progress", { status: 400 })
      }

      if (error) {
        pendingOAuth.reject(new Error(error))
        pendingOAuth = undefined
        return new Response("Authorization failed. You can close this window.", { status: 400 })
      }

      if (!code || !state) {
        pendingOAuth.reject(new Error("Missing code or state"))
        pendingOAuth = undefined
        return new Response("Missing callback parameters. You can close this window.", { status: 400 })
      }

      if (state !== pendingOAuth.state) {
        pendingOAuth.reject(new Error("Invalid OAuth state"))
        pendingOAuth = undefined
        return new Response("Invalid OAuth state. You can close this window.", { status: 400 })
      }

      pendingOAuth.resolve({ code, state })
      pendingOAuth = undefined
      return new Response("Authorization successful. You can close this window.", { status: 200 })
    },
  })

  log.info("anthropic oauth server started", { port: OAUTH_PORT })
  return { redirectUri: `http://localhost:${OAUTH_PORT}/callback` }
}

function stopOAuthServer() {
  if (!oauthServer) return
  oauthServer.stop()
  oauthServer = undefined
  log.info("anthropic oauth server stopped")
}

function waitForOAuthCallback(state: string) {
  return new Promise<{ code: string; state: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!pendingOAuth) return
      pendingOAuth = undefined
      reject(new Error("Anthropic OAuth callback timed out"))
    }, OAUTH_TIMEOUT_MS)

    pendingOAuth = {
      state,
      resolve: (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      reject: (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    }
  })
}

export async function AnthropicAuthPlugin(input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "anthropic",
      async loader(getAuth) {
        const auth = await getAuth()
        if (auth.type !== "oauth") return {}

        return {
          apiKey: OAUTH_DUMMY_KEY,
          async fetch(requestInput: RequestInfo | URL, init?: RequestInit) {
            const currentAuth = await getAuth()
            if (currentAuth.type !== "oauth") return fetch(requestInput, init)

            let access = currentAuth.access
            let refresh = currentAuth.refresh

            if (!access || currentAuth.expires <= Date.now() + OAUTH_EXPIRY_SAFETY_MS) {
              const tokens = await refreshAccessToken(refresh)
              access = tokens.access_token
              refresh = tokens.refresh_token || refresh
              const expires = Date.now() + (tokens.expires_in ?? 3600) * 1000

              await input.client.auth.set({
                path: { id: "anthropic" },
                body: {
                  type: "oauth",
                  access,
                  refresh,
                  expires,
                },
              })
            }

            const headers = new Headers(init?.headers)
            headers.delete("x-api-key")
            headers.delete("X-Api-Key")
            headers.delete("authorization")
            headers.delete("Authorization")
            headers.set("authorization", `Bearer ${access}`)

            return fetch(requestInput, {
              ...init,
              headers,
            })
          },
        }
      },
      methods: [
        {
          type: "oauth",
          label: "Login with Claude",
          authorize: async () => {
            const { redirectUri } = await startOAuthServer()
            const pkce = await generatePKCE()
            const state = generateRandomString(48)
            const url = buildAuthorizeUrl({
              redirectUri,
              challenge: pkce.challenge,
              state,
            })
            const callbackPromise = waitForOAuthCallback(state)

            return {
              url,
              method: "auto" as const,
              instructions: "Complete login in your browser. OpenCode will finish when redirected back.",
              callback: async () => {
                try {
                  const callback = await callbackPromise
                  const tokens = await exchangeCodeForTokens({
                    code: callback.code,
                    state: callback.state,
                    verifier: pkce.verifier,
                    redirectUri,
                  })
                  return {
                    type: "success" as const,
                    access: tokens.access_token,
                    refresh: tokens.refresh_token || tokens.access_token,
                    expires: Date.now() + (tokens.expires_in ?? 3600) * 1000,
                  }
                } catch (error) {
                  log.error("anthropic oauth callback failed", { error })
                  return { type: "failed" as const }
                } finally {
                  stopOAuthServer()
                }
              },
            }
          },
        },
        {
          label: "Manually enter API Key",
          type: "api",
        },
      ],
    },
    "chat.headers": async (incoming, output) => {
      if (incoming.model.providerID !== "anthropic") return
      const auth = await Auth.get("anthropic")
      if (auth?.type !== "oauth") return
      output.headers.authorization = `Bearer ${auth.access}`
    },
  }
}
