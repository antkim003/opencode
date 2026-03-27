import { WeaveDB } from "./db"

export namespace WeaveMigration {
  export async function ensure(sessionID: string) {
    return WeaveDB.ensure(sessionID)
  }
}
