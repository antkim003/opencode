import type { ModelMessage } from "ai"
import type { MessageV2 } from "@/session/message-v2"

export type ExecutionRole = "orchestrator" | "thread" | "operator"

export type ThreadDispatch = {
  threadID: string
  parentSessionID: string
  action: string
  delegatedScope?: string
  role?: ExecutionRole
  toolProfile?: string
  modelOverride?: string
}

export type Episode = {
  id: string
  sessionID: string
  threadID?: string
  summary: string
  status: "completed" | "failed" | "cancelled"
  sourceMessageIDs: string[]
  createdAt: number
}

export type SummaryNode = {
  id: string
  sessionID: string
  parentID?: string
  depth: number
  text: string
  sourceMessageIDs: string[]
  createdAt: number
}

export type ContextSnapshot = {
  sessionID: string
  role: ExecutionRole
  summaryNodeIDs: string[]
  recentMessageIDs: string[]
  fileRefs: string[]
  createdAt: number
}

export type MessageLink = {
  opencodeMessageID: string
  weaveMessageID: string
  linkedAt: number
}

export type MemoryRecordType = "summary" | "episode" | "dispatch" | "snapshot"

export type MemoryRecord = {
  id: string
  sessionID: string
  kind: MemoryRecordType
  text: string
  refID?: string
  createdAt: number
  metadata?: Record<string, string | number | boolean>
}

export type RetrievalMatch = {
  id: string
  kind: MemoryRecordType
  score: number
  text: string
  refID?: string
  createdAt: number
}

export type RetrievalQueryInput = {
  sessionID: string
  query: string
  limit?: number
  kinds?: MemoryRecordType[]
}

export type RetrievalReadInput = {
  sessionID: string
  id: string
}

export type BuildContextInput = {
  sessionID: string
  role: ExecutionRole
  messages: MessageV2.WithParts[]
  modelMessages: ModelMessage[]
}

export type BuildContextOutput = {
  modelMessages: ModelMessage[]
  snapshot: ContextSnapshot
}
