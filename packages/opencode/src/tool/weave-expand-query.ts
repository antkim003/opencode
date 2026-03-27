import z from "zod"
import { Tool } from "./tool"
import { WeaveRetrievalFacade } from "@/session/weave"

export const WeaveExpandQueryTool = Tool.define("weave_expand_query", {
  description:
    "Expand and search query text against Weave memory records (summary, episode, dispatch, snapshot) for deterministic retrieval.",
  parameters: z.object({
    query: z.string().min(1).describe("Query text to expand and search."),
    limit: z.number().int().positive().max(200).optional().describe("Maximum records to return."),
    kinds: z
      .array(z.enum(["summary", "episode", "dispatch", "snapshot"]))
      .optional()
      .describe("Optional record kinds to include."),
  }),
  async execute(params, ctx) {
    await ctx.ask({
      permission: "weave_expand_query",
      patterns: ["*"],
      always: ["*"],
      metadata: { query: params.query, limit: params.limit, kinds: params.kinds },
    })

    const matches = await WeaveRetrievalFacade.expandQuery({
      sessionID: ctx.sessionID,
      query: params.query,
      limit: params.limit,
      kinds: params.kinds,
    })

    const lines = matches.map((item, index) =>
      [`${index + 1}. [${item.kind}] ${item.id} (score=${item.score.toFixed(2)})`, item.text].join("\n"),
    )
    return {
      title: "Weave query expansion",
      metadata: { query: params.query, matches: matches.length },
      output: lines.length ? lines.join("\n\n") : "No Weave retrieval matches found.",
    }
  },
})
