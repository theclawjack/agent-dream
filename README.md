# agent-dream

A framework-agnostic memory consolidation cycle for AI agents. Bring your own LLM.

---

## Install

```bash
npm install agent-dream
```

## Quick Start

```js
const { dream } = require('agent-dream');

const result = await dream({
  memoryFile: './memory.md',
  logsDir:    './logs',
  stateFile:  './state.json',
  consolidate: async (longTermMemory, newLogs) => {
    const entries = newLogs.map(l => `## ${l.date}\n${l.content}`).join('\n\n');
    return longTermMemory ? `${longTermMemory}\n\n${entries}` : entries;
  },
});

console.log(`Processed: ${result.processed}, Skipped: ${result.skipped}`);
```

---

## How It Works

`dream()` runs a four-phase cycle that reads daily log files, consolidates them into long-term memory, and tracks what has already been processed.

```
Orient → Gather → Consolidate → Prune
```

| Phase | What it does |
|-------|-------------|
| **Orient** | Reads the memory file, state file, and log directory. Determines which daily log files are new (unprocessed). |
| **Gather** | Reads the content of each unprocessed log file into memory as `{ filename, date, content }` objects. |
| **Consolidate** | Calls your `consolidate(longTermMemory, newLogs)` function. You decide what to do with your LLM. |
| **Prune** | Writes the updated memory back to disk and records the processed file names in the state file. |

---

## Config Reference

Pass a single config object to `dream()`:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `memoryFile` | `string` | ✅ | Path to the long-term memory file (markdown). Created if it doesn't exist. |
| `logsDir` | `string` | ✅ | Directory containing daily log files named `YYYY-MM-DD.md`. |
| `stateFile` | `string` | ✅ | Path to a JSON file tracking which logs have been processed. Created if it doesn't exist. |
| `consolidate` | `async (memory, logs) => string` | ✅ | Your consolidation function. Receives current memory and new logs; must return updated memory as a string. |
| `onPhase` | `(event) => void` | ❌ | Called at the start and end of each phase. See [Events](#events). |
| `onDone` | `(result) => void` | ❌ | Called when the dream cycle completes successfully. |
| `onError` | `(err) => void` | ❌ | Called if the dream cycle throws. |

---

## Return Value

`dream()` returns a Promise that resolves to:

```js
{
  processed: number,   // number of new log files consolidated
  skipped:   number,   // number of already-processed files skipped
  newMemory: string,   // the updated long-term memory content
  state: {             // the updated state written to stateFile
    lastDream:              string,   // ISO timestamp
    dailyFilesProcessed:    string[], // all files ever processed
    version:                number,
  }
}
```

---

## Events

### `onPhase`

Fired at the start and end of each phase:

```js
{
  name:      'orient' | 'gather' | 'consolidate' | 'prune',
  status:    'start' | 'done',
  meta:      object | null,  // phase-specific details (e.g. file counts)
  timestamp: string,         // ISO timestamp
}
```

### `onDone`

Fired with the same object that `dream()` resolves to (see [Return Value](#return-value)).

### `onError`

Fired with the `Error` that caused the cycle to fail.

---

## CLI Usage

```bash
npx agent-dream \
  --memory ./memory.md \
  --logs   ./logs \
  --state  ./state.json \
  --consolidator ./my-consolidator.js
```

The `--consolidator` module must export a function:

```js
// my-consolidator.js
module.exports = async function consolidate(longTermMemory, newLogs) {
  // Call your LLM here, or do simple text processing
  const entries = newLogs.map(l => `## ${l.date}\n${l.content}`).join('\n\n');
  return longTermMemory ? `${longTermMemory}\n\n${entries}` : entries;
};
```

The CLI accepts three export shapes: `module.exports = fn`, `module.exports.consolidate = fn`, or `module.exports.default = fn`.

---

## Individual Phase Exports

For power users who want to run phases individually:

```js
const { orient, gather, consolidate, prune } = require('agent-dream');

// Run orient manually
const { state, longTermMemory, unprocessedFiles } = await orient({
  memoryFile, logsDir, stateFile,
});

// Gather only specific files
const newLogs = await gather({ logsDir, unprocessedFiles });

// Consolidate with your own function
const updatedMemory = await consolidate({
  longTermMemory,
  newLogs,
  consolidateFn: async (mem, logs) => { /* ... */ },
});

// Write memory and update state
const newState = await prune({
  memoryFile, stateFile, updatedMemory, state, processedFiles: unprocessedFiles,
});
```

---

## Contributing

1. Fork the repo and create a feature branch.
2. `npm test` must pass (uses Jest).
3. Keep the zero-runtime-dependency policy — no new `dependencies` in `package.json`.
4. Open a PR with a clear description of what changed and why.

---

## License

MIT
