import { describe, expect, it, vi } from "vitest";
import { parseConsolidationResponse, runConsolidation, type MemoryFile } from "./consolidation.js";

describe("consolidation", () => {
  it("parses JSON model output into a consolidated memory", () => {
    const parsed = parseConsolidationResponse(
      JSON.stringify({
        summary: "Weekly recap.",
        keyFacts: ["Fact A"],
        decisions: ["Decision A"],
        preferences: ["Preference A"],
      }),
      "weekly",
      "2026-W10",
      ["2026-03-02", "2026-03-03"],
      { timestamp: 123 },
    );

    expect(parsed).toEqual({
      level: "weekly",
      period: "2026-W10",
      sourceFiles: ["2026-03-02", "2026-03-03"],
      summary: "Weekly recap.",
      keyFacts: ["Fact A"],
      decisions: ["Decision A"],
      preferences: ["Preference A"],
      timestamp: 123,
    });
  });

  it("runs consolidation through the configured model invocation", async () => {
    const files: MemoryFile[] = [
      {
        path: "/tmp/memory/2026-03-02.md",
        date: "2026-03-02",
        content: "User prefers concise output.",
      },
    ];
    const invokeModel = vi.fn(async () =>
      JSON.stringify({
        summary: "The user asked for concise output.",
        keyFacts: ["User wants concise output"],
        decisions: [],
        preferences: ["Concise output"],
      }),
    );

    const result = await runConsolidation(
      files,
      "weekly",
      "2026-W10",
      "/tmp/out",
      { llmProvider: "minimax" },
      { invokeModel, now: () => 456 },
    );

    expect(invokeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        llmProvider: "minimax",
        model: undefined,
      }),
    );
    expect(result).toEqual({
      level: "weekly",
      period: "2026-W10",
      sourceFiles: ["2026-03-02"],
      summary: "The user asked for concise output.",
      keyFacts: ["User wants concise output"],
      decisions: [],
      preferences: ["Concise output"],
      timestamp: 456,
    });
  });

  it("falls back to raw text when the model does not return valid JSON", async () => {
    const files: MemoryFile[] = [
      {
        path: "/tmp/memory/2026-03-02.md",
        date: "2026-03-02",
        content: "User prefers concise output.",
      },
    ];

    const result = await runConsolidation(
      files,
      "weekly",
      "2026-W10",
      "/tmp/out",
      { llmProvider: "minimax" },
      {
        invokeModel: async () => "plain summary without json",
        now: () => 789,
      },
    );

    expect(result).toEqual({
      level: "weekly",
      period: "2026-W10",
      sourceFiles: ["2026-03-02"],
      summary: "plain summary without json",
      keyFacts: [],
      decisions: [],
      preferences: [],
      timestamp: 789,
    });
  });
});
