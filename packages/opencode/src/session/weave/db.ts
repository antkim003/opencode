import { Storage } from "@/storage/storage"
import { Bus } from "@/bus"
import { WeaveEvent } from "./events"
import type {
  ContextSnapshot,
  Episode,
  MemoryRecord,
  MemoryRecordType,
  MessageLink,
  RetrievalMatch,
  SummaryNode,
  ThreadDispatch,
} from "./types"

type WeaveSessionStore = {
  version: number
  sessionID: string
  createdAt: number
  updatedAt: number
  snapshots: ContextSnapshot[]
  episodes: Episode[]
  summaryNodes: SummaryNode[]
  dispatches: ThreadDispatch[]
  messageLinks: MessageLink[]
  memoryRecords: MemoryRecord[]
}

const STORE_VERSION = 1

function key(sessionID: string) {
  return ["weave", "session", sessionID]
}

async function base(sessionID: string): Promise<WeaveSessionStore> {
  return {
    version: STORE_VERSION,
    sessionID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    snapshots: [],
    episodes: [],
    summaryNodes: [],
    dispatches: [],
    messageLinks: [],
    memoryRecords: [],
  }
}

function scoreMatch(text: string, query: string) {
  if (!query) return 1
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  if (!lowerText.includes(lowerQuery)) return 0
  const occurrences = lowerText.split(lowerQuery).length - 1
  const density = Math.min(1, (occurrences * lowerQuery.length) / Math.max(1, text.length))
  return 1 + density
}

function summarize(store: WeaveSessionStore) {
  const dagDepth = store.summaryNodes.reduce((max, node) => Math.max(max, node.depth), 0)
  const contextPressure = store.snapshots
    .slice(-5)
    .reduce((max, snap) => Math.max(max, snap.summaryNodeIDs.length + snap.recentMessageIDs.length), 0)
  return {
    snapshots: store.snapshots.length,
    summaryNodes: store.summaryNodes.length,
    episodes: store.episodes.length,
    dispatches: store.dispatches.length,
    records: store.memoryRecords.length,
    dagDepth,
    contextPressure,
  }
}

async function emitUpdated(sessionID: string) {
  const store = await WeaveDB.ensure(sessionID)
  Bus.publish(WeaveEvent.Updated, {
    sessionID,
    summary: summarize(store),
  })
}

export namespace WeaveDB {
  export async function ensure(sessionID: string) {
    try {
      const existing = await Storage.read<WeaveSessionStore>(key(sessionID))
      if (existing.version === STORE_VERSION) return existing
      const migrated = {
        ...existing,
        version: STORE_VERSION,
        updatedAt: Date.now(),
        snapshots: existing.snapshots ?? [],
        episodes: existing.episodes ?? [],
        summaryNodes: existing.summaryNodes ?? [],
        dispatches: existing.dispatches ?? [],
        messageLinks: existing.messageLinks ?? [],
        memoryRecords: existing.memoryRecords ?? [],
      }
      await Storage.write(key(sessionID), migrated)
      return migrated
    } catch (error) {
      if (Storage.NotFoundError.isInstance(error)) {
        const initial = await base(sessionID)
        await Storage.write(key(sessionID), initial)
        return initial
      }
      throw error
    }
  }

  export async function appendSnapshot(sessionID: string, snapshot: ContextSnapshot) {
    await ensure(sessionID)
    const next = await Storage.update<WeaveSessionStore>(key(sessionID), (draft) => {
      draft.snapshots.push(snapshot)
      draft.updatedAt = Date.now()
    })
    await emitUpdated(sessionID)
    return next
  }

  export async function appendDispatch(sessionID: string, dispatch: ThreadDispatch) {
    await ensure(sessionID)
    const next = await Storage.update<WeaveSessionStore>(key(sessionID), (draft) => {
      draft.dispatches.push(dispatch)
      draft.updatedAt = Date.now()
    })
    await emitUpdated(sessionID)
    return next
  }

  export async function appendEpisode(sessionID: string, episode: Episode) {
    await ensure(sessionID)
    const next = await Storage.update<WeaveSessionStore>(key(sessionID), (draft) => {
      draft.episodes.push(episode)
      draft.updatedAt = Date.now()
    })
    await emitUpdated(sessionID)
    return next
  }

  export async function appendSummaryNode(sessionID: string, node: SummaryNode) {
    await ensure(sessionID)
    const next = await Storage.update<WeaveSessionStore>(key(sessionID), (draft) => {
      draft.summaryNodes.push(node)
      draft.updatedAt = Date.now()
    })
    await emitUpdated(sessionID)
    return next
  }

  export async function appendMemoryRecord(
    sessionID: string,
    record: Omit<MemoryRecord, "sessionID" | "createdAt"> & { createdAt?: number },
  ) {
    await ensure(sessionID)
    const next = await Storage.update<WeaveSessionStore>(key(sessionID), (draft) => {
      draft.memoryRecords.push({
        ...record,
        sessionID,
        createdAt: record.createdAt ?? Date.now(),
      })
      draft.updatedAt = Date.now()
    })
    await emitUpdated(sessionID)
    return next
  }

  export async function upsertMessageLink(sessionID: string, opencodeMessageID: string, weaveMessageID: string) {
    await ensure(sessionID)
    const next = await Storage.update<WeaveSessionStore>(key(sessionID), (draft) => {
      const index = draft.messageLinks.findIndex((item) => item.opencodeMessageID === opencodeMessageID)
      const next: MessageLink = {
        opencodeMessageID,
        weaveMessageID,
        linkedAt: Date.now(),
      }
      if (index >= 0) draft.messageLinks[index] = next
      else draft.messageLinks.push(next)
      draft.updatedAt = Date.now()
    })
    await emitUpdated(sessionID)
    return next
  }

  export async function resolveWeaveMessageID(sessionID: string, opencodeMessageID: string) {
    const store = await ensure(sessionID)
    return store.messageLinks.find((item) => item.opencodeMessageID === opencodeMessageID)?.weaveMessageID
  }

  export async function read(sessionID: string) {
    return ensure(sessionID)
  }

  export async function queryRecords(input: {
    sessionID: string
    query: string
    limit?: number
    kinds?: MemoryRecordType[]
  }): Promise<RetrievalMatch[]> {
    const store = await ensure(input.sessionID)
    const limit = input.limit ?? 20
    const kinds = input.kinds && input.kinds.length > 0 ? new Set(input.kinds) : undefined

    return store.memoryRecords
      .filter((record) => (kinds ? kinds.has(record.kind) : true))
      .map((record) => ({
        id: record.id,
        kind: record.kind,
        score: scoreMatch(record.text, input.query),
        text: record.text,
        refID: record.refID,
        createdAt: record.createdAt,
      }))
      .filter((record) => record.score > 0)
      .toSorted((a, b) => b.score - a.score || b.createdAt - a.createdAt)
      .slice(0, limit)
  }

  export async function readRecord(sessionID: string, id: string) {
    const store = await ensure(sessionID)
    return store.memoryRecords.find((record) => record.id === id)
  }

  export async function inspector(sessionID: string) {
    const store = await ensure(sessionID)
    return {
      sessionID: store.sessionID,
      version: store.version,
      updatedAt: store.updatedAt,
      summary: summarize(store),
      latest: {
        snapshot: store.snapshots.at(-1),
        episode: store.episodes.at(-1),
        dispatch: store.dispatches.at(-1),
        summaryNode: store.summaryNodes.at(-1),
      },
    }
  }
}
