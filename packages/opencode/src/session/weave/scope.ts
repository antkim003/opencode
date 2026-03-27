import { WeaveDB } from "./db"
import type { MemoryRecordType } from "./types"

export namespace WeaveScope {
  export function normalizeKinds(input?: MemoryRecordType[]) {
    if (!input || input.length === 0) return undefined
    return Array.from(new Set(input))
  }

  export async function pressure(sessionID: string) {
    const state = await WeaveDB.inspector(sessionID)
    return state.summary.contextPressure
  }
}
