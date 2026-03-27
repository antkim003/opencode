import { WeaveDB } from "./db"
import type { RetrievalQueryInput, RetrievalReadInput } from "./types"

export namespace WeaveRetrieval {
  export async function query(input: RetrievalQueryInput) {
    return WeaveDB.queryRecords({
      sessionID: input.sessionID,
      query: input.query,
      limit: input.limit,
      kinds: input.kinds,
    })
  }

  export async function read(input: RetrievalReadInput) {
    return WeaveDB.readRecord(input.sessionID, input.id)
  }
}
