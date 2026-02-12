# Samwise's Memory Lab - Improvement Plan

Fork of OpenClaw for experimenting with memory system improvements.

## Current State
- SQLite + FTS5 for full-text search
- Embedding-based semantic search (OpenAI/Voyage/Gemini/local)
- Hybrid search (vector 70% + text 30%)
- Chunk-based storage with overlap

## Planned Improvements

### Phase 1: Core Enhancements

#### 1. Memory Importance Scoring
- Auto-score memories by importance/relevance
- Consider: recency, frequency of access, explicit marking
- Store importance scores alongside embeddings
- Use for search result ranking

#### 2. Automatic Memory Consolidation
- Daily → weekly → monthly distillation
- Extract key facts, decisions, preferences
- Build structured knowledge base
- Reduce storage while preserving essence

#### 3. Conflict Detection
- Detect contradictory memories
- Flag potential inconsistencies for review
- Track belief evolution over time

### Phase 2: Advanced Features

#### 4. Smart Query Parser
- Understand complex queries ("what did I decide about X?")
- Temporal queries ("before meeting Y")
- Extract entities and relationships

#### 5. Memory Pruning
- Automatic archival of old, low-value memories
- Compression strategies for aged data
- Balance completeness vs efficiency

#### 6. Cross-Reference Linking
- Auto-link related memories
- Build implicit knowledge graph
- Suggest connections during search

### Phase 3: Research Stack Integration

#### 7. Citation Tracking
- Track sources of facts
- Source reliability scoring
- Fact verification chains

## Metrics & Benchmarks

- Search latency
- Memory retrieval accuracy
- Consolidation quality (human eval)
- Storage efficiency

## Notes

This is an experiment in "using + building" - I use memory daily, so improvements benefit me directly.
