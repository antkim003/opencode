import z from "zod"
import { Tool } from "./tool"
import { DispatchThreadTool } from "./dispatch-thread"

const parameters = z.object({
  subagent_type: z.string().describe("Subagent type for all thread items."),
  concurrency: z.number().int().min(1).max(10).optional().describe("Maximum number of parallel thread dispatches."),
  items: z
    .array(
      z.object({
        description: z.string(),
        prompt: z.string(),
        delegated_scope: z.string().optional(),
      }),
    )
    .min(1)
    .max(50)
    .describe("List of thread dispatch inputs."),
})

export const DispatchThreadsTool = Tool.define("dispatch_threads", {
  description: "Dispatch multiple Weave threads with bounded concurrency and deterministic output ordering.",
  parameters,
  async execute(params, ctx) {
    await ctx.ask({
      permission: "dispatch_threads",
      patterns: [params.subagent_type],
      always: ["*"],
      metadata: { count: params.items.length, concurrency: params.concurrency },
    })

    const tool = await DispatchThreadTool.init()
    const itemCount = params.items.length
    const concurrency = Math.min(params.concurrency ?? 3, itemCount)
    const outputs = new Array<string>(itemCount)
    let nextIndex = 0

    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (true) {
          const index = nextIndex++
          if (index >= itemCount) return
          const item = params.items[index]
          const result = await tool.execute(
            {
              description: item.description,
              prompt: item.prompt,
              subagent_type: params.subagent_type,
              delegated_scope: item.delegated_scope,
            },
            ctx,
          )
          outputs[index] = [`## item ${index + 1}`, result.output].join("\n")
        }
      }),
    )

    const lines: string[] = []
    for (const output of outputs) {
      lines.push(output)
    }

    return {
      title: "Batch thread dispatch",
      metadata: { count: itemCount, concurrency },
      output: lines.join("\n\n").trim(),
    }
  },
})
