#!/usr/bin/env node

/**
 * Basic agent-dream example with a stub consolidation function.
 *
 * Setup:
 *   mkdir -p /tmp/agent-dream-demo/logs
 *   echo "# March 25\nLearned about agent memory." > /tmp/agent-dream-demo/logs/2026-03-25.md
 *   echo "# March 26\nBuilt the dream cycle." > /tmp/agent-dream-demo/logs/2026-03-26.md
 *
 * Run:
 *   node examples/basic.js
 */

const { dream } = require('../src/index');

async function main() {
  const result = await dream({
    memoryFile: '/tmp/agent-dream-demo/memory.md',
    logsDir: '/tmp/agent-dream-demo/logs',
    stateFile: '/tmp/agent-dream-demo/state.json',

    // Stub consolidation — just concatenates logs onto memory
    consolidate: async (longTermMemory, newLogs) => {
      const logSection = newLogs
        .map((log) => `## ${log.date}\n${log.content}`)
        .join('\n\n');

      return longTermMemory
        ? `${longTermMemory}\n\n${logSection}`
        : logSection;
    },

    onPhase: ({ name, status, meta }) => {
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      console.log(`[${name}] ${status}${metaStr}`);
    },
  });

  console.log(`\nProcessed: ${result.processed}, Skipped: ${result.skipped}`);
  console.log('\nUpdated memory:\n---');
  console.log(result.newMemory);
}

main().catch(console.error);
