# Memory Lab v4 - OpenMemory Integration

**Repo:** github.com/SamwiseOpenclaw/openclaw  
**Started:** 2026-02-12  
**Updated:** 2026-02-15 (v4.1 - implementation progress)

---

## Actual Gaps (Why We're Doing This)

1. **No temporal filtering** — Can't search "last Tuesday" or "before meeting X"
2. **MEMORY.md gets stale** — Manual updates inconsistent
3. **No pattern recognition** — Don't notice trends across conversations
4. **No proactive surfacing** — Only search when explicitly asked
5. **No self-awareness** — Don't know my own memory state

---

## Architecture Decision: OpenMemory

Adopting **OpenMemory** (github.com/CaviraOSS/OpenMemory) as enhanced memory backend.

### Why OpenMemory

| Feature               | Built-in            | OpenMemory           | Benefit                |
| --------------------- | ------------------- | -------------------- | ---------------------- |
| Embedding search      | ✅ SQLite + vectors | ✅ SQLite + vectors  | Same                   |
| Sector classification | ❌                  | ✅ 5 types           | Better organization    |
| Temporal queries      | ❌                  | ✅ valid_from/to     | "Last Tuesday" works   |
| Decay over time       | ❌                  | ✅ Per-sector rates  | Forgetting like humans |
| Waypoint graph        | ❌                  | ✅ Associative links | Related memories       |
| Importance scoring    | ✅ Basic            | ✅ Salience + decay  | Richer model           |

---

## Current State (2026-02-15 22:00 UTC)

### ✅ Completed

| Task                 | Status  | Notes                                                 |
| -------------------- | ------- | ----------------------------------------------------- |
| Deploy OpenMemory    | ✅ Done | Running on VPS port 8088 (direct, not Docker)         |
| OpenAI embeddings    | ✅ Done | text-embedding-3-small, 1536 dimensions               |
| Migration script     | ✅ Done | `scripts/migrate-to-openmemory.ts`                    |
| Memories imported    | ✅ Done | 76 chunks from 11 files                               |
| Hamfast connectivity | ✅ Done | Can reach `http://46.62.199.11:8088`                  |
| OpenMemory client    | ✅ Done | `src/memory/openmemory-client.ts`                     |
| Config schema        | ✅ Done | Added `memory.backend` and `memory.openmemory`        |
| Docker image         | ✅ Done | `samwise-openclaw:memory-improvements` (eb7ef8ee798c) |
| Hamfast deployed     | ✅ Done | Running with new image on port 18789                  |

### Deployment Details

```
OpenMemory Server:
├── URL: http://localhost:8088 (VPS) / http://46.62.199.11:8088 (Docker)
├── Process: screen session "openmemory"
├── Embeddings: OpenAI text-embedding-3-small (1536 dim)
├── Storage: ~/clawd/openmemory/packages/openmemory-js/data/openmemory.sqlite
└── Source: ~/clawd/openmemory/ (cloned from CaviraOSS/OpenMemory)
```

**Changed from original plan:** No Docker deployment. Running directly via Node.js in screen session. Simpler, works fine for single-instance use.

### Memory Stats

```
Sectors:
├── semantic: 33 memories (facts, knowledge)
├── procedural: 30 memories (how-tos)
├── reflective: 7 memories (insights)
├── episodic: 5 memories (events)
└── emotional: 1 memory (First Contact 🎉)
```

---

## Phase 4: OpenClaw Integration (IN PROGRESS)

### 4.1 Dual-Path Memory Search

**Goal:** Support both classical (built-in) and OpenMemory paths

```
┌─────────────────────────────────────────────────────┐
│                    memory_search                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│   config.memorySearch.backend = "builtin" | "openmemory"
│                                                      │
│   ┌─────────────┐          ┌──────────────────┐     │
│   │  builtin    │          │   openmemory     │     │
│   │  (default)  │          │   (new path)     │     │
│   └──────┬──────┘          └────────┬─────────┘     │
│          │                          │               │
│          ▼                          ▼               │
│   SQLite + FTS5              HTTP API :8088         │
│   + embeddings               + sectors              │
│                              + temporal             │
│                              + waypoints            │
└─────────────────────────────────────────────────────┘
```

**Configuration:**

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "backend": "openmemory", // NEW: "builtin" or "openmemory"
        "openmemory": {
          // NEW: OpenMemory config
          "url": "http://localhost:8088",
          "userId": "samwise"
        },
        // Existing config still works for builtin:
        "provider": "openai",
        "model": "text-embedding-3-small",
        "sources": ["memory", "sessions"]
      }
    }
  }
}
```

**Implementation approach:**

1. Add `backend` option to memorySearch config
2. When `backend: "openmemory"`, route queries to OpenMemory API
3. When `backend: "builtin"` (default), use existing implementation
4. Both paths return same response format for compatibility

### 4.2 OpenMemory Client Module

**Location:** `src/memory/openmemory-client.ts`

```typescript
interface OpenMemoryConfig {
  url: string;
  userId?: string;
  timeout?: number;
}

interface OpenMemoryClient {
  search(query: string, options?: SearchOptions): Promise<MemoryResult[]>;
  add(content: string, meta?: MemoryMeta): Promise<string>;
  sectors(): Promise<SectorStats[]>;
}

// Convert OpenMemory response to OpenClaw format
function toMemoryResult(omResult: any): MemoryResult {
  return {
    path: omResult.metadata?.source || "openmemory",
    startLine: 0,
    endLine: 0,
    score: omResult.score,
    snippet: omResult.content,
    source: "openmemory",
    sector: omResult.primary_sector, // NEW: expose sector
    citation: `openmemory:${omResult.id}`,
  };
}
```

### 4.3 Files to Modify

| File                              | Change                                                   |
| --------------------------------- | -------------------------------------------------------- |
| `src/memory/index.ts`             | Add backend routing logic                                |
| `src/memory/openmemory-client.ts` | NEW: OpenMemory HTTP client                              |
| `src/config/schema.ts`            | Add `memorySearch.backend` and `memorySearch.openmemory` |
| `src/tools/memory-search.ts`      | Pass through sector info if available                    |

---

## Phase 5: Testing (Hamfast vs Production)

### Test Setup

| Instance             | Memory Backend | Purpose    |
| -------------------- | -------------- | ---------- |
| Samwise (production) | builtin        | Baseline   |
| Hamfast (test)       | openmemory     | New system |

### Test Queries

```typescript
const TEST_QUERIES = [
  // Semantic (facts)
  { query: "Dom location", expect: "Zürich" },
  { query: "infrastructure setup", expect: "VPS" },

  // Procedural (how-to)
  { query: "how to deploy", expect: "steps" },
  { query: "TTS setup", expect: "sag" },

  // Temporal (dates)
  { query: "what happened first meeting", expect: "First Contact" },
  { query: "last week decisions", expect: "recent" },

  // Sector-specific
  { query: "lessons learned", expect: "reflective", sector: "reflective" },
];
```

### Metrics

| Metric          | How                     | Target |
| --------------- | ----------------------- | ------ |
| Latency (p50)   | Measure query time      | <100ms |
| Latency (p95)   | Measure query time      | <300ms |
| Recall@3        | Top-3 contains expected | >80%   |
| Sector accuracy | Correct sector assigned | >90%   |

---

## Phase 6: Periodic Review (Future)

**Goal:** Analyze memories for patterns and maintenance needs

Not compression — embedding search doesn't need summaries.  
Analysis — what can we learn from reviewing past periods?

### Outputs

| Output                    | Purpose                               |
| ------------------------- | ------------------------------------- |
| **Patterns**              | "X discussed 4 times this week"       |
| **Contradictions**        | "Monday said A, Wednesday said not-A" |
| **Gaps**                  | "Discussed Y but no outcome recorded" |
| **MEMORY.md suggestions** | Add/update/remove facts               |
| **Importance boosts**     | Increase scores for recurring items   |

### Architecture

```
Cron: Sunday 21:00 UTC
  → Isolated session
  → Read: past week's daily files
  → Analyze: patterns, contradictions, gaps
  → Output: memory/reviews/weekly-YYYY-WXX.md
  → Suggest: MEMORY.md changes (I review, Dom approves if needed)
```

### Review Format

```markdown
# Weekly Review - 2026-W07

**Period:** 2026-02-10 to 2026-02-16

## Patterns

- [Topic/entity with frequency and significance]

## Contradictions

- [Conflict with source dates]

## Open Items

- [Unresolved question or TODO]

## MEMORY.md Suggestions

- Add: [new fact]
- Update: [old → new]
- Remove: [stale]

## Importance Adjustments

- Boost: [items to increase score]
```

---

## Next Steps

1. [x] **Create OpenMemory client** (`src/memory/openmemory-client.ts`) ✅
2. [x] **Add config schema** for backend selection ✅
3. [x] **Implement routing** in memory_search ✅
4. [x] **Configure Hamfast** to use `backend: "openmemory"` ✅
5. [x] **Fix Zod schema deployment** - Rebuilt Docker from scratch ✅
6. [ ] **Run comparison tests** - Hamfast vs Production
7. [ ] **Document results**

## Files & Locations

| File                                               | Purpose           | Status        |
| -------------------------------------------------- | ----------------- | ------------- |
| `docs/memory-lab-plan.md`                          | This plan         | ✅            |
| `~/clawd/scripts/migrate-to-openmemory.ts`         | Migration script  | ✅            |
| `~/clawd/scripts/test-openmemory.ts`               | Unit tests        | ✅            |
| `~/clawd/scripts/compare-memory.ts`                | Comparison tests  | ✅            |
| `~/clawd/openmemory/`                              | OpenMemory source | ✅ Cloned     |
| `~/clawd/openclaw/src/memory/openmemory-client.ts` | OpenClaw client   | ✅ Done       |
| `~/clawd/openclaw/src/memory/search-manager.ts`    | Routing logic     | ✅ Modified   |
| `~/clawd/openclaw/src/memory/backend-config.ts`    | Config types      | ✅ Modified   |
| `~/clawd/openclaw/src/config/types.memory.ts`      | Schema types      | ✅ Modified   |
| `~/clawd/hamfast/config/openclaw.json`             | Hamfast config    | ✅ Configured |

---

## Risk Mitigation

| Risk                        | Mitigation                        |
| --------------------------- | --------------------------------- |
| Integration breaks existing | Dual-path: default to builtin     |
| OpenMemory server down      | Fallback to builtin on error      |
| Different response format   | Normalize in client module        |
| Performance regression      | Test on Hamfast before production |

---

## Changelog

- **v4.1 (2026-02-15):** Updated with implementation progress
  - Deployed OpenMemory directly (not Docker)
  - Using OpenAI embeddings (1536 dim)
  - 76 memories migrated
  - Defined dual-path integration approach
- **v4.0 (2026-02-15):** Initial OpenMemory integration plan

---

## Lessons Learned

1. **Question assumptions** — "Compression" sounded good but wasn't solving real problems
2. **Follow the data flow** — Embedding search handles retrieval; gaps are elsewhere
3. **Defer complexity** — Entity extraction is cool but not critical yet
4. **Focus on maintenance** — Keeping MEMORY.md fresh is higher value than fancy features

---

_"Classical path for safety, new path for power."_
