import z from "zod"
import { Tool } from "./tool"
import { WeaveRetrievalFacade } from "@/session/weave"

export const WeaveReadTool = Tool.define("weave_read", {
  description: "Read a single Weave memory record by retrieval id.",
  parameters: z.object({
    id: z.string().describe("Memory record id returned from weave_expand_query."),
  }),
  async execute(params, ctx) {
    await ctx.ask({
      permission: "weave_read",
      patterns: ["*"],
      always: ["*"],
      metadata: { id: params.id },
    })

    const record = await WeaveRetrievalFacade.read({
      sessionID: ctx.sessionID,
      id: params.id,
    })
    if (!record) {
      return {
        title: "Weave read",
        metadata: { found: false, kind: "", refID: "" },
        output: `No record found for id ${params.id}.`,
      }
    }
    return {
      title: "Weave read",
      metadata: {
        found: true,
        kind: record.kind,
        refID: record.refID ?? "",
      },
      output: [`id: ${record.id}`, `kind: ${record.kind}`, `created_at: ${record.createdAt}`, "", record.text].join("\n"),
    }
  },
})
