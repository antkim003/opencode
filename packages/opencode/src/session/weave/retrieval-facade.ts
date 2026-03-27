import { WeaveRetrieval } from "./retrieval"
import type { MemoryRecordType } from "./types"

export namespace WeaveRetrievalFacade {
  export async function expandQuery(input: {
    sessionID: string
    query: string
    limit?: number
    kinds?: MemoryRecordType[]
  }) {
    const normalized = input.query.trim().toLowerCase()
    const terms = normalized
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 12)
    const expanded = Array.from(new Set([normalized, ...terms])).filter(Boolean)
    const byID = new Map<string, Awaited<ReturnType<typeof WeaveRetrieval.query>>[number]>()
    for (const query of expanded) {
      const next = await WeaveRetrieval.query({
        sessionID: input.sessionID,
        query,
        limit: input.limit,
        kinds: input.kinds,
      })
      for (const item of next) {
        const current = byID.get(item.id)
        if (!current || item.score > current.score) {
          byID.set(item.id, item)
        }
      }
    }
    const limit = input.limit ?? 20
    return Array.from(byID.values())
      .toSorted((a, b) => b.score - a.score || b.createdAt - a.createdAt)
      .slice(0, limit)
  }

  export async function read(input: { sessionID: string; id: string }) {
    return WeaveRetrieval.read(input)
  }
}
