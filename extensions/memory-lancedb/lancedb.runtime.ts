export type * from "@lancedb/lancedb";

export async function loadLanceDBRuntime() {
  return await import("@lancedb/lancedb");
}
