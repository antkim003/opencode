import { WeaveSummary } from "./summary"
import { WeaveDB } from "./db"

export namespace WeaveCondense {
  export async function compact(input: { sessionID: string; text: string; parentID?: string }) {
    const nodes = await WeaveSummary.list(input.sessionID)
    const batch = nodes.slice(0, 8)
    if (batch.length < 2) return undefined
    const node = await WeaveSummary.condense({
      sessionID: input.sessionID,
      parentID: input.parentID,
      nodes: batch,
      text: input.text,
    })
    await WeaveDB.appendMemoryRecord(input.sessionID, {
      id: `mem:${node.id}`,
      kind: "summary",
      text: node.text,
      refID: node.id,
      metadata: { depth: node.depth, condensed: true },
    })
    return node
  }
}
