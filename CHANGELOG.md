# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-26

### Added

- **`dream()` function** — main entry point that runs the full four-phase memory consolidation cycle (orient → gather → consolidate → prune).
- **Orient phase** (`src/orient.js`) — reads the memory file, state file, and log directory; identifies unprocessed daily log files.
- **Gather phase** (`src/gather.js`) — reads unprocessed `YYYY-MM-DD.md` log files into structured `{ filename, date, content }` objects.
- **Consolidate phase** (`src/consolidate.js`) — delegates to a caller-supplied `consolidate(memory, logs)` function; validates input/output types.
- **Prune phase** (`src/prune.js`) — writes updated memory back to disk and persists the new state (processed files + timestamp) to the state file.
- **Event system** — `onPhase`, `onDone`, and `onError` callbacks powered by Node.js `EventEmitter`; phase events carry name, status, metadata, and timestamp.
- **CLI** (`bin/agent-dream.js`) — `npx agent-dream --memory --logs --state --consolidator` with support for three consolidator export shapes.
- **BYOLLM design** — zero opinions about which LLM to use; the consolidation function is fully caller-supplied, making the library compatible with any model or API.
- **Zero runtime dependencies** — relies only on Node.js built-ins (`fs/promises`, `path`, `events`); requires Node ≥ 18.

[Unreleased]: https://github.com/theclawjack/agent-dream/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/theclawjack/agent-dream/releases/tag/v0.1.0
