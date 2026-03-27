import { WeaveScope } from "./scope"
import { WeaveRetrievalFacade } from "./retrieval-facade"

export namespace WeaveOrchestrator {
  export async function snapshot(sessionID: string) {
    const pressure = await WeaveScope.pressure(sessionID)
    const recent = await WeaveRetrievalFacade.expandQuery({
      sessionID,
      query: "recent context summary",
      limit: 5,
    })
    return {
      contextPressure: pressure,
      retrieval: recent,
    }
  }
}
