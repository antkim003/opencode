import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { DispatchThreadsTool } from "../../src/tool/dispatch-threads"
import { DispatchThreadTool } from "../../src/tool/dispatch-thread"
import { SessionID, MessageID } from "../../src/session/schema"

const ctx = {
  sessionID: SessionID.make("ses_dispatch_threads"),
  messageID: MessageID.make("msg_dispatch_threads"),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.dispatch_threads", () => {
  let initSpy: ReturnType<typeof spyOn> | undefined

  afterEach(() => {
    initSpy?.mockRestore()
    initSpy = undefined
  })

  test("runs items with bounded concurrency and deterministic output order", async () => {
    let inFlight = 0
    let maxInFlight = 0
    const delayByDescription: Record<string, number> = {
      first: 50,
      second: 10,
      third: 30,
      fourth: 0,
    }

    initSpy = spyOn(DispatchThreadTool, "init").mockResolvedValue({
      description: "",
      parameters: {} as any,
      execute: async (args: any) => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await Bun.sleep(delayByDescription[args.description] ?? 0)
        inFlight--
        return {
          title: args.description,
          metadata: {},
          output: `done ${args.description}`,
        }
      },
    } as any)

    const tool = await DispatchThreadsTool.init()
    const result = await tool.execute(
      {
        subagent_type: "explore",
        concurrency: 2,
        items: [
          { description: "first", prompt: "p1" },
          { description: "second", prompt: "p2" },
          { description: "third", prompt: "p3" },
          { description: "fourth", prompt: "p4" },
        ],
      },
      ctx,
    )

    expect(initSpy).toHaveBeenCalledTimes(1)
    expect(maxInFlight).toBe(2)
    expect(result.metadata).toMatchObject({ count: 4, concurrency: 2 })
    expect(result.output).toContain("## item 1\ndone first")
    expect(result.output).toContain("## item 2\ndone second")
    expect(result.output).toContain("## item 3\ndone third")
    expect(result.output).toContain("## item 4\ndone fourth")
    expect(result.output.indexOf("## item 1")).toBeLessThan(result.output.indexOf("## item 2"))
    expect(result.output.indexOf("## item 2")).toBeLessThan(result.output.indexOf("## item 3"))
    expect(result.output.indexOf("## item 3")).toBeLessThan(result.output.indexOf("## item 4"))
  })

  test("caps default concurrency to item count", async () => {
    let inFlight = 0
    let maxInFlight = 0

    initSpy = spyOn(DispatchThreadTool, "init").mockResolvedValue({
      description: "",
      parameters: {} as any,
      execute: async (args: any) => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await Bun.sleep(20)
        inFlight--
        return {
          title: args.description,
          metadata: {},
          output: `done ${args.description}`,
        }
      },
    } as any)

    const tool = await DispatchThreadsTool.init()
    const result = await tool.execute(
      {
        subagent_type: "explore",
        items: [
          { description: "one", prompt: "p1" },
          { description: "two", prompt: "p2" },
        ],
      },
      ctx,
    )

    expect(maxInFlight).toBe(2)
    expect(result.metadata).toMatchObject({ count: 2, concurrency: 2 })
  })
})
