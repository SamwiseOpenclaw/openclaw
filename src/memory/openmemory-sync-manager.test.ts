import { describe, expect, it } from "vitest";
import { OpenMemorySyncManager } from "./openmemory-sync-manager.js";

describe("OpenMemorySyncManager", () => {
  it("keeps full dashed session ids from transcript filenames", () => {
    const manager = new OpenMemorySyncManager({
      url: "http://127.0.0.1:8765",
      agentId: "main",
    });

    const helper = manager as unknown as {
      extractSessionId: (absPath: string) => string;
    };

    expect(helper.extractSessionId("/tmp/agents/main/sessions/sess-1.jsonl")).toBe("sess-1");
    expect(helper.extractSessionId("/tmp/agents/main/sessions/abc-123-topic-hello.jsonl")).toBe(
      "abc-123-topic-hello",
    );
  });
});
