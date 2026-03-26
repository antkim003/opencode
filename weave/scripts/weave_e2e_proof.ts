import { Log } from "../../packages/opencode/src/util/log"
import { Server } from "../../packages/opencode/src/server/server"
import { WeaveEpisode, WeaveThread } from "../../packages/opencode/src/session/weave"

Log.init({ print: false })

type SessionResponse = { id: string }
type WeaveResponse = {
  sessionID: string
  snapshots: unknown[]
  summaryNodes: unknown[]
  episodes: Array<{ summary?: string }>
  dispatches: Array<{ action?: string }>
}

async function run() {
  const app = Server.Default()
  const created = await app.request("/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  })
  if (created.status !== 200) {
    throw new Error(`Failed to create session: ${created.status}`)
  }
  const session = (await created.json()) as SessionResponse

  const dispatch = await WeaveThread.dispatch({
    sessionID: session.id,
    parentSessionID: session.id,
    action: "weave-e2e-proof-dispatch",
    role: "thread",
  })
  await WeaveEpisode.create({
    sessionID: session.id,
    threadID: dispatch.threadID,
    summary: "weave-e2e-proof-episode",
    sourceMessageIDs: [],
  })

  const weave = await app.request(`/session/${session.id}/weave`)
  if (weave.status !== 200) {
    throw new Error(`Failed to read weave state: ${weave.status}`)
  }
  const state = (await weave.json()) as WeaveResponse

  const okDispatch = state.dispatches.some((item) => item.action === "weave-e2e-proof-dispatch")
  const okEpisode = state.episodes.some((item) => item.summary === "weave-e2e-proof-episode")
  if (!okDispatch || !okEpisode) {
    throw new Error("E2E proof failed: expected dispatch/episode markers missing in weave state")
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        sessionID: state.sessionID,
        counts: {
          snapshots: state.snapshots.length,
          summaryNodes: state.summaryNodes.length,
          episodes: state.episodes.length,
          dispatches: state.dispatches.length,
        },
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
