import { BusEvent } from "@/bus/bus-event"
import z from "zod"

export namespace WeaveEvent {
  export const Updated = BusEvent.define(
    "session.weave.updated",
    z.object({
      sessionID: z.string(),
      summary: z.object({
        snapshots: z.number().int().nonnegative(),
        summaryNodes: z.number().int().nonnegative(),
        episodes: z.number().int().nonnegative(),
        dispatches: z.number().int().nonnegative(),
        records: z.number().int().nonnegative(),
        dagDepth: z.number().int().nonnegative(),
        contextPressure: z.number().int().nonnegative(),
      }),
    }),
  )
}
