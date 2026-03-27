import { WeaveThread } from "./thread"
import { WeaveDB } from "./db"

export namespace WeaveDispatch {
  export async function thread(input: {
    sessionID: string
    parentSessionID: string
    action: string
    delegatedScope?: string
  }) {
    const dispatch = await WeaveThread.dispatch({
      sessionID: input.sessionID,
      parentSessionID: input.parentSessionID,
      action: input.action,
      delegatedScope: input.delegatedScope,
      role: "thread",
    })
    await WeaveDB.appendMemoryRecord(input.sessionID, {
      id: `mem:${dispatch.threadID}`,
      kind: "dispatch",
      text: dispatch.action,
      refID: dispatch.threadID,
      metadata: {
        role: dispatch.role ?? "thread",
      },
    })
    return dispatch
  }
}
