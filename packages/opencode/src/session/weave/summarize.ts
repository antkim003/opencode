import { WeaveSummary } from "./summary"
import { WeaveDB } from "./db"

export namespace WeaveSummarize {
  export async function fromText(input: { sessionID: string; text: string; sourceMessageIDs: string[]; parentID?: string }) {
    const node = await WeaveSummary.addLeaf({
      sessionID: input.sessionID,
      text: input.text,
      sourceMessageIDs: input.sourceMessageIDs,
      parentID: input.parentID,
    })
    await WeaveDB.appendMemoryRecord(input.sessionID, {
      id: `mem:${node.id}`,
      kind: "summary",
      text: node.text,
      refID: node.id,
      metadata: { depth: node.depth },
    })
    return node
  }
}
