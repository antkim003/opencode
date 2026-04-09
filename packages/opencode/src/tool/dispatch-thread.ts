import z from "zod"
import { Effect } from "effect"
import { Tool } from "./tool"
import { TaskTool } from "./task"
import { WeaveThread } from "@/session/weave"

const parameters = z.object({
  description: z.string().describe("Short thread task description."),
  prompt: z.string().describe("Prompt to run in the thread."),
  subagent_type: z.string().describe("Subagent type for thread execution."),
  delegated_scope: z.string().optional().describe("Optional explicit scope delegated to this thread."),
})

export const DispatchThreadTool = Tool.defineEffect(
  "dispatch_thread",
  Effect.gen(function* () {
    const taskInfo = yield* TaskTool
    const taskDef = yield* Tool.init(taskInfo)

    return {
      description:
        "Create a typed Weave thread dispatch and execute it via subagent task infrastructure. Returns thread id + task result.",
      parameters,
      async execute(params: z.infer<typeof parameters>, ctx: Tool.Context) {
        await ctx.ask({
          permission: "dispatch_thread",
          patterns: [params.subagent_type],
          always: ["*"],
          metadata: params,
        })

        const dispatch = await WeaveThread.dispatch({
          sessionID: ctx.sessionID,
          parentSessionID: ctx.sessionID,
          action: params.description,
          delegatedScope: params.delegated_scope,
          role: "thread",
        })

        const result = await taskDef.execute(
          {
            description: params.description,
            prompt: params.prompt,
            subagent_type: params.subagent_type,
          },
          ctx,
        )

        return {
          title: params.description,
          metadata: {
            threadID: dispatch.threadID,
            delegated_scope: params.delegated_scope,
          },
          output: [`thread_id: ${dispatch.threadID}`, "", result.output].join("\n"),
        }
      },
    }
  }),
)
