import { describe, expect, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Session } from "../../src/session"
import { WeaveDB } from "../../src/session/weave"
import { WeaveExpandQueryTool } from "../../src/tool/weave-expand-query"
import { WeaveReadTool } from "../../src/tool/weave-read"
import { Log } from "../../src/util/log"

const root = path.join(__dirname, "../..")
Log.init({ print: false })

describe("weave memory interfaces", () => {
  test("weave_expand_query and weave_read return deterministic records", async () => {
    await Instance.provide({
      directory: root,
      fn: async () => {
        const session = await Session.create({})
        await WeaveDB.appendMemoryRecord(session.id, {
          id: "mem:summary:one",
          kind: "summary",
          text: "Implemented deterministic retrieval facade for weave memory.",
        })
        await WeaveDB.appendMemoryRecord(session.id, {
          id: "mem:episode:one",
          kind: "episode",
          text: "Episode completed with operator progress visibility.",
        })

        const queryTool = await WeaveExpandQueryTool.init()
        const readTool = await WeaveReadTool.init()
        const baseCtx = {
          sessionID: session.id as any,
          messageID: "msg_test" as any,
          agent: "build",
          abort: new AbortController().signal,
          messages: [],
          metadata: async () => {},
          ask: async () => {},
        }
        const queryResult = await queryTool.execute(
          {
            query: "retrieval facade",
          },
          baseCtx as any,
        )
        expect(queryResult.metadata.matches).toBeGreaterThanOrEqual(1)
        expect(queryResult.output).toContain("mem:summary:one")

        const readResult = await readTool.execute(
          {
            id: "mem:summary:one",
          },
          baseCtx as any,
        )
        expect(readResult.metadata.found).toBe(true)
        expect(readResult.output).toContain("deterministic retrieval facade")
      },
    })
  })
})
