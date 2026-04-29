import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "@/lib/server/logger";

describe("logger", () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    spy = vi.spyOn(console, "log").mockImplementation(() => {});
  });
  it("emits JSON with level, message and context", () => {
    logger.info("hello", { userId: "u1" });
    const arg = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(parsed.userId).toBe("u1");
    expect(parsed.timestamp).toBeDefined();
  });
});
