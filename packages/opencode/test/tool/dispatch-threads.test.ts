import { describe, expect, test } from "bun:test"
import { DispatchThreadsTool } from "../../src/tool/dispatch-threads"

describe("tool.dispatch_threads", () => {
  test("has correct id", () => {
    expect(DispatchThreadsTool.id).toBe("dispatch_threads")
  })
})
